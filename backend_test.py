"""
Comprehensive backend API test for Satoshi Lightning Wallet.
Tests all endpoints against the public URL.
"""
import requests
import sys
import time
import json
from datetime import datetime

BASE_URL = "https://lightning-exchange-1.preview.emergentagent.com/api"

class TestRunner:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.token_user_a = None
        self.token_user_b = None
        self.user_a = None
        self.user_b = None
        self.results = []

    def test(self, name, method, endpoint, expected_status, data=None, token=None, params=None):
        """Run a single API test"""
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'

        self.tests_run += 1
        print(f"\n🔍 Test {self.tests_run}: {name}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=15)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=headers, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ PASS - Status: {response.status_code}")
                try:
                    resp_json = response.json()
                    self.results.append({"test": name, "status": "PASS", "response": resp_json})
                    return True, resp_json
                except:
                    self.results.append({"test": name, "status": "PASS", "response": response.text})
                    return True, response.text
            else:
                self.tests_failed += 1
                print(f"❌ FAIL - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}")
                self.results.append({"test": name, "status": "FAIL", "expected": expected_status, "got": response.status_code, "response": response.text[:200]})
                return False, {}

        except Exception as e:
            self.tests_failed += 1
            print(f"❌ FAIL - Error: {str(e)}")
            self.results.append({"test": name, "status": "FAIL", "error": str(e)})
            return False, {}

    def run_all_tests(self):
        print("=" * 80)
        print("SATOSHI WALLET - BACKEND API TEST SUITE")
        print("=" * 80)
        
        # Test 1: Health check
        success, resp = self.test("Health check with LNbits info", "GET", "health", 200)
        if success and resp.get("ok"):
            print(f"   LNbits wallet: {resp.get('lnbits', {})}")
        
        # Test 2: Check username availability (should be available)
        timestamp = int(time.time()) % 10000  # Use last 4 digits only
        username_a = f"testa{timestamp}"
        username_b = f"testb{timestamp}"
        
        success, resp = self.test(f"Check username availability: {username_a}", "GET", f"users/check/{username_a}", 200)
        if success and not resp.get("available"):
            print(f"   ⚠️  Username {username_a} already taken, using different one")
            username_a = f"testa{timestamp}x"
            username_b = f"testb{timestamp}x"
        
        # Test 3: Signup user A with valid username + 6-digit PIN
        success, resp = self.test(
            "Signup user A with valid username + 6-digit PIN",
            "POST",
            "auth/signup",
            200,
            data={"username": username_a, "pin": "123456"}
        )
        if success:
            self.token_user_a = resp.get("token")
            self.user_a = resp.get("user")
            print(f"   User A created: {self.user_a.get('username')}")
            print(f"   Lightning address: {self.user_a.get('lightning_address')}")
            print(f"   Balance: {self.user_a.get('balance_sats')} sats")
            
            # Verify lightning address format
            expected_addr = f"{username_a}@satoshi.app"
            if self.user_a.get('lightning_address') == expected_addr:
                print(f"   ✅ Lightning address format correct")
            else:
                print(f"   ❌ Lightning address mismatch: expected {expected_addr}, got {self.user_a.get('lightning_address')}")
        
        # Test 4: Signup with duplicate username (should fail with 409)
        self.test(
            "Signup with duplicate username (should reject with 409)",
            "POST",
            "auth/signup",
            409,
            data={"username": username_a, "pin": "654321"}
        )
        
        # Test 5: Signup with invalid username format (uppercase)
        self.test(
            "Signup with invalid username (uppercase, should reject)",
            "POST",
            "auth/signup",
            422,  # Pydantic validation error
            data={"username": "TestUser", "pin": "123456"}
        )
        
        # Test 6: Signup with invalid username format (special chars)
        self.test(
            "Signup with invalid username (special chars, should reject)",
            "POST",
            "auth/signup",
            422,
            data={"username": "test@user", "pin": "123456"}
        )
        
        # Test 7: Signup user B
        success, resp = self.test(
            "Signup user B",
            "POST",
            "auth/signup",
            200,
            data={"username": username_b, "pin": "654321"}
        )
        if success:
            self.token_user_b = resp.get("token")
            self.user_b = resp.get("user")
            print(f"   User B created: {self.user_b.get('username')}")
        
        # Test 8: Login with correct credentials
        success, resp = self.test(
            "Login user A with correct PIN",
            "POST",
            "auth/login",
            200,
            data={"username": username_a, "pin": "123456"}
        )
        if success:
            print(f"   ✅ Login successful, token received")
        
        # Test 9: Login with wrong PIN (should fail with 401)
        self.test(
            "Login with wrong PIN (should reject with 401)",
            "POST",
            "auth/login",
            401,
            data={"username": username_a, "pin": "999999"}
        )
        
        # Test 10: Login with unknown username (should fail with 404)
        self.test(
            "Login with unknown username (should reject with 404)",
            "POST",
            "auth/login",
            404,
            data={"username": "nonexistent_user_xyz", "pin": "123456"}
        )
        
        # Test 11: GET /auth/me with valid token
        success, resp = self.test(
            "GET /auth/me with valid Bearer token",
            "GET",
            "auth/me",
            200,
            token=self.token_user_a
        )
        if success:
            print(f"   User: {resp.get('username')}, Balance: {resp.get('balance_sats')} sats")
        
        # Test 12: GET /auth/me without token (should fail with 401)
        self.test(
            "GET /auth/me without token (should reject with 401)",
            "GET",
            "auth/me",
            401
        )
        
        # Test 13: GET /users/{username} - public profile
        success, resp = self.test(
            f"GET /users/{username_b} - public profile",
            "GET",
            f"users/{username_b}",
            200
        )
        if success:
            print(f"   Public profile: {resp.get('username')}, {resp.get('lightning_address')}")
        
        # Test 14: GET /wallet/balance
        success, resp = self.test(
            "GET /wallet/balance",
            "GET",
            "wallet/balance",
            200,
            token=self.token_user_a
        )
        if success:
            print(f"   Balance: {resp.get('balance_sats')} sats, Hide: {resp.get('hide_balance')}")
        
        # Test 15: PATCH /settings - toggle hide_balance
        success, resp = self.test(
            "PATCH /settings - toggle hide_balance to true",
            "PATCH",
            "settings",
            200,
            data={"hide_balance": True},
            token=self.token_user_a
        )
        if success and resp.get('hide_balance') == True:
            print(f"   ✅ hide_balance toggled to true")
        
        # Test 16: Verify hide_balance persisted in /auth/me
        success, resp = self.test(
            "Verify hide_balance persisted in /auth/me",
            "GET",
            "auth/me",
            200,
            token=self.token_user_a
        )
        if success and resp.get('hide_balance') == True:
            print(f"   ✅ hide_balance persisted correctly")
        
        # Test 17: POST /receive/invoice - create Lightning invoice
        success, resp = self.test(
            "POST /receive/invoice - create BOLT11 invoice",
            "POST",
            "receive/invoice",
            200,
            data={"amount_sats": 100, "memo": "Test invoice"},
            token=self.token_user_a
        )
        payment_hash = None
        bolt11 = None
        if success:
            bolt11 = resp.get('bolt11')
            payment_hash = resp.get('payment_hash')
            tx_id = resp.get('transaction_id')
            print(f"   Invoice created: {bolt11[:50]}...")
            print(f"   Payment hash: {payment_hash}")
            print(f"   Transaction ID: {tx_id}")
            
            # Verify bolt11 starts with 'lnbc'
            if bolt11 and bolt11.lower().startswith('lnbc'):
                print(f"   ✅ BOLT11 format correct (starts with lnbc)")
            else:
                print(f"   ❌ BOLT11 format incorrect: {bolt11[:20]}")
        
        # Test 18: GET /receive/status/{payment_hash} - check unpaid invoice
        if payment_hash:
            success, resp = self.test(
                "GET /receive/status/{payment_hash} - unpaid invoice",
                "GET",
                f"receive/status/{payment_hash}",
                200,
                token=self.token_user_a
            )
            if success:
                paid = resp.get('paid')
                status = resp.get('status')
                print(f"   Paid: {paid}, Status: {status}")
                if not paid and status == 'pending':
                    print(f"   ✅ Unpaid invoice correctly shows paid=false, status=pending")
                else:
                    print(f"   ⚠️  Expected paid=false and status=pending")
        
        # Test 19: POST /send/decode - decode bolt11 invoice
        if bolt11:
            success, resp = self.test(
                "POST /send/decode - decode BOLT11 invoice",
                "POST",
                "send/decode",
                200,
                data={"data": bolt11},
                token=self.token_user_b
            )
            if success:
                kind = resp.get('kind')
                amount = resp.get('amount_sats')
                print(f"   Kind: {kind}, Amount: {amount} sats")
                if kind == 'bolt11' and amount == 100:
                    print(f"   ✅ BOLT11 decoded correctly")
        
        # Test 20: POST /send/decode - decode internal username
        success, resp = self.test(
            "POST /send/decode - decode internal username",
            "POST",
            "send/decode",
            200,
            data={"data": username_b},
            token=self.token_user_a
        )
        if success:
            kind = resp.get('kind')
            recipient = resp.get('internal_recipient')
            print(f"   Kind: {kind}, Recipient: {recipient.get('username') if recipient else None}")
            if kind == 'internal_username' and recipient:
                print(f"   ✅ Internal username decoded correctly")
        
        # Test 21: POST /send/decode - decode username@satoshi.app
        success, resp = self.test(
            "POST /send/decode - decode username@satoshi.app",
            "POST",
            "send/decode",
            200,
            data={"data": f"{username_b}@satoshi.app"},
            token=self.token_user_a
        )
        if success:
            kind = resp.get('kind')
            if kind == 'internal_username':
                print(f"   ✅ Lightning address decoded as internal")
        
        # Test 22: POST /send/decode - garbage input (should fail with 400)
        self.test(
            "POST /send/decode - garbage input (should reject with 400)",
            "POST",
            "send/decode",
            400,
            data={"data": "garbage_input_xyz_123"},
            token=self.token_user_a
        )
        
        # Test 23: Manually credit user A with sats for internal transfer test
        print(f"\n🔧 Manually crediting user A with 1000 sats via MongoDB...")
        try:
            from pymongo import MongoClient
            client = MongoClient("mongodb://localhost:27017")
            db = client["satoshi_wallet"]
            result = db.users.update_one(
                {"id": self.user_a.get('id')},
                {"$set": {"balance_sats": 1000}}
            )
            if result.modified_count > 0:
                print(f"   ✅ User A credited with 1000 sats")
            else:
                print(f"   ⚠️  Could not credit user A")
        except Exception as e:
            print(f"   ❌ Error crediting user A: {e}")
        
        # Test 24: POST /send/pay - internal transfer from A to B
        success, resp = self.test(
            "POST /send/pay - internal transfer from A to B",
            "POST",
            "send/pay",
            200,
            data={"data": username_b, "amount_sats": 100, "pin": "123456", "memo": "Test transfer"},
            token=self.token_user_a
        )
        if success:
            kind = resp.get('kind')
            tx = resp.get('transaction')
            print(f"   Kind: {kind}")
            if kind == 'internal_transfer':
                print(f"   ✅ Internal transfer successful")
        
        # Test 25: Verify balances after transfer
        success, resp = self.test(
            "Verify user A balance after transfer",
            "GET",
            "wallet/balance",
            200,
            token=self.token_user_a
        )
        if success:
            balance_a = resp.get('balance_sats')
            print(f"   User A balance: {balance_a} sats (expected 900)")
            if balance_a == 900:
                print(f"   ✅ User A balance correct")
        
        success, resp = self.test(
            "Verify user B balance after transfer",
            "GET",
            "wallet/balance",
            200,
            token=self.token_user_b
        )
        if success:
            balance_b = resp.get('balance_sats')
            print(f"   User B balance: {balance_b} sats (expected 100)")
            if balance_b == 100:
                print(f"   ✅ User B balance correct")
        
        # Test 26: POST /send/pay - wrong PIN (should fail with 401)
        self.test(
            "POST /send/pay - wrong PIN (should reject with 401)",
            "POST",
            "send/pay",
            401,
            data={"data": username_b, "amount_sats": 50, "pin": "999999"},
            token=self.token_user_a
        )
        
        # Test 27: POST /send/pay - insufficient balance (should fail with 400)
        self.test(
            "POST /send/pay - insufficient balance (should reject with 400)",
            "POST",
            "send/pay",
            400,
            data={"data": username_b, "amount_sats": 10000, "pin": "123456"},
            token=self.token_user_a
        )
        
        # Test 28: POST /send/pay - send to self (should fail with 400)
        self.test(
            "POST /send/pay - send to self (should reject with 400)",
            "POST",
            "send/pay",
            400,
            data={"data": username_a, "amount_sats": 50, "pin": "123456"},
            token=self.token_user_a
        )
        
        # Test 29: GET /transactions - list transactions
        success, resp = self.test(
            "GET /transactions - list user A transactions",
            "GET",
            "transactions",
            200,
            token=self.token_user_a
        )
        if success and isinstance(resp, list):
            print(f"   Found {len(resp)} transactions")
            if len(resp) > 0:
                print(f"   Latest tx: {resp[0].get('kind')}, {resp[0].get('direction')}, {resp[0].get('amount_sats')} sats")
        
        # Test 30: GET /transactions with status filter
        success, resp = self.test(
            "GET /transactions?status_filter=completed",
            "GET",
            "transactions",
            200,
            token=self.token_user_a,
            params={"status_filter": "completed"}
        )
        if success and isinstance(resp, list):
            print(f"   Found {len(resp)} completed transactions")
        
        # Test 31: GET /transactions/{id} - get specific transaction
        if success and len(resp) > 0:
            tx_id = resp[0].get('id')
            success2, resp2 = self.test(
                f"GET /transactions/{tx_id}",
                "GET",
                f"transactions/{tx_id}",
                200,
                token=self.token_user_a
            )
            if success2:
                print(f"   Transaction details: {resp2.get('kind')}, {resp2.get('status')}")
        
        # Test 32: GET /transactions/{id} - access someone else's tx (should fail with 404)
        if success and len(resp) > 0:
            tx_id = resp[0].get('id')
            self.test(
                "GET /transactions/{id} - access other user's tx (should reject with 404)",
                "GET",
                f"transactions/{tx_id}",
                404,
                token=self.token_user_b
            )
        
        # Test 33: GET /lnurlp/{username} - LNURL-pay metadata
        success, resp = self.test(
            f"GET /lnurlp/{username_a} - LNURL-pay metadata",
            "GET",
            f"lnurlp/{username_a}",
            200
        )
        if success:
            callback = resp.get('callback')
            min_send = resp.get('minSendable')
            max_send = resp.get('maxSendable')
            tag = resp.get('tag')
            metadata = resp.get('metadata')
            print(f"   Callback: {callback}")
            print(f"   Min/Max: {min_send}/{max_send} msat")
            print(f"   Tag: {tag}")
            if tag == 'payRequest' and callback and metadata:
                print(f"   ✅ LNURL-pay metadata valid")
        
        # Test 34: GET /lnurlp/{username}/callback - LNURL-pay callback
        success, resp = self.test(
            f"GET /lnurlp/{username_a}/callback?amount=10000 (10 sats)",
            "GET",
            f"lnurlp/{username_a}/callback",
            200,
            params={"amount": 10000}  # 10 sats in millisats
        )
        if success:
            pr = resp.get('pr')
            if pr and pr.lower().startswith('lnbc'):
                print(f"   ✅ LNURL callback returned valid invoice: {pr[:50]}...")
            else:
                print(f"   ❌ Invalid invoice from LNURL callback")
        
        # Print summary
        print("\n" + "=" * 80)
        print("TEST SUMMARY")
        print("=" * 80)
        print(f"Total tests: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_failed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        print("=" * 80)
        
        return 0 if self.tests_failed == 0 else 1

if __name__ == "__main__":
    runner = TestRunner()
    exit_code = runner.run_all_tests()
    sys.exit(exit_code)
