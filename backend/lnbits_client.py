"""Thin async wrapper around LNbits REST API.

We use httpx to talk to LNbits. All errors are raised as LNbitsError with a
user-friendly message + raw upstream payload for logging.
"""
from __future__ import annotations

import os
import logging
from typing import Any, Dict, Optional

import httpx

logger = logging.getLogger("lnbits")

LNBITS_URL = os.environ.get("LNBITS_URL", "https://demo.lnbits.com").rstrip("/")
ADMIN_KEY = os.environ.get("LNBITS_ADMIN_KEY", "")
INVOICE_KEY = os.environ.get("LNBITS_INVOICE_KEY", "")


class LNbitsError(Exception):
    def __init__(self, message: str, status: int = 0, payload: Any = None):
        super().__init__(message)
        self.message = message
        self.status = status
        self.payload = payload


async def _request(method: str, path: str, *, key: str, json: Optional[dict] = None, params: Optional[dict] = None) -> Any:
    url = f"{LNBITS_URL}{path}"
    headers = {"X-Api-Key": key, "Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=20.0) as client:
        try:
            r = await client.request(method, url, headers=headers, json=json, params=params)
        except httpx.HTTPError as e:
            raise LNbitsError(f"Network error talking to LNbits: {e}")
    if r.status_code >= 400:
        try:
            payload = r.json()
            detail = payload.get("detail") or payload.get("message") or r.text
        except Exception:
            payload = r.text
            detail = r.text
        logger.warning("LNbits %s %s -> %s: %s", method, path, r.status_code, detail)
        raise LNbitsError(str(detail), status=r.status_code, payload=payload)
    try:
        return r.json()
    except Exception:
        return r.text


async def get_wallet() -> Dict[str, Any]:
    """Returns wallet info (name, balance in millisats, id)."""
    return await _request("GET", "/api/v1/wallet", key=ADMIN_KEY)


async def create_invoice(amount_sats: int, memo: str = "", expiry: int = 3600, extra: Optional[dict] = None) -> Dict[str, Any]:
    """Create a BOLT11 invoice. Returns dict with payment_hash + bolt11/payment_request."""
    if amount_sats <= 0:
        raise LNbitsError("Amount must be greater than 0 sats")
    payload = {
        "out": False,
        "amount": int(amount_sats),
        "memo": memo or "Satoshi Wallet",
        "unit": "sat",
        "expiry": int(expiry),
    }
    if extra:
        payload["extra"] = extra
    return await _request("POST", "/api/v1/payments", key=INVOICE_KEY, json=payload)


async def decode_invoice(bolt11: str) -> Dict[str, Any]:
    return await _request("POST", "/api/v1/payments/decode", key=INVOICE_KEY, json={"data": bolt11})


async def get_payment(payment_hash: str) -> Dict[str, Any]:
    return await _request("GET", f"/api/v1/payments/{payment_hash}", key=INVOICE_KEY)


async def pay_invoice(bolt11: str) -> Dict[str, Any]:
    """Pay an outbound invoice. Requires admin key + sufficient balance in LNbits wallet."""
    payload = {"out": True, "bolt11": bolt11}
    return await _request("POST", "/api/v1/payments", key=ADMIN_KEY, json=payload)
