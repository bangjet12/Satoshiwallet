"""Satoshi Lightning Wallet backend.

All routes are prefixed with /api (kubernetes ingress requirement).

Main flows:
  - /api/auth/signup, /api/auth/login, /api/auth/me
  - /api/wallet/balance
  - /api/receive/invoice  (creates BOLT11 via LNbits)
  - /api/receive/status/{payment_hash}  (poll, settles ledger when paid)
  - /api/send/decode  (decode pasted invoice/lightning address/username)
  - /api/send/pay  (debit user, pay via LNbits or internal transfer)
  - /api/transactions  (history)
  - /api/settings (toggle hide_balance)
  - /.well-known/lnurlp/{username}  (LNURL-pay metadata)  -> note: served at /api/lnurlp because of ingress
  - /api/lnurlp/{username}  (LNURL-pay metadata)
  - /api/lnurlp/{username}/callback (LNURL-pay -> invoice)
  - /api/users/{username}  (public lookup)

Ledger principle:
  - The LNbits wallet acts as the pooled custody account.
  - Each Satoshi user has a balance_sats stored in MongoDB.
  - Incoming: when an invoice is paid, we credit the user.
  - Outgoing: we deduct user balance, then call LNbits pay.
  - Internal transfer: instant ledger update between two users.
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv
from fastapi import APIRouter, Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth import (  # noqa: E402
    hash_pin,
    verify_pin,
    issue_token,
    get_current_user_payload,
)
from lnbits_client import (  # noqa: E402
    LNbitsError,
    create_invoice as lnbits_create_invoice,
    decode_invoice as lnbits_decode_invoice,
    get_payment as lnbits_get_payment,
    get_wallet as lnbits_get_wallet,
    pay_invoice as lnbits_pay_invoice,
)
from models import (  # noqa: E402
    AuthResponse,
    CreateInvoiceRequest,
    DecodeRequest,
    DecodedInvoice,
    InvoiceResponse,
    LoginRequest,
    PayRequest,
    SignupRequest,
    Transaction,
    TransactionPublic,
    UpdateSettingsRequest,
    UserDB,
    UserPublic,
)

LIGHTNING_ADDRESS_DOMAIN = os.environ.get("LIGHTNING_ADDRESS_DOMAIN", "satoshi.app")
MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
users_col = db["users"]
tx_col = db["transactions"]

app = FastAPI(title="Satoshi Wallet API")
api = APIRouter(prefix="/api")

logger = logging.getLogger("satoshi")
logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s :: %(message)s")


# ----------------------- helpers -----------------------


async def _ensure_indexes():
    await users_col.create_index("username", unique=True)
    await users_col.create_index("id", unique=True)
    await tx_col.create_index("id", unique=True)
    await tx_col.create_index([("user_id", 1), ("created_at", -1)])
    await tx_col.create_index("payment_hash")


@app.on_event("startup")
async def _startup():
    await _ensure_indexes()
    logger.info("Satoshi backend ready. LNbits=%s domain=%s", os.environ.get("LNBITS_URL"), LIGHTNING_ADDRESS_DOMAIN)


@app.on_event("shutdown")
async def _shutdown():
    client.close()


async def _load_user(user_id: str) -> UserDB:
    doc = await users_col.find_one({"id": user_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDB(**doc)


async def current_user(payload: dict = Depends(get_current_user_payload)) -> UserDB:
    return await _load_user(payload["sub"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


async def _save_tx(tx: Transaction) -> Transaction:
    doc = tx.model_dump()
    await tx_col.update_one({"id": tx.id}, {"$set": doc}, upsert=True)
    return tx


async def _update_tx_status(tx_id: str, status_: str, **extra) -> None:
    update = {"status": status_, "updated_at": _now_iso(), **extra}
    await tx_col.update_one({"id": tx_id}, {"$set": update})


async def _credit_user(user_id: str, sats: int) -> None:
    await users_col.update_one({"id": user_id}, {"$inc": {"balance_sats": int(sats)}})


async def _debit_user(user_id: str, sats: int) -> bool:
    """Atomic conditional decrement; returns False if insufficient funds."""
    res = await users_col.update_one(
        {"id": user_id, "balance_sats": {"$gte": int(sats)}},
        {"$inc": {"balance_sats": -int(sats)}},
    )
    return res.modified_count == 1


def _make_lightning_address(username: str) -> str:
    return f"{username}@{LIGHTNING_ADDRESS_DOMAIN}"


# ----------------------- public health -----------------------


@api.get("/")
async def root():
    return {"name": "Satoshi Wallet API", "status": "ok"}


@api.get("/health")
async def health():
    try:
        info = await lnbits_get_wallet()
        return {"ok": True, "lnbits": {"name": info.get("name"), "balance_msat": info.get("balance")}}
    except LNbitsError as e:
        return {"ok": False, "lnbits_error": str(e)}


# ----------------------- auth -----------------------


@api.post("/auth/signup", response_model=AuthResponse)
async def signup(req: SignupRequest):
    username = req.username.lower().strip()
    if await users_col.find_one({"username": username}):
        raise HTTPException(status_code=409, detail="Username already taken")
    user = UserDB(
        username=username,
        pin_hash=hash_pin(req.pin),
        lightning_address=_make_lightning_address(username),
    )
    await users_col.insert_one(user.model_dump())
    token = issue_token(user.id, user.username)
    return AuthResponse(token=token, user=user.public())


@api.post("/auth/login", response_model=AuthResponse)
async def login(req: LoginRequest):
    username = req.username.lower().strip()
    doc = await users_col.find_one({"username": username}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Username not found")
    user = UserDB(**doc)
    if not verify_pin(req.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Incorrect PIN")
    token = issue_token(user.id, user.username)
    return AuthResponse(token=token, user=user.public())


@api.get("/auth/me", response_model=UserPublic)
async def me(user: UserDB = Depends(current_user)):
    return user.public()


@api.get("/users/check/{username}")
async def check_username(username: str):
    username = username.lower().strip()
    exists = await users_col.find_one({"username": username}, {"_id": 0, "id": 1}) is not None
    return {"username": username, "available": not exists}


@api.get("/users/{username}", response_model=UserPublic)
async def get_user_public(username: str):
    username = username.lower().strip()
    doc = await users_col.find_one({"username": username}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    return UserDB(**doc).public()


# ----------------------- wallet & settings -----------------------


@api.get("/wallet/balance")
async def wallet_balance(user: UserDB = Depends(current_user)):
    fresh = await _load_user(user.id)
    return {
        "balance_sats": fresh.balance_sats,
        "hide_balance": fresh.hide_balance,
        "lightning_address": fresh.lightning_address,
    }


@api.patch("/settings", response_model=UserPublic)
async def update_settings(req: UpdateSettingsRequest, user: UserDB = Depends(current_user)):
    update = {}
    if req.hide_balance is not None:
        update["hide_balance"] = req.hide_balance
    if update:
        await users_col.update_one({"id": user.id}, {"$set": update})
    fresh = await _load_user(user.id)
    return fresh.public()


# ----------------------- receive -----------------------


@api.post("/receive/invoice", response_model=InvoiceResponse)
async def create_invoice(req: CreateInvoiceRequest, user: UserDB = Depends(current_user)):
    memo = (req.memo or f"Pay {user.username}").strip()[:200]
    try:
        result = await lnbits_create_invoice(
            amount_sats=req.amount_sats,
            memo=memo,
            expiry=3600,
            extra={"user_id": user.id, "username": user.username},
        )
    except LNbitsError as e:
        raise HTTPException(status_code=502, detail=f"LNbits error: {e}")

    bolt11 = result.get("bolt11") or result.get("payment_request") or ""
    payment_hash = result.get("payment_hash") or result.get("checking_id")
    if not bolt11 or not payment_hash:
        raise HTTPException(status_code=502, detail="Invalid LNbits response (no bolt11/hash)")

    tx = Transaction(
        user_id=user.id,
        kind="lightning_invoice",
        direction="in",
        status="pending",
        amount_sats=req.amount_sats,
        memo=memo,
        counterparty="external",
        payment_hash=payment_hash,
        bolt11=bolt11,
    )
    await _save_tx(tx)

    return InvoiceResponse(
        transaction_id=tx.id,
        payment_hash=payment_hash,
        bolt11=bolt11,
        amount_sats=req.amount_sats,
        memo=memo,
        expires_at=datetime.now(timezone.utc).isoformat(),
        lightning_address=user.lightning_address,
    )


@api.get("/receive/status/{payment_hash}")
async def receive_status(payment_hash: str, user: UserDB = Depends(current_user)):
    tx_doc = await tx_col.find_one({"payment_hash": payment_hash, "user_id": user.id}, {"_id": 0})
    if not tx_doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    tx = Transaction(**tx_doc)

    if tx.status == "completed":
        return {"paid": True, "status": tx.status, "transaction": tx.model_dump()}

    try:
        info = await lnbits_get_payment(payment_hash)
    except LNbitsError as e:
        raise HTTPException(status_code=502, detail=str(e))

    paid = bool(info.get("paid"))
    if paid and tx.status != "completed":
        await _credit_user(user.id, tx.amount_sats)
        await _update_tx_status(tx.id, "completed")
        tx_doc = await tx_col.find_one({"id": tx.id}, {"_id": 0})
        tx = Transaction(**tx_doc)
    return {"paid": paid, "status": tx.status, "transaction": tx.model_dump()}


# ----------------------- send / decode -----------------------


LN_ADDRESS_RE = re.compile(r"^[a-z0-9_.\-]+@[a-z0-9.\-]+\.[a-z]{2,}$", re.I)
BOLT11_RE = re.compile(r"^ln(bc|tb|bcrt)[0-9a-z]+$", re.I)


async def _resolve_lightning_address(address: str, amount_sats: Optional[int]) -> dict:
    """Resolve external/internal lightning address.
    For internal (@LIGHTNING_ADDRESS_DOMAIN) we shortcut to internal transfer info.
    For external, we hit /.well-known/lnurlp/{name}."""
    name, _, domain = address.partition("@")
    name = name.lower()
    domain = domain.lower()
    if domain == LIGHTNING_ADDRESS_DOMAIN.lower():
        target = await users_col.find_one({"username": name}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail=f"User {address} not found")
        return {
            "kind": "internal_username",
            "destination": address,
            "internal_recipient": UserDB(**target).public().model_dump(),
            "min_sendable_sats": 1,
            "max_sendable_sats": 10_000_000,
            "fixed_amount": False,
        }

    # external LNURL-pay
    import httpx
    url = f"https://{domain}/.well-known/lnurlp/{name}"
    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.get(url)
        if r.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Lightning Address not resolvable ({r.status_code})")
        data = r.json()
    if data.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=data.get("reason", "LNURL error"))
    min_sat = int(int(data.get("minSendable", 1000)) / 1000)
    max_sat = int(int(data.get("maxSendable", 100_000_000)) / 1000)
    return {
        "kind": "lightning_address",
        "destination": address,
        "min_sendable_sats": min_sat,
        "max_sendable_sats": max_sat,
        "fixed_amount": min_sat == max_sat,
        "lnurl_callback": data.get("callback"),
        "description": (data.get("metadata") or "")[:200],
    }


async def _fetch_invoice_from_lnurl(callback_url: str, amount_sats: int) -> str:
    import httpx
    async with httpx.AsyncClient(timeout=15.0) as c:
        r = await c.get(callback_url, params={"amount": int(amount_sats) * 1000})
        if r.status_code != 200:
            raise HTTPException(status_code=502, detail=f"LNURL callback failed: {r.status_code}")
        data = r.json()
    if data.get("status") == "ERROR":
        raise HTTPException(status_code=400, detail=data.get("reason", "LNURL callback error"))
    pr = data.get("pr")
    if not pr:
        raise HTTPException(status_code=502, detail="LNURL callback returned no invoice")
    return pr


@api.post("/send/decode", response_model=DecodedInvoice)
async def send_decode(req: DecodeRequest, user: UserDB = Depends(current_user)):
    data = req.data.strip()
    if data.lower().startswith("lightning:"):
        data = data.split(":", 1)[1].strip()

    # internal username (no @): user pastes another satoshi username
    if re.match(r"^[a-z0-9_]{3,20}$", data, re.I):
        target = await users_col.find_one({"username": data.lower()}, {"_id": 0})
        if target:
            tu = UserDB(**target).public()
            return DecodedInvoice(
                kind="internal_username",
                destination=tu.lightning_address,
                internal_recipient=tu,
                fixed_amount=False,
                min_sendable_sats=1,
                max_sendable_sats=10_000_000,
            )

    # lightning address
    if LN_ADDRESS_RE.match(data):
        resolved = await _resolve_lightning_address(data, None)
        return DecodedInvoice(**resolved)

    # BOLT11
    if BOLT11_RE.match(data):
        try:
            info = await lnbits_decode_invoice(data)
        except LNbitsError as e:
            raise HTTPException(status_code=400, detail=f"Invalid invoice: {e}")
        amount_msat = info.get("amount_msat") or 0
        amount_sats = int(amount_msat) // 1000 if amount_msat else None
        return DecodedInvoice(
            kind="bolt11",
            bolt11=data,
            amount_sats=amount_sats,
            description=info.get("description", ""),
            destination=info.get("payee") or info.get("payment_hash"),
            fixed_amount=bool(amount_sats and amount_sats > 0),
        )

    raise HTTPException(status_code=400, detail="Could not recognize input format")


@api.post("/send/pay")
async def send_pay(req: PayRequest, user: UserDB = Depends(current_user)):
    if not verify_pin(req.pin, user.pin_hash):
        raise HTTPException(status_code=401, detail="Incorrect PIN")

    data = req.data.strip()
    if data.lower().startswith("lightning:"):
        data = data.split(":", 1)[1].strip()

    # ----------- INTERNAL transfer -----------
    internal_username: Optional[str] = None
    if re.match(r"^[a-z0-9_]{3,20}$", data, re.I):
        internal_username = data.lower()
    elif LN_ADDRESS_RE.match(data):
        name, _, domain = data.partition("@")
        if domain.lower() == LIGHTNING_ADDRESS_DOMAIN.lower():
            internal_username = name.lower()

    if internal_username:
        if internal_username == user.username:
            raise HTTPException(status_code=400, detail="Can't send to yourself")
        target = await users_col.find_one({"username": internal_username}, {"_id": 0})
        if not target:
            raise HTTPException(status_code=404, detail="Recipient not found")
        target_user = UserDB(**target)
        amount = int(req.amount_sats or 0)
        if amount <= 0:
            raise HTTPException(status_code=400, detail="Amount required for internal transfer")
        ok = await _debit_user(user.id, amount)
        if not ok:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        await _credit_user(target_user.id, amount)
        memo = (req.memo or f"To @{internal_username}")[:200]
        out_tx = Transaction(
            user_id=user.id,
            kind="internal_transfer",
            direction="out",
            status="completed",
            amount_sats=amount,
            memo=memo,
            counterparty=target_user.lightning_address,
        )
        in_tx = Transaction(
            user_id=target_user.id,
            kind="internal_transfer",
            direction="in",
            status="completed",
            amount_sats=amount,
            memo=memo,
            counterparty=user.lightning_address,
        )
        await _save_tx(out_tx)
        await _save_tx(in_tx)
        return {"ok": True, "transaction": out_tx.model_dump(), "kind": "internal_transfer"}

    # ----------- EXTERNAL Lightning Address -----------
    bolt11_to_pay: Optional[str] = None
    amount_to_debit: int = 0
    counterparty = ""
    memo = (req.memo or "").strip()[:200]

    if LN_ADDRESS_RE.match(data):
        resolved = await _resolve_lightning_address(data, req.amount_sats)
        amount = int(req.amount_sats or 0)
        if not amount:
            raise HTTPException(status_code=400, detail="Amount required for Lightning Address")
        cb = resolved.get("lnurl_callback")
        if not cb:
            raise HTTPException(status_code=400, detail="No LNURL callback")
        bolt11_to_pay = await _fetch_invoice_from_lnurl(cb, amount)
        amount_to_debit = amount
        counterparty = data
    elif BOLT11_RE.match(data):
        try:
            info = await lnbits_decode_invoice(data)
        except LNbitsError as e:
            raise HTTPException(status_code=400, detail=str(e))
        amount_sats = int(int(info.get("amount_msat") or 0) // 1000)
        if amount_sats <= 0:
            # zero-amount invoice — require explicit amount
            if not req.amount_sats:
                raise HTTPException(status_code=400, detail="This invoice has no amount; please specify one")
            amount_sats = int(req.amount_sats)
        bolt11_to_pay = data
        amount_to_debit = amount_sats
        counterparty = (info.get("description") or info.get("payee") or "external")[:80]
        memo = memo or info.get("description", "")
    else:
        raise HTTPException(status_code=400, detail="Unsupported input")

    # debit first (reservation)
    ok = await _debit_user(user.id, amount_to_debit)
    if not ok:
        raise HTTPException(status_code=400, detail="Insufficient balance")

    out_tx = Transaction(
        user_id=user.id,
        kind="lightning_pay",
        direction="out",
        status="pending",
        amount_sats=amount_to_debit,
        memo=memo,
        counterparty=counterparty,
        bolt11=bolt11_to_pay,
    )
    await _save_tx(out_tx)

    try:
        pay_result = await lnbits_pay_invoice(bolt11_to_pay)
        payment_hash = pay_result.get("payment_hash") or pay_result.get("checking_id")
        await _update_tx_status(out_tx.id, "completed", payment_hash=payment_hash)
        return {"ok": True, "transaction_id": out_tx.id, "payment_hash": payment_hash, "kind": "lightning_pay"}
    except LNbitsError as e:
        # refund
        await _credit_user(user.id, amount_to_debit)
        await _update_tx_status(out_tx.id, "failed", memo=(memo + f" | error: {str(e)[:100]}").strip())
        raise HTTPException(status_code=502, detail=f"Payment failed: {e}")


# ----------------------- transactions -----------------------


@api.get("/transactions", response_model=List[TransactionPublic])
async def list_transactions(user: UserDB = Depends(current_user), limit: int = 50, status_filter: Optional[str] = None):
    q: dict = {"user_id": user.id}
    if status_filter and status_filter != "all":
        q["status"] = status_filter
    cursor = tx_col.find(q, {"_id": 0}).sort("created_at", -1).limit(int(limit))
    rows = await cursor.to_list(length=int(limit))
    return [TransactionPublic(**r) for r in rows]


@api.get("/transactions/{tx_id}", response_model=TransactionPublic)
async def get_transaction(tx_id: str, user: UserDB = Depends(current_user)):
    doc = await tx_col.find_one({"id": tx_id, "user_id": user.id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Not found")
    return TransactionPublic(**doc)


# ----------------------- LNURL-pay endpoint (for receiving from other wallets) -----------------------


@api.get("/lnurlp/{username}")
async def lnurlp_info(username: str):
    """LNURL-pay metadata for username@satoshi.app.

    External wallets first GET this, then GET the callback with an amount to obtain a bolt11.
    The bolt11 is created via our admin LNbits wallet; when paid, the next status poll
    on this user's wallet will credit them. However since the invoice is associated to
    the user via 'extra', incoming receive-status polling for that user covers it.
    """
    username = username.lower().strip()
    doc = await users_col.find_one({"username": username}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    user = UserDB(**doc)
    callback = f"/api/lnurlp/{username}/callback"
    metadata = f'[["text/identifier","{user.lightning_address}"],["text/plain","Pay {user.username} on Satoshi"]]'
    return {
        "callback": callback,
        "maxSendable": 100_000_000_000,  # 100M sats * 1000 msat
        "minSendable": 1_000,  # 1 sat in msat
        "metadata": metadata,
        "tag": "payRequest",
    }


@api.get("/lnurlp/{username}/callback")
async def lnurlp_callback(username: str, amount: int):
    """amount is in millisats per LNURL spec."""
    username = username.lower().strip()
    doc = await users_col.find_one({"username": username}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="User not found")
    user = UserDB(**doc)
    amount_sats = int(amount) // 1000
    if amount_sats <= 0:
        raise HTTPException(status_code=400, detail="Amount too small")
    try:
        result = await lnbits_create_invoice(
            amount_sats=amount_sats,
            memo=f"Pay {user.username} via LNURL",
            expiry=3600,
            extra={"user_id": user.id, "username": user.username, "source": "lnurlp"},
        )
    except LNbitsError as e:
        raise HTTPException(status_code=502, detail=str(e))
    bolt11 = result.get("bolt11") or result.get("payment_request") or ""
    payment_hash = result.get("payment_hash") or result.get("checking_id")
    tx = Transaction(
        user_id=user.id,
        kind="lightning_invoice",
        direction="in",
        status="pending",
        amount_sats=amount_sats,
        memo=f"LNURL pay",
        counterparty="lnurl",
        payment_hash=payment_hash,
        bolt11=bolt11,
    )
    await _save_tx(tx)
    return {"pr": bolt11, "routes": []}


# ----------------------- mount -----------------------

app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
