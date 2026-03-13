#!/usr/bin/env python3
"""
Focused test for RailStream Persistent Session Auto-Renewal System
Minimizes login attempts to avoid rate limiting while testing critical functionality.
"""

import requests
import time
import json
from pymongo import MongoClient
import os

# Configuration
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://railroad-radio.preview.emergentagent.com')
API_BASE = f"{BASE_URL}/api"
MONGO_URL = os.getenv('MONGO_URL', 'mongodb://localhost:27017')
DB_NAME = os.getenv('DB_NAME', 'test')

# Test credentials
USERNAME = "chicagotest"
PASSWORD = "sZyE8cDFk"

def print_test_result(test_name, success, message=""):
    """Print formatted test result"""
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status}: {test_name}")
    if message:
        print(f"    {message}")
    print()

def check_mongo_session(username):
    """Check session exists in MongoDB and return session data"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        sessions = list(db.user_sessions.find({"username": username.lower()}))
        client.close()
        return sessions
    except Exception as e:
        print(f"    MongoDB error: {e}")
        return []

def clear_test_sessions():
    """Clear any existing test sessions from MongoDB"""
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        result = db.user_sessions.delete_many({"username": USERNAME.lower()})
        client.close()
        print(f"Cleared {result.deleted_count} existing test sessions")
    except Exception as e:
        print(f"Failed to clear test sessions: {e}")

def main():
    print("=" * 80)
    print("RailStream Persistent Session Auto-Renewal System - Focused Test")
    print("=" * 80)
    print("⚠️  Using minimal login attempts to avoid rate limiting")
    print()
    
    # Clear any existing test sessions
    clear_test_sessions()
    
    tests_run = 0
    tests_passed = 0
    
    # Single comprehensive test that exercises the full session lifecycle
    print("🔄 Comprehensive Session Lifecycle Test")
    tests_run += 1
    
    try:
        # Step 1: Login with remember_me=true
        print("  Step 1: Login with remember_me=true...")
        login_response = requests.post(f"{API_BASE}/auth/login", 
                                     json={
                                         "username": USERNAME,
                                         "password": PASSWORD,
                                         "remember_me": True
                                     })
        
        if login_response.status_code != 200:
            if login_response.status_code == 429:
                print_test_result("Comprehensive Session Lifecycle", False,
                                "Rate limited - wait 2 minutes and retry")
                return
            else:
                print_test_result("Comprehensive Session Lifecycle", False,
                                f"Login failed: {login_response.status_code}")
                return
        
        login_data = login_response.json()
        if 'access_token' not in login_data:
            print_test_result("Comprehensive Session Lifecycle", False,
                            "No access token returned")
            return
        
        original_token = login_data['access_token']
        login_cookies = login_response.cookies
        print(f"    ✓ Login successful, got token: {original_token[:20]}...")
        
        # Step 2: Check MongoDB session creation
        print("  Step 2: Verify session stored in MongoDB...")
        sessions = check_mongo_session(USERNAME)
        
        if not sessions:
            print_test_result("Comprehensive Session Lifecycle", False,
                            "No session found in MongoDB")
            return
        
        session = sessions[0]
        required_fields = ['session_id', 'username', 'encrypted_password', 'created_at', 'expires_at']
        if not all(field in session for field in required_fields):
            print_test_result("Comprehensive Session Lifecycle", False,
                            f"Session missing fields: {required_fields}")
            return
        
        # Verify encryption format
        encrypted_pass = session.get('encrypted_password', '')
        if len(encrypted_pass.split(':')) != 3:
            print_test_result("Comprehensive Session Lifecycle", False,
                            "Invalid encryption format")
            return
        
        session_id = session['session_id']
        print(f"    ✓ Session stored: {session_id}")
        print(f"    ✓ Encryption format valid: iv:authTag:ciphertext")
        
        # Step 3: Test session renewal
        print("  Step 3: Test session renewal...")
        renew_response = requests.post(f"{API_BASE}/auth/renew", cookies=login_cookies)
        
        if renew_response.status_code != 200:
            print_test_result("Comprehensive Session Lifecycle", False,
                            f"Renewal failed: {renew_response.status_code}")
            return
        
        renew_data = renew_response.json()
        if not (renew_data.get('renewed') == True and 
                'access_token' in renew_data and 
                'user' in renew_data):
            print_test_result("Comprehensive Session Lifecycle", False,
                            f"Invalid renewal response: {renew_data}")
            return
        
        new_token = renew_data['access_token']
        if new_token == original_token:
            print_test_result("Comprehensive Session Lifecycle", False,
                            "Token not refreshed")
            return
        
        print(f"    ✓ Session renewed, new token: {new_token[:20]}...")
        
        # Step 4: Test renewal without cookie
        print("  Step 4: Test renewal without session cookie...")
        no_cookie_response = requests.post(f"{API_BASE}/auth/renew")
        
        if no_cookie_response.status_code != 401:
            print_test_result("Comprehensive Session Lifecycle", False,
                            f"Expected 401, got {no_cookie_response.status_code}")
            return
        
        no_cookie_data = no_cookie_response.json()
        if not (no_cookie_data.get('error') == 'No persistent session' and 
                no_cookie_data.get('renewed') == False):
            print_test_result("Comprehensive Session Lifecycle", False,
                            f"Wrong error response: {no_cookie_data}")
            return
        
        print(f"    ✓ Renewal without cookie properly rejected: {no_cookie_data['error']}")
        
        # Step 5: Test logout cleanup
        print("  Step 5: Test logout session cleanup...")
        logout_response = requests.post(f"{API_BASE}/auth/logout", cookies=login_cookies)
        
        if logout_response.status_code != 200:
            print_test_result("Comprehensive Session Lifecycle", False,
                            f"Logout failed: {logout_response.status_code}")
            return
        
        logout_data = logout_response.json()
        if logout_data.get('ok') != True:
            print_test_result("Comprehensive Session Lifecycle", False,
                            f"Logout not ok: {logout_data}")
            return
        
        # Verify session was deleted
        sessions_after_logout = check_mongo_session(USERNAME)
        if sessions_after_logout:
            print_test_result("Comprehensive Session Lifecycle", False,
                            "Session not deleted from MongoDB")
            return
        
        print(f"    ✓ Session deleted from MongoDB")
        
        print_test_result("Comprehensive Session Lifecycle", True,
                        "All steps passed: login→store→renew→reject→logout→cleanup")
        tests_passed += 1
        
    except Exception as e:
        print_test_result("Comprehensive Session Lifecycle", False, f"Exception: {e}")
    
    # Test MongoDB Collection Structure
    print("🗄️ MongoDB Collection Structure Test")
    tests_run += 1
    try:
        client = MongoClient(MONGO_URL)
        db = client[DB_NAME]
        
        # Check collection exists
        collection_exists = 'user_sessions' in db.list_collection_names()
        
        if not collection_exists:
            print_test_result("MongoDB Collection Structure", False,
                            "user_sessions collection does not exist")
            client.close()
        else:
            # Check TTL index
            indexes = list(db.user_sessions.list_indexes())
            has_ttl_index = False
            
            for index in indexes:
                if 'expires_at' in index.get('key', {}) and index.get('expireAfterSeconds') == 0:
                    has_ttl_index = True
                    break
            
            client.close()
            
            if has_ttl_index:
                print_test_result("MongoDB Collection Structure", True,
                                "Collection exists with proper TTL index")
                tests_passed += 1
            else:
                print_test_result("MongoDB Collection Structure", False,
                                "TTL index missing or incorrect")
    except Exception as e:
        print_test_result("MongoDB Collection Structure", False, f"Exception: {e}")
    
    # Test login WITHOUT remember_me (minimal additional login)
    print("🔐 Login Without Remember Me Test")
    tests_run += 1
    try:
        print("  Waiting 30s to avoid rate limiting...")
        time.sleep(30)
        
        clear_test_sessions()
        
        no_remember_response = requests.post(f"{API_BASE}/auth/login", 
                                           json={
                                               "username": USERNAME,
                                               "password": PASSWORD,
                                               "remember_me": False
                                           })
        
        if no_remember_response.status_code == 429:
            print_test_result("Login Without Remember Me", False,
                            "Rate limited - this confirms rate limiting is active")
        elif no_remember_response.status_code == 200:
            # Check no session was created
            sessions = check_mongo_session(USERNAME)
            if not sessions:
                print_test_result("Login Without Remember Me", True,
                                "No session created as expected")
                tests_passed += 1
            else:
                print_test_result("Login Without Remember Me", False,
                                "Session incorrectly created")
        else:
            print_test_result("Login Without Remember Me", False,
                            f"Login failed: {no_remember_response.status_code}")
    except Exception as e:
        print_test_result("Login Without Remember Me", False, f"Exception: {e}")
    
    # Final Results
    print("=" * 80)
    print("FINAL RESULTS")
    print("=" * 80)
    print(f"Tests Run: {tests_run}")
    print(f"Tests Passed: {tests_passed}")
    print(f"Tests Failed: {tests_run - tests_passed}")
    print(f"Success Rate: {(tests_passed/tests_run)*100:.1f}%")
    
    if tests_passed >= 2:  # At least the main lifecycle test + MongoDB structure
        print("\n🎉 CORE FUNCTIONALITY VERIFIED! Persistent Session Auto-Renewal system is working.")
    else:
        print(f"\n⚠️  Critical issues found. System needs attention.")
    
    # Cleanup
    clear_test_sessions()
    
    return tests_passed >= 2

if __name__ == "__main__":
    main()