"""
POC: Test LNbits integration end-to-end.

We must verify the credentials work and that we can:
  1. Fetch wallet info (admin key)
  2. Create a Lightning invoice (invoice key)
  3. Decode a BOLT11 invoice
  4. Check invoice/payment status by payment_hash

If everything below prints PASS, we're good to build the app.
"""
import requests
import json
import sys

LNBITS_URL = "https://demo.lnbits.com"
ADMIN_KEY = "6a7782eec0fd420181936c2e3f3604e9"
INVOICE_KEY = "c4b0374d2a534620adca8a74173eedd7"

PASSED = []
FAILED = []


def log(name, ok, detail=""):
    tag = "PASS" if ok else "FAIL"
    print(f"[{tag}] {name}")
    if detail:
        print(f"       {detail}")
    (PASSED if ok else FAILED).append(name)


def test_wallet_info():
    """GET /api/v1/wallet — should return balance + wallet id/name."""
    try:
        r = requests.get(
            f"{LNBITS_URL}/api/v1/wallet",
            headers={"X-Api-Key": ADMIN_KEY, "Content-Type": "application/json"},
            timeout=15,
        )
        ok = r.status_code == 200 and "balance" in r.text
        log(
            "wallet_info (admin key)",
            ok,
            f"status={r.status_code} body={r.text[:200]}",
        )
        return r.json() if ok else None
    except Exception as e:
        log("wallet_info (admin key)", False, str(e))
        return None


def test_wallet_info_with_invoice_key():
    """LNbits accepts invoice key for read-only too."""
    try:
        r = requests.get(
            f"{LNBITS_URL}/api/v1/wallet",
            headers={"X-Api-Key": INVOICE_KEY, "Content-Type": "application/json"},
            timeout=15,
        )
        ok = r.status_code == 200
        log("wallet_info (invoice key)", ok, f"status={r.status_code}")
        return r.json() if ok else None
    except Exception as e:
        log("wallet_info (invoice key)", False, str(e))
        return None


def test_create_invoice():
    """POST /api/v1/payments  body: {out:false, amount, memo}.
    Should return payment_hash and bolt11/payment_request."""
    try:
        payload = {
            "out": False,
            "amount": 21,  # 21 sats
            "memo": "Satoshi Wallet POC test invoice",
            "unit": "sat",
        }
        r = requests.post(
            f"{LNBITS_URL}/api/v1/payments",
            headers={"X-Api-Key": INVOICE_KEY, "Content-Type": "application/json"},
            data=json.dumps(payload),
            timeout=20,
        )
        if r.status_code not in (200, 201):
            log("create_invoice", False, f"status={r.status_code} body={r.text[:300]}")
            return None
        data = r.json()
        bolt11 = data.get("bolt11") or data.get("payment_request")
        payment_hash = data.get("payment_hash") or data.get("checking_id")
        ok = bool(bolt11) and bool(payment_hash)
        log(
            "create_invoice",
            ok,
            f"payment_hash={payment_hash[:16] if payment_hash else None}... "
            f"bolt11_len={len(bolt11) if bolt11 else 0}",
        )
        return data if ok else None
    except Exception as e:
        log("create_invoice", False, str(e))
        return None


def test_decode_invoice(bolt11: str):
    """POST /api/v1/payments/decode body:{data: bolt11}"""
    try:
        r = requests.post(
            f"{LNBITS_URL}/api/v1/payments/decode",
            headers={"X-Api-Key": INVOICE_KEY, "Content-Type": "application/json"},
            data=json.dumps({"data": bolt11}),
            timeout=15,
        )
        if r.status_code != 200:
            log("decode_invoice", False, f"status={r.status_code} body={r.text[:200]}")
            return None
        data = r.json()
        ok = "amount_msat" in data or "amount" in data or "num_satoshis" in data or "payment_hash" in data
        log("decode_invoice", ok, f"keys={list(data.keys())[:10]}")
        return data if ok else None
    except Exception as e:
        log("decode_invoice", False, str(e))
        return None


def test_payment_status(payment_hash: str):
    """GET /api/v1/payments/{hash}"""
    try:
        r = requests.get(
            f"{LNBITS_URL}/api/v1/payments/{payment_hash}",
            headers={"X-Api-Key": INVOICE_KEY},
            timeout=15,
        )
        if r.status_code != 200:
            log("payment_status", False, f"status={r.status_code} body={r.text[:200]}")
            return None
        data = r.json()
        # paid=false expected since we haven't paid the invoice
        log("payment_status", True, f"paid={data.get('paid')} keys={list(data.keys())[:8]}")
        return data
    except Exception as e:
        log("payment_status", False, str(e))
        return None


def test_list_payments():
    """GET /api/v1/payments — list all payments in the wallet (for history)."""
    try:
        r = requests.get(
            f"{LNBITS_URL}/api/v1/payments",
            headers={"X-Api-Key": INVOICE_KEY},
            timeout=15,
        )
        ok = r.status_code == 200 and isinstance(r.json(), list)
        log("list_payments", ok, f"status={r.status_code} count={len(r.json()) if ok else 'n/a'}")
        return r.json() if ok else None
    except Exception as e:
        log("list_payments", False, str(e))
        return None


def main():
    print("=" * 60)
    print("LNbits POC — Satoshi Wallet")
    print(f"Endpoint: {LNBITS_URL}")
    print("=" * 60)

    test_wallet_info()
    test_wallet_info_with_invoice_key()

    invoice = test_create_invoice()
    if invoice:
        bolt11 = invoice.get("bolt11") or invoice.get("payment_request")
        payment_hash = invoice.get("payment_hash") or invoice.get("checking_id")
        if bolt11:
            test_decode_invoice(bolt11)
        if payment_hash:
            test_payment_status(payment_hash)

    test_list_payments()

    print("=" * 60)
    print(f"PASSED: {len(PASSED)}  FAILED: {len(FAILED)}")
    if FAILED:
        print("Failed tests:", FAILED)
        sys.exit(1)
    print("ALL POC TESTS PASSED — safe to build the app.")
    sys.exit(0)


if __name__ == "__main__":
    main()
