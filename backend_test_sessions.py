#!/usr/bin/env python3
"""
Comprehensive test suite for RailStream Persistent Session Auto-Renewal System
Tests all aspects of the session management including MongoDB storage, 
AES encryption, and the complete session lifecycle.
"""

import requests
import time
import json
from pymongo import MongoClient
import os
import uuid

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://photo-modal-enhance.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test')  # Default database name

# Test credentials
USERNAME = "chicagotest"
PASSWORD = "sZyE8cDFk"

def print_test_result(test_name, success, message=""):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {test_name}")
    if message:
        print(f"    {message}")
    if not success:
        print(f"    Expected success but got failure")
    print()

def check_mongo_session(username, should_exist=True):
    """Check if session exists in MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]  # Use explicit database name
        sessions = list(db.user_sessions.find({"username": username.lower()}))
        client.close()
        
        if should_exist:
            return len(sessions) > 0, sessions[0] if sessions else None
        else:
            return len(sessions) == 0, None
    except Exception as e:
        print(f"    MongoDB check error: {e}")
        return False, None

def clear_test_sessions():
    """Clear any existing test sessions from MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]  # Use explicit database name
        result = db.user_sessions.delete_many({"username": USERNAME.lower()})
        client.close()
        print(f"Cleared {result.deleted_count} existing test sessions")
    except Exception as e:
        print(f"Failed to clear test sessions: {e}")

def main():
    print("=" * 80)
    print("RailStream Persistent Session Auto-Renewal System Test")
    print("=" * 80)
    print()
    
    # Clear any existing test sessions
    clear_test_sessions()
    
    tests_run = 0
    tests_passed = 0
    access_token = None
    login_cookies = None
    session_id = None
    
    # Test 1: Login with remember_me=true (should create session)
    print("🔐 Test 1: POST /api/auth/login with remember_me=true")
    tests_run += 1
    try:
        response = requests.post(f"{API_BASE}/auth/login", 
                               json={
                                   "username": USERNAME,
                                   "password": PASSWORD,
                                   "remember_me": True
                               })
        
        if response.status_code == 200:
            data = response.json()
            if 'access_token' in data and 'expires_in' in data:
                # Check if session was created in MongoDB
                session_exists, session_doc = check_mongo_session(USERNAME, should_exist=True)
                
                if session_exists and session_doc:
                    # Verify session structure
                    required_fields = ['session_id', 'username', 'encrypted_password', 'created_at', 'expires_at']
                    has_all_fields = all(field in session_doc for field in required_fields)
                    
                    # Verify encrypted_password format (iv:authTag:ciphertext)
                    encrypted_pass = session_doc.get('encrypted_password', '')
                    has_correct_format = len(encrypted_pass.split(':')) == 3
                    
                    if has_all_fields and has_correct_format:
                        print_test_result("Login with remember_me creates session", True,
                                        f"Session created: {session_doc['session_id']}")
                        tests_passed += 1
                        
                        # Store session_id for later tests  
                        session_id = session_doc['session_id']
                        access_token = data['access_token']
                        login_cookies = response.cookies
                    else:
                        print_test_result("Login with remember_me creates session", False,
                                        f"Invalid session structure or encryption format")
                else:
                    print_test_result("Login with remember_me creates session", False,
                                    "No session found in MongoDB")
            else:
                print_test_result("Login with remember_me creates session", False,
                                f"Missing access_token or expires_in: {data}")
        else:
            print_test_result("Login with remember_me creates session", False,
                            f"Login failed: {response.status_code} - {response.text}")
    except Exception as e:
        print_test_result("Login with remember_me creates session", False, f"Exception: {e}")
    
    # Test 2: POST /api/auth/renew (with session cookie)
    print("🔄 Test 2: POST /api/auth/renew (with session cookie)")
    tests_run += 1
    try:
        if tests_passed >= 1 and login_cookies is not None:  # Only run if previous test passed
            # Use stored cookies from the login response
            
            renew_response = requests.post(f"{API_BASE}/auth/renew", cookies=login_cookies)
            
            if renew_response.status_code == 200:
                renew_data = renew_response.json()
                if (renew_data.get('renewed') == True and 
                    'access_token' in renew_data and 
                    'expires_in' in renew_data and
                    'user' in renew_data):
                    
                    # Verify new token is different from original
                    new_token = renew_data['access_token']
                    if new_token != access_token:
                        print_test_result("Session renewal with cookie", True,
                                        f"New token received, expires in {renew_data['expires_in']}s")
                        tests_passed += 1
                    else:
                        print_test_result("Session renewal with cookie", False,
                                        "Token not refreshed (same token returned)")
                else:
                    print_test_result("Session renewal with cookie", False,
                                    f"Invalid renewal response: {renew_data}")
            else:
                print_test_result("Session renewal with cookie", False,
                                f"Renewal failed: {renew_response.status_code} - {renew_response.text}")
        else:
            print_test_result("Session renewal with cookie", False, "Skipped - previous test failed")
    except Exception as e:
        print_test_result("Session renewal with cookie", False, f"Exception: {e}")
    
    # Test 3: POST /api/auth/renew (without session cookie)
    print("🚫 Test 3: POST /api/auth/renew (without session cookie)")
    tests_run += 1
    try:
        no_cookie_response = requests.post(f"{API_BASE}/auth/renew")
        
        if no_cookie_response.status_code == 401:
            no_cookie_data = no_cookie_response.json()
            if (no_cookie_data.get('error') == 'No persistent session' and 
                no_cookie_data.get('renewed') == False):
                print_test_result("Renewal without cookie returns 401", True,
                                f"Correct error: {no_cookie_data['error']}")
                tests_passed += 1
            else:
                print_test_result("Renewal without cookie returns 401", False,
                                f"Wrong error response: {no_cookie_data}")
        else:
            print_test_result("Renewal without cookie returns 401", False,
                            f"Expected 401, got {no_cookie_response.status_code}")
    except Exception as e:
        print_test_result("Renewal without cookie returns 401", False, f"Exception: {e}")
    
    # Test 4: POST /api/auth/logout (with session cookie)
    print("🔓 Test 4: POST /api/auth/logout (with session cookie)")
    tests_run += 1
    try:
        if tests_passed >= 1 and login_cookies is not None:  # Only run if login test passed
            logout_response = requests.post(f"{API_BASE}/auth/logout", cookies=login_cookies)
            
            if logout_response.status_code == 200:
                logout_data = logout_response.json()
                if logout_data.get('ok') == True:
                    # Verify session was deleted from MongoDB
                    session_deleted, _ = check_mongo_session(USERNAME, should_exist=False)
                    
                    if session_deleted:
                        print_test_result("Logout cleans up session", True,
                                        "Session successfully deleted from MongoDB")
                        tests_passed += 1
                    else:
                        print_test_result("Logout cleans up session", False,
                                        "Session still exists in MongoDB after logout")
                else:
                    print_test_result("Logout cleans up session", False,
                                    f"Logout response not ok: {logout_data}")
            else:
                print_test_result("Logout cleans up session", False,
                                f"Logout failed: {logout_response.status_code} - {logout_response.text}")
        else:
            print_test_result("Logout cleans up session", False, "Skipped - login test failed")
    except Exception as e:
        print_test_result("Logout cleans up session", False, f"Exception: {e}")
    
    # Test 5: POST /api/auth/login WITHOUT remember_me
    print("🔐 Test 5: POST /api/auth/login WITHOUT remember_me")
    tests_run += 1
    try:
        # Clear any remaining sessions first
        clear_test_sessions()
        
        response_no_remember = requests.post(f"{API_BASE}/auth/login", 
                                           json={
                                               "username": USERNAME,
                                               "password": PASSWORD,
                                               "remember_me": False
                                           })
        
        if response_no_remember.status_code == 200:
            data_no_remember = response_no_remember.json()
            if 'access_token' in data_no_remember:
                # Verify NO session was created in MongoDB
                no_session_exists, _ = check_mongo_session(USERNAME, should_exist=False)
                
                if no_session_exists:
                    print_test_result("Login without remember_me (no session created)", True,
                                    "No persistent session created as expected")
                    tests_passed += 1
                else:
                    print_test_result("Login without remember_me (no session created)", False,
                                    "Session incorrectly created without remember_me")
            else:
                print_test_result("Login without remember_me (no session created)", False,
                                f"Login failed - no access token: {data_no_remember}")
        else:
            print_test_result("Login without remember_me (no session created)", False,
                            f"Login failed: {response_no_remember.status_code}")
    except Exception as e:
        print_test_result("Login without remember_me (no session created)", False, f"Exception: {e}")
    
    # Test 6: MongoDB Collection and Indexes
    print("🗄️ Test 6: MongoDB Collection Structure and TTL Index")
    tests_run += 1
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]  # Use explicit database name
        
        # Check if collection exists
        collection_exists = 'user_sessions' in db.list_collection_names()
        
        if collection_exists:
            # Check for TTL index on expires_at
            indexes = db.user_sessions.list_indexes()
            has_ttl_index = False
            
            for index in indexes:
                if 'expires_at' in index.get('key', {}):
                    expire_after = index.get('expireAfterSeconds')
                    if expire_after == 0:  # TTL index with expireAfterSeconds: 0
                        has_ttl_index = True
                        break
            
            client.close()
            
            if has_ttl_index:
                print_test_result("MongoDB collection and TTL index", True,
                                "user_sessions collection exists with proper TTL index")
                tests_passed += 1
            else:
                print_test_result("MongoDB collection and TTL index", False,
                                "TTL index missing or incorrect")
        else:
            client.close()
            print_test_result("MongoDB collection and TTL index", False,
                            "user_sessions collection does not exist")
    except Exception as e:
        print_test_result("MongoDB collection and TTL index", False, f"Exception: {e}")
    
    # Test 7: Verify Session Expiry (30 days)
    print("📅 Test 7: Session Expiry Configuration")
    tests_run += 1
    try:
        # Login with remember_me to create a session
        clear_test_sessions()
        
        session_response = requests.post(f"{API_BASE}/auth/login", 
                                       json={
                                           "username": USERNAME,
                                           "password": PASSWORD,
                                           "remember_me": True
                                       })
        
        if session_response.status_code == 200:
            session_exists, session_doc = check_mongo_session(USERNAME, should_exist=True)
            
            if session_exists and session_doc:
                created_at = session_doc.get('created_at')
                expires_at = session_doc.get('expires_at')
                
                if created_at and expires_at:
                    # Calculate difference in days
                    from datetime import datetime
                    if isinstance(created_at, str):
                        created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    if isinstance(expires_at, str):
                        expires_at = datetime.fromisoformat(expires_at.replace('Z', '+00:00'))
                    
                    diff_days = (expires_at - created_at).days
                    
                    if 29 <= diff_days <= 31:  # Allow some variance
                        print_test_result("Session expiry is 30 days", True,
                                        f"Session expires in {diff_days} days")
                        tests_passed += 1
                        
                        # Clean up
                        requests.post(f"{API_BASE}/auth/logout", cookies=session_response.cookies)
                    else:
                        print_test_result("Session expiry is 30 days", False,
                                        f"Incorrect expiry: {diff_days} days")
                else:
                    print_test_result("Session expiry is 30 days", False,
                                    "Missing created_at or expires_at fields")
            else:
                print_test_result("Session expiry is 30 days", False,
                                "No session created for expiry test")
        else:
            print_test_result("Session expiry is 30 days", False,
                            "Login failed for expiry test")
    except Exception as e:
        print_test_result("Session expiry is 30 days", False, f"Exception: {e}")
    
    # Final Results
    print("=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    print(f"Tests Run: {tests_run}")
    print(f"Tests Passed: {tests_passed}")
    print(f"Tests Failed: {tests_run - tests_passed}")
    print(f"Success Rate: {(tests_passed/tests_run)*100:.1f}%")
    
    if tests_passed == tests_run:
        print("\n🎉 ALL TESTS PASSED! Persistent Session Auto-Renewal system is working correctly.")
    else:
        print(f"\n⚠️  {tests_run - tests_passed} test(s) failed. System needs attention.")
    
    # Cleanup
    clear_test_sessions()
    
    return tests_passed == tests_run

if __name__ == "__main__":
    main()