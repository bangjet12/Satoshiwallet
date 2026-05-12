# plan.md — Satoshi Lightning Wallet (LNbits)

## 1) Objectives
- ✅ **LNbits Real Lightning integration (demo.lnbits.com)** proven and implemented end-to-end:
  - wallet info, create invoice, decode BOLT11, check status, pay invoice (admin key), list payments.
- ✅ Build MVP “Satoshi” wallet UI mirroring the provided Tether screenshot:
  - monochrome dark UI + disciplined Bitcoin orange accent (#F7931A) on primary CTAs.
- ✅ Support real Lightning flows via LNbits for **Receive** + **external Send**, plus **instant internal transfers** via MongoDB ledger.
- ✅ Provide Lightning Address per user: `username@satoshi.app` with LNURL-pay endpoint + callback.
- ✅ Add Username + 6-digit PIN auth (JWT sessions) and PIN-confirmation for outgoing payments.
- ⏭️ Next objective (optional, not started): move from polling to webhooks, PWA polish, i18n/currency options, and production hardening.

## 2) Implementation Steps

### Phase 1 — Core POC (LNbits in isolation) ✅ COMPLETED
**Goal:** Don’t proceed until LNbits calls succeed reliably.
1. Confirm LNbits API endpoints for invoice/payments/decode + common error codes.
2. Create a minimal Python script (`poc_lnbits.py`) using:
   - Base URL: `https://demo.lnbits.com`
   - Invoice key for invoice creation/read; Admin key for privileged ops.
3. POC checks (passed):
   - `GET /api/v1/wallet` (wallet info)
   - `POST /api/v1/payments` with `out:false` to create invoice
   - `POST /api/v1/payments/decode` to decode BOLT11
   - `GET /api/v1/payments/{payment_hash}` to check paid status
   - `GET /api/v1/payments` to list payments
4. Record integration playbook (headers, payloads, expected responses, retries/timeouts).

**Phase 1 user stories (done)**
1. ✅ Fetch LNbits wallet info to verify credentials.
2. ✅ Create a Lightning invoice and receive BOLT11.
3. ✅ Decode a BOLT11 invoice.
4. ✅ Query invoice payment status by payment_hash.
5. ✅ Handle LNbits failures with clear backend errors.

---

### Phase 2 — V1 App Development (MVP) ✅ COMPLETED
**Goal:** Working multi-user wallet flows with real Lightning (custodial pool model).

#### 2.1 Backend (FastAPI + MongoDB + LNbits) ✅
- Environment configuration added:
  - `LNBITS_URL`, `LNBITS_ADMIN_KEY`, `LNBITS_INVOICE_KEY`, `JWT_SECRET`, `LIGHTNING_ADDRESS_DOMAIN`, Mongo config.
- Implemented auth & security:
  - Username + 6-digit PIN signup/login
  - bcrypt-hashed PIN, JWT (30-day) sessions
- Implemented wallet/ledger model:
  - LNbits wallet as pooled custody account
  - Per-user `balance_sats` in MongoDB
  - Atomic debit check for sending
- Implemented endpoints (final paths):
  - **Health:** `GET /api/health`
  - **Auth:** `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
  - **Users:** `GET /api/users/check/{username}`, `GET /api/users/{username}`
  - **Wallet:** `GET /api/wallet/balance`
  - **Settings:** `PATCH /api/settings`
  - **Receive:** `POST /api/receive/invoice`, `GET /api/receive/status/{payment_hash}` (credits balance when paid)
  - **Send:** `POST /api/send/decode`, `POST /api/send/pay`
    - Supports BOLT11, Lightning Address (LNURL-pay), @username / `username@satoshi.app` internal transfers
  - **Transactions:** `GET /api/transactions`, `GET /api/transactions/{tx_id}`
  - **LNURL-pay (Lightning Address receive):**
    - `GET /api/lnurlp/{username}`
    - `GET /api/lnurlp/{username}/callback?amount=<msat>` → returns `{ pr }` and creates pending invoice transaction
- E2E backend test status:
  - ✅ 34/34 tests passed (auth, receive invoice creation, decode, internal transfer, tx isolation, LNURL endpoints).

#### 2.2 Frontend (React + shadcn/ui + Tailwind) ✅
- Tether-style monochrome UI + orange accent implemented.
- Screens/components delivered:
  - **AuthScreen:** username + PIN entry + confirm (signup) / login
  - **WalletHome:**
    - brand mark `satoshi.`
    - “Total Wallet Balance” + eye toggle
    - oversized Cormorant Garamond USD display + sats secondary
    - Transactions link
    - quick receive/send cards
    - BTC/USD price card
    - bottom floating action pill (Receive | Send)
  - **ReceiveSheet:**
    - numeric pad + memo
    - generate LNbits BOLT11 invoice + QR
    - copy/share
    - auto-poll invoice status + “paid” overlay state
  - **SendSheet:**
    - paste invoice/lightning address/@username
    - clipboard paste + QR scanner modal (html5-qrcode)
    - decode preview
    - amount entry (if needed)
    - “review & pay” → PIN confirmation → result (success/failure)
  - **TransactionsScreen:** filter tabs (all/pending/completed/failed), list rows, detail sheet with copy invoice
  - **SettingsScreen:** lightning address copy, hide balance toggle, logout
- Frontend bug fixed:
  - ✅ Eye-toggle race condition with polling fixed; retested at 100%.

**Phase 2 user stories (done)**
1. ✅ User sees wallet balance on home screen in Tether-like layout.
2. ✅ User can hide/show balance using eye icon (stable across polling + navigation).
3. ✅ User can generate Receive invoice (BOLT11 + QR) and copy/share it.
4. ✅ User can paste/scan to decode a BOLT11 or Lightning Address before paying.
5. ✅ User can confirm outgoing payments using PIN.
6. ✅ User can send sats instantly to another Satoshi user via @username or `username@satoshi.app`.
7. ✅ User can view transaction history and open transaction details.

---

### Phase 3 — Product Enhancements (optional / not started)
**Goal:** Improve UX reliability + app installability + broader payment compatibility.
1. **Webhooks (replace polling):**
   - Use LNbits webhook (if available) or a trusted event source to settle invoices without client polling.
2. **PWA polish:**
   - Add manifest + icons + install prompt; offline-friendly shell.
3. **Localization & currency display:**
   - Add Bahasa Indonesia strings; optional display BTC ↔ USD ↔ IDR; formatting settings.
4. **Better payment parsing:**
   - More robust LNURL / `lightning:` URI parsing; better zero-amount invoice UX.
5. **Observability:**
   - Structured logs for payments, correlation IDs; basic admin health dashboard.

**Phase 3 user stories (planned)**
1. As a user, my incoming invoices update automatically without waiting.
2. As a user, I can install the wallet as an app (PWA) on iOS/Android.
3. As a user, I can view balance in USD or IDR.
4. As a user, Lightning Address + LNURL inputs “just work” across more wallet formats.

---

### Phase 4 — Production Hardening & Operations (optional / not started)
**Goal:** Make the wallet production-grade.
1. **Security & abuse protection:**
   - rate limiting, brute-force PIN protection, lockouts, device/session management.
2. **Secrets & environment management:**
   - vault/secret manager integration; remove keys from source.
3. **Ledger correctness:**
   - idempotency keys for send/pay; stronger consistency guarantees; reconciliation job with LNbits.
4. **Compliance/ops:**
   - audit logs, admin tooling, monitoring/alerts.
5. **Performance:**
   - DB indexes review; load testing for tx endpoints.

**Phase 4 user stories (planned)**
1. As a user, I get clear error messages on failure and my balance stays consistent.
2. As an operator, I can monitor LNbits/API failures and payment anomalies.
3. As an operator, I can investigate transactions via audit logs.

## 3) Next Actions
- ✅ (Done) LNbits POC script execution and validation.
- ✅ (Done) Implement backend endpoints + MongoDB schema + LNbits integration.
- ✅ (Done) Implement frontend screens (Auth/Home/Receive/Send/Transactions/Settings) and finalize styling.
- ✅ (Done) E2E testing: backend 34/34, frontend 100% after eye-toggle fix.
- ⏭️ (Optional) Start Phase 3 if requested:
  1. Add webhook-based invoice settlement.
  2. Add PWA manifest + icons.
  3. Add ID localization + IDR display.

## 4) Success Criteria
- ✅ LNbits integration: wallet info + invoice create + decode + status check + pay invoice work.
- ✅ MVP usability: Receive (QR + BOLT11), Send (decode + PIN confirm), internal transfers, transaction history.
- ✅ Lightning Address: `username@satoshi.app` LNURL-pay endpoint returns invoice and credits correct user when paid.
- ✅ Reliability: no broken states; clear errors for invalid invoice, insufficient balance, LNbits downtime.
- ⏭️ Production readiness (Phase 4): rate limiting, secrets management, audit logs, reconciliation.
