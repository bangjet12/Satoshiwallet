# plan.md — Satoshi Lightning Wallet (LNbits)

## 1) Objectives
- Prove LNbits integration works end-to-end for **invoice creation + status + decode** using provided keys.
- Build MVP “Satoshi” wallet UI mirroring Tether screenshot: centered balance, eye toggle, Transactions, bottom pill (Receive | Send) with orange accent (#F7931A).
- Support real Lightning flows via LNbits for **Receive** and **external Send**, plus **instant internal transfers** via MongoDB ledger.
- Provide Lightning Address per user: `username@satoshi.app` with LNURL-pay endpoint that returns an invoice.
- Add Username+PIN auth after core flows are stable.

## 2) Implementation Steps

### Phase 1 — Core POC (LNbits in isolation)
**Goal:** Don’t proceed until LNbits calls succeed reliably.
1. Web research: confirm latest LNbits API endpoints for invoice/payments/decode + common error codes.
2. Create a minimal Python script (`poc_lnbits.py`) using:
   - Base URL: `https://demo.lnbits.com`
   - Invoice key for invoice creation/read; Admin key for privileged ops.
3. POC checks (must pass):
   - `GET /api/v1/wallet` (wallet info) with Admin key.
   - `POST /api/v1/payments` with `out:false` to create BOLT11 invoice.
   - `GET /api/v1/payments/{payment_hash}` to fetch payment status.
   - `GET /api/v1/payments/decode?data={bolt11}` (or relevant endpoint) to decode invoice.
4. Document integration playbook (headers, payloads, expected responses, retries/timeouts).
5. If any call fails: iterate until fixed (URL normalization, headers, endpoint variants, query params).

**Phase 1 user stories**
1. As a developer, I can fetch LNbits wallet info to verify credentials are valid.
2. As a developer, I can create a Lightning invoice and receive a BOLT11 string.
3. As a developer, I can decode a BOLT11 invoice to show amount/description.
4. As a developer, I can query invoice payment status by payment_hash.
5. As a developer, I can reliably handle LNbits errors (401/422/5xx) with clear logs.

---

### Phase 2 — V1 App Development (no auth initially)
**Goal:** Working wallet flows using a single “demo user” to validate UX + data flow.
1. Backend (FastAPI)
   - Config: LNbits base URL + keys (env vars), sats↔USD rate (stub or simple external rate API later).
   - Core endpoints (MVP):
     - `POST /receive/invoice` (amount_sats, memo, user_id) → creates invoice via LNbits, stores `invoice_id/payment_hash`, returns bolt11 + qr.
     - `GET /receive/status/{payment_hash}` → checks LNbits status; if paid, credits MongoDB ledger.
     - `POST /send/decode` → decode pasted/scanned bolt11.
     - `POST /send/pay` → (for now) simulate confirmation; optionally block actual payment until funded.
     - `GET /txns` → list transactions (pending/complete/failed).
     - `POST /lnurlp/{username}` → LNURL-pay: returns callback + metadata.
     - `GET /lnurlp/{username}/callback?amount=...` → returns invoice (mints via LNbits) and associates to that username.
   - MongoDB models: User (placeholder), Ledger balances in sats, Transactions.
   - Background/polling: simple client polling for pending invoices (no websockets in V1).
2. Frontend (React + shadcn/ui)
   - Home screen (Tether-like): balance (sats + USD), eye toggle, Transactions link, bottom pill Receive/Send (orange accent).
   - Receive flow: amount → create invoice → show QR + bolt11 copy.
   - Send flow: paste bolt11 / lightning address / scan QR → decode → confirm screen.
   - Transactions screen: list, details, status, pull-to-refresh.
   - QR scanner: browser camera (fallback to file upload if camera denied).
3. Internal transfers (V1 without auth)
   - If input matches `^username@satoshi\.app$`, treat as internal: create ledger transfer instantly, record txns.
   - Otherwise: LNURL-pay resolve (via our own LNURL endpoint) or bolt11 decode.
4. End-to-end test run (manual + automated smoke): receive invoice → mark paid (if possible) or validate pending → ensure history updates.
5. One round E2E testing via testing agent.

**Phase 2 user stories**
1. As a user, I see my wallet balance on the home screen in a clean Tether-like layout.
2. As a user, I can hide/show my balance using the eye icon.
3. As a user, I can generate a Receive invoice with an amount and display it as a QR.
4. As a user, I can paste or scan a BOLT11 invoice and preview details before paying.
5. As a user, I can view a transaction history with clear statuses.

---

### Phase 3 — Add Auth + Multi-user + Real Send
**Goal:** Turn V1 into a real multi-user custodial wallet.
1. Auth (Username + 6-digit PIN)
   - Signup/login, PIN hashing (bcrypt/argon2), JWT sessions.
   - Lock screens: require PIN to confirm send.
2. Multi-user ledger
   - Per-user balances + atomic ledger updates (Mongo transaction or app-level idempotency).
   - Rate limiting + basic abuse protection.
3. Real external Send
   - Enable `POST /send/pay` to call LNbits `out:true` payment.
   - Idempotency keys for payments; store LNbits `payment_hash` and final status.
4. Lightning Address end-to-end
   - `username@satoshi.app` LNURL-pay works for any user; invoice credited to correct user when paid.
5. One round E2E testing via testing agent.

**Phase 3 user stories**
1. As a new user, I can sign up with a username and 6-digit PIN.
2. As a returning user, I can log in quickly and see only my own balance and history.
3. As a user, I must confirm outgoing payments with my PIN.
4. As a user, I can send sats instantly to another Satoshi user by Lightning Address.
5. As a user, I can pay an external exchange invoice and see final success/failure.

---

### Phase 4 — Hardening, Monitoring, Production readiness
1. Webhooks (if available) to replace polling for invoice paid events.
2. Robust LNURL parsing + broader invoice formats; better fee/route error messaging.
3. Security: secrets management, CORS, audit logs, replay protection, input validation.
4. UI polish: empty states, error states, skeleton loaders, accessibility.
5. Load testing on transaction endpoints + DB indexes.

**Phase 4 user stories**
1. As a user, I get clear error messages when a payment fails (insufficient balance/route failure).
2. As a user, my receive invoices update automatically without manual refresh.
3. As an operator, I can monitor LNbits/API failures and transaction anomalies.
4. As a user, I can recover from accidental refresh without losing in-progress invoice data.
5. As a user, I trust my balance consistency across devices.

## 3) Next Actions
1. Run Phase 1 POC script against `https://demo.lnbits.com` with provided keys and capture responses.
2. Confirm exact LNbits decode endpoint variant (depends on LNbits version) and finalize integration playbook.
3. Implement Phase 2 backend endpoints + Mongo schema + minimal frontend shell (Home/Receive/Send/Txns).
4. First full E2E: create invoice → display QR → check status polling → txn history reflects changes.

## 4) Success Criteria
- POC: wallet info fetch + invoice create + invoice decode + status check all succeed consistently.
- V1: user can Receive (QR + bolt11), Send (decode + confirm), and view transaction history.
- Internal transfers update balances instantly and are reflected in history.
- Lightning Address (`username@satoshi.app`) resolves via LNURL-pay and can generate an invoice.
- No broken states: clear handling for invalid invoice, insufficient balance, and LNbits downtime.