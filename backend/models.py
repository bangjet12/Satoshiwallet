"""Pydantic models used across the wallet API."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone
from typing import Literal, Optional

from pydantic import BaseModel, Field, ConfigDict


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


TxStatus = Literal["pending", "completed", "failed"]
TxDirection = Literal["in", "out"]
TxKind = Literal["lightning_invoice", "lightning_pay", "internal_transfer"]


class SignupRequest(BaseModel):
    username: str = Field(min_length=3, max_length=20, pattern=r"^[a-z0-9_]+$")
    pin: str = Field(min_length=4, max_length=8, pattern=r"^[0-9]+$")


class LoginRequest(BaseModel):
    username: str
    pin: str


class AuthResponse(BaseModel):
    token: str
    user: "UserPublic"


class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    lightning_address: str
    balance_sats: int = 0
    hide_balance: bool = False
    created_at: str


class UserDB(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    username: str
    pin_hash: str
    lightning_address: str
    balance_sats: int = 0
    hide_balance: bool = False
    created_at: str = Field(default_factory=_now_iso)

    def public(self) -> UserPublic:
        return UserPublic(
            id=self.id,
            username=self.username,
            lightning_address=self.lightning_address,
            balance_sats=self.balance_sats,
            hide_balance=self.hide_balance,
            created_at=self.created_at,
        )


class CreateInvoiceRequest(BaseModel):
    amount_sats: int = Field(gt=0, le=10_000_000)
    memo: Optional[str] = ""


class InvoiceResponse(BaseModel):
    transaction_id: str
    payment_hash: str
    bolt11: str
    amount_sats: int
    memo: str
    expires_at: str
    lightning_address: str


class DecodeRequest(BaseModel):
    data: str  # bolt11 or lightning address or lnurl


class DecodedInvoice(BaseModel):
    kind: Literal["bolt11", "lightning_address", "internal_username"]
    bolt11: Optional[str] = None
    amount_sats: Optional[int] = None
    description: Optional[str] = None
    destination: Optional[str] = None  # username@domain or pubkey
    internal_recipient: Optional["UserPublic"] = None
    fixed_amount: bool = True  # false if user can choose (lightning address before callback)
    min_sendable_sats: Optional[int] = None
    max_sendable_sats: Optional[int] = None
    lnurl_callback: Optional[str] = None


class PayRequest(BaseModel):
    data: str  # original input (bolt11 / lightning address / username)
    amount_sats: Optional[int] = None  # required if lightning address with variable amount
    pin: str
    memo: Optional[str] = ""


class Transaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    kind: TxKind
    direction: TxDirection
    status: TxStatus = "pending"
    amount_sats: int
    fee_sats: int = 0
    memo: str = ""
    counterparty: str = ""  # lightning address / username / external
    payment_hash: Optional[str] = None
    bolt11: Optional[str] = None
    created_at: str = Field(default_factory=_now_iso)
    updated_at: str = Field(default_factory=_now_iso)


class TransactionPublic(BaseModel):
    id: str
    kind: TxKind
    direction: TxDirection
    status: TxStatus
    amount_sats: int
    fee_sats: int
    memo: str
    counterparty: str
    payment_hash: Optional[str]
    bolt11: Optional[str]
    created_at: str
    updated_at: str


class UpdateSettingsRequest(BaseModel):
    hide_balance: Optional[bool] = None


DecodedInvoice.model_rebuild()
AuthResponse.model_rebuild()
