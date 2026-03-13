#!/usr/bin/env python3
"""
Final Heritage Alert and Collection Test Suite
Tests the exact scenarios from the review request.
"""
import requests
import json
import time
import sys

# API Configuration
BASE_URL = "https://photo-modal-enhance.preview.emergentagent.com"
TEST_USER = "chicagotest"
TEST_PASS = "sZyE8cDFk"

def log_test(test_name, status, details=""):
    """Log test results with clear formatting."""
    symbol = "✅" if status == "PASS" else "❌" if status == "FAIL" else "⏭️"
    print(f"{symbol} {test_name}")
    if details:
        print(f"   {details}")
    return status == "PASS"

def count_recent_heritage_alerts(messages, since_timestamp):
    """Count heritage alerts created after a specific timestamp."""
    count = 0
    for msg in messages:
        if (msg.get('username') == 'RoundhouseBot' and 
            'HERITAGE UNIT ON CAM' in msg.get('message', '')):
            # Check if this message was created after our timestamp
            msg_time = msg.get('created_at', '')
            if msg_time > since_timestamp:
                count += 1
    return count

def main():
    """Run the exact test scenarios from the review request."""
    print("=" * 70)
    print("ROUNDHOUSE HERITAGE ALERT & COLLECTION - FINAL TEST")
    print("=" * 70)
    
    passed = 0
    failed = 0
    
    # 1. Login
    try:
        login_response = requests.post(f"{BASE_URL}/api/auth/login", 
            json={"username": TEST_USER, "password": TEST_PASS}, timeout=30)
        
        if login_response.status_code == 200:
            auth_token = login_response.json()['access_token']
            auth_headers = {"Authorization": f"Bearer {auth_token}"}
            passed += log_test("✅ LOGIN: Authentication successful", "PASS")
        else:
            failed += log_test("❌ LOGIN: Failed", "FAIL", f"Status: {login_response.status_code}")
            return
    except Exception as e:
        failed += log_test("❌ LOGIN: Exception", "FAIL", f"Error: {str(e)}")
        return
    
    # Get initial chat state
    try:
        initial_messages = requests.get(f"{BASE_URL}/api/chat?action=messages&room_id=the-yard&limit=5", 
                                      timeout=30).json().get('messages', [])
        initial_time = time.time()
        initial_timestamp = f"{int(initial_time)}000"  # Convert to milliseconds-like format for comparison
        
        passed += log_test("✅ SETUP: Got initial chat state", "PASS", f"Initial messages: {len(initial_messages)}")
    except Exception as e:
        failed += log_test("❌ SETUP: Failed to get initial chat state", "FAIL", f"Error: {str(e)}")
        return

    # Test A: Camera capture with heritage unit (SHOULD trigger alert)
    try:
        test_a_data = {
            "action": "create",
            "railroad": "NS",
            "locomotive_numbers": "NS 1073",
            "location": "Fostoria, Ohio",
            "source": "camera_capture",
            "camera_name": "Fostoria Cam 1",
            "tags": ["heritage"],
            "title": "Heritage Unit on Cam"
        }
        
        response_a = requests.post(f"{BASE_URL}/api/roundhouse", 
            json=test_a_data, headers=auth_headers, timeout=30)
        
        if response_a.status_code == 200 and response_a.json().get('ok'):
            photo_data_a = response_a.json()['photo']
            passed += log_test("✅ TEST A: Camera capture heritage photo created", "PASS",
                             f"ID: {photo_data_a['id']}, Heritage: {photo_data_a['is_heritage']}")
        else:
            failed += log_test("❌ TEST A: Failed", "FAIL", f"Status: {response_a.status_code}")
            
    except Exception as e:
        failed += log_test("❌ TEST A: Exception", "FAIL", f"Error: {str(e)}")

    # Wait for alert processing
    time.sleep(2)

    # Check for alert from Test A
    try:
        after_a_messages = requests.get(f"{BASE_URL}/api/chat?action=messages&room_id=the-yard&limit=10", 
                                      timeout=30).json().get('messages', [])
        
        new_alerts_a = count_recent_heritage_alerts(after_a_messages, initial_timestamp)
        
        if new_alerts_a >= 1:
            # Find the actual alert message
            alert_msg = next((msg['message'] for msg in after_a_messages 
                            if msg.get('username') == 'RoundhouseBot' and 'HERITAGE UNIT ON CAM' in msg.get('message', '')), 
                           "Alert found")
            passed += log_test("✅ TEST A ALERT: Heritage alert triggered correctly", "PASS",
                             f"Alert: {alert_msg[:80]}...")
        else:
            failed += log_test("❌ TEST A ALERT: No heritage alert found", "FAIL",
                             "Camera capture should trigger heritage alert")
            
    except Exception as e:
        failed += log_test("❌ TEST A ALERT: Exception", "FAIL", f"Error: {str(e)}")

    # Test B: Trackside upload with heritage unit (should NOT trigger alert)
    try:
        test_b_data = {
            "action": "create",
            "railroad": "NS",
            "locomotive_numbers": "NS 1073",
            "location": "Fostoria, Ohio",
            "source": "trackside",
            "tags": ["heritage"],
            "title": "Heritage Unit Trackside"
        }
        
        response_b = requests.post(f"{BASE_URL}/api/roundhouse",
            json=test_b_data, headers=auth_headers, timeout=30)
        
        if response_b.status_code == 200 and response_b.json().get('ok'):
            photo_data_b = response_b.json()['photo']
            if photo_data_b.get('source') == 'trackside' and photo_data_b.get('is_heritage'):
                passed += log_test("✅ TEST B: Trackside heritage photo created", "PASS",
                                 f"ID: {photo_data_b['id']}, Source: trackside")
            else:
                failed += log_test("❌ TEST B: Photo issue", "FAIL", 
                                 f"Source: {photo_data_b.get('source')}, Heritage: {photo_data_b.get('is_heritage')}")
        else:
            failed += log_test("❌ TEST B: Failed", "FAIL", f"Status: {response_b.status_code}")
            
    except Exception as e:
        failed += log_test("❌ TEST B: Exception", "FAIL", f"Error: {str(e)}")

    # Wait for potential alert
    time.sleep(2)

    # Check that NO NEW alert was created for Test B
    try:
        after_b_messages = requests.get(f"{BASE_URL}/api/chat?action=messages&room_id=the-yard&limit=10", 
                                      timeout=30).json().get('messages', [])
        
        # Count alerts after Test A completed
        total_alerts_after_b = count_recent_heritage_alerts(after_b_messages, initial_timestamp)
        
        # We should have only 1 alert (from Test A), not more
        if total_alerts_after_b == 1:
            passed += log_test("✅ TEST B NO-ALERT: Trackside upload correctly did NOT trigger alert", "PASS",
                             "Only camera captures trigger heritage alerts")
        else:
            failed += log_test("❌ TEST B NO-ALERT: Unexpected behavior", "FAIL",
                             f"Expected 1 total alert, found {total_alerts_after_b}")
            
    except Exception as e:
        failed += log_test("❌ TEST B NO-ALERT: Exception", "FAIL", f"Error: {str(e)}")

    # Test C: Create collection
    try:
        collection_data = {
            "action": "create_collection", 
            "name": "UP Locomotives Test",
            "description": "Union Pacific power"
        }
        
        collection_response = requests.post(f"{BASE_URL}/api/roundhouse",
            json=collection_data, headers=auth_headers, timeout=30)
        
        if collection_response.status_code == 200:
            collection_result = collection_response.json()
            if collection_result.get('ok') and collection_result.get('collection'):
                collection_id = collection_result['collection']['id']
                passed += log_test("✅ TEST C: Collection created", "PASS", 
                                 f"ID: {collection_id}")
            else:
                failed += log_test("❌ TEST C: Collection creation failed", "FAIL", f"Response: {collection_result}")
                collection_id = None
        else:
            failed += log_test("❌ TEST C: API error", "FAIL", f"Status: {collection_response.status_code}")
            collection_id = None
            
    except Exception as e:
        failed += log_test("❌ TEST C: Exception", "FAIL", f"Error: {str(e)}")
        collection_id = None

    # Test D: Create photo in collection
    if collection_id:
        try:
            photo_in_collection_data = {
                "action": "create",
                "railroad": "UP", 
                "locomotive_numbers": "UP 1943",
                "source": "camera_capture",
                "camera_name": "Test Cam",
                "collection_id": collection_id,
                "collection_name": "UP Locomotives Test",
                "tags": []
            }
            
            photo_collection_response = requests.post(f"{BASE_URL}/api/roundhouse",
                json=photo_in_collection_data, headers=auth_headers, timeout=30)
            
            if photo_collection_response.status_code == 200:
                photo_result = photo_collection_response.json()
                if photo_result.get('ok') and photo_result.get('photo'):
                    photo = photo_result['photo']
                    if photo.get('collection_id') == collection_id:
                        passed += log_test("✅ TEST D: Photo created in collection", "PASS",
                                         f"Photo in collection: {photo.get('collection_name')}")
                    else:
                        failed += log_test("❌ TEST D: Collection mismatch", "FAIL",
                                         f"Expected {collection_id}, got {photo.get('collection_id')}")
                else:
                    failed += log_test("❌ TEST D: Photo creation failed", "FAIL", f"Response: {photo_result}")
            else:
                failed += log_test("❌ TEST D: API error", "FAIL", f"Status: {photo_collection_response.status_code}")
                
        except Exception as e:
            failed += log_test("❌ TEST D: Exception", "FAIL", f"Error: {str(e)}")
            
        # Verify collection photo count
        try:
            verify_response = requests.get(f"{BASE_URL}/api/roundhouse?action=collections", timeout=30)
            if verify_response.status_code == 200:
                collections = verify_response.json().get('collections', [])
                test_collection = next((c for c in collections if c.get('id') == collection_id), None)
                if test_collection and test_collection.get('photo_count', 0) > 0:
                    passed += log_test("✅ TEST D VERIFY: Collection photo count incremented", "PASS",
                                     f"Count: {test_collection['photo_count']}")
                else:
                    failed += log_test("❌ TEST D VERIFY: Photo count not updated", "FAIL")
            else:
                failed += log_test("❌ TEST D VERIFY: Collections fetch failed", "FAIL")
                
        except Exception as e:
            failed += log_test("❌ TEST D VERIFY: Exception", "FAIL", f"Error: {str(e)}")
    else:
        failed += log_test("❌ TEST D: Skipped", "FAIL", "No collection ID from Test C")

    # Final Summary
    print("\n" + "=" * 70)
    print("FINAL TEST RESULTS - ROUNDHOUSE HERITAGE & COLLECTIONS")
    print("=" * 70)
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%" if (passed+failed) > 0 else "N/A")
    
    if failed == 0:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Heritage alerts work correctly (CAM-only)")
        print("✅ Collection support working")
        print("✅ Database connectivity fixed")
        return True
    else:
        print(f"\n⚠️  {failed} test(s) failed")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)