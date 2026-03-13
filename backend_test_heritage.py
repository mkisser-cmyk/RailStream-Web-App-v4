#!/usr/bin/env python3
"""
Roundhouse Heritage Alert and Collection Features - Backend API Tests
Tests heritage alerts (CAM-only) and collection support features.
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

def main():
    """Run all heritage alert and collection tests."""
    print("=" * 60)
    print("ROUNDHOUSE HERITAGE ALERT & COLLECTION TESTS")
    print("=" * 60)
    
    passed = 0
    failed = 0
    
    # Test A: Login and get auth token
    try:
        login_response = requests.post(f"{BASE_URL}/api/auth/login", 
            json={"username": TEST_USER, "password": TEST_PASS},
            timeout=30
        )
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            if login_data.get('access_token'):
                auth_token = login_data['access_token']
                auth_headers = {"Authorization": f"Bearer {auth_token}"}
                tier = login_data.get('user', {}).get('membership_tier', 'unknown')
                passed += log_test(f"LOGIN: Auth successful (tier: {tier})", "PASS", f"Token: {auth_token[:20]}...")
            else:
                failed += log_test("LOGIN: Failed", "FAIL", "No access_token in response")
                return
        else:
            failed += log_test("LOGIN: Failed", "FAIL", f"Status: {login_response.status_code}")
            return
            
    except Exception as e:
        failed += log_test("LOGIN: Failed", "FAIL", f"Exception: {str(e)}")
        return
    
    # Test B: Get chat rooms to find "The Yard" room ID
    try:
        rooms_response = requests.get(f"{BASE_URL}/api/chat?action=rooms", timeout=30)
        
        if rooms_response.status_code == 200:
            rooms_data = rooms_response.json()
            yard_room = next((r for r in rooms_data.get('rooms', []) if r['name'] == 'The Yard'), None)
            if yard_room:
                yard_room_id = yard_room['id']
                passed += log_test("GET CHAT ROOMS: Found 'The Yard'", "PASS", f"Room ID: {yard_room_id}")
            else:
                failed += log_test("GET CHAT ROOMS: 'The Yard' not found", "FAIL", "Cannot test heritage alerts")
                return
        else:
            failed += log_test("GET CHAT ROOMS: Failed", "FAIL", f"Status: {rooms_response.status_code}")
            return
            
    except Exception as e:
        failed += log_test("GET CHAT ROOMS: Failed", "FAIL", f"Exception: {str(e)}")
        return

    # Test 1: Camera capture with heritage unit (should trigger alert)
    try:
        heritage_cam_data = {
            "action": "create",
            "railroad": "NS",
            "locomotive_numbers": "NS 1073",
            "location": "Fostoria, Ohio",
            "source": "camera_capture",
            "camera_name": "Fostoria Cam 1", 
            "tags": ["heritage"],
            "title": "Heritage Unit on Cam"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/roundhouse", 
            json=heritage_cam_data,
            headers=auth_headers,
            timeout=30
        )
        
        if create_response.status_code == 200:
            create_data = create_response.json()
            if create_data.get('ok') and create_data.get('photo'):
                photo_id = create_data['photo']['id']
                is_heritage = create_data['photo'].get('is_heritage')
                heritage_units = create_data['photo'].get('heritage_units', [])
                
                if is_heritage and heritage_units:
                    heritage_info = ', '.join([f"{u['unit']} ({u['name']})" for u in heritage_units])
                    passed += log_test("TEST 1: Camera capture heritage photo created", "PASS", 
                                     f"Photo ID: {photo_id}, Heritage: {heritage_info}")
                else:
                    failed += log_test("TEST 1: Heritage detection failed", "FAIL", 
                                     f"is_heritage: {is_heritage}, units: {heritage_units}")
            else:
                failed += log_test("TEST 1: Photo creation failed", "FAIL", f"Response: {create_data}")
        else:
            failed += log_test("TEST 1: API error", "FAIL", f"Status: {create_response.status_code}")
            
    except Exception as e:
        failed += log_test("TEST 1: Exception", "FAIL", f"Error: {str(e)}")

    # Wait for heritage alert to be posted
    time.sleep(2)

    # Check for heritage alert in chat
    try:
        messages_response = requests.get(f"{BASE_URL}/api/chat?action=messages&room_id={yard_room_id}&limit=10", 
                                       timeout=30)
        
        if messages_response.status_code == 200:
            messages_data = messages_response.json()
            messages = messages_data.get('messages', [])
            
            # Look for recent heritage alert from RoundhouseBot
            heritage_alert = None
            for msg in messages:
                if (msg.get('username') == 'RoundhouseBot' and 
                    'HERITAGE UNIT ON CAM' in msg.get('message', '')):
                    heritage_alert = msg
                    break
            
            if heritage_alert:
                alert_msg = heritage_alert['message']
                passed += log_test("TEST 1 ALERT: Heritage alert found in chat", "PASS", 
                                 f"Message: {alert_msg}")
            else:
                failed += log_test("TEST 1 ALERT: Heritage alert not found", "FAIL", 
                                 "No RoundhouseBot message with 'HERITAGE UNIT ON CAM'")
        else:
            failed += log_test("TEST 1 ALERT: Chat messages fetch failed", "FAIL", 
                             f"Status: {messages_response.status_code}")
            
    except Exception as e:
        failed += log_test("TEST 1 ALERT: Exception", "FAIL", f"Error: {str(e)}")

    # Test 2: Trackside upload with heritage unit (should NOT trigger alert)
    try:
        heritage_trackside_data = {
            "action": "create",
            "railroad": "NS", 
            "locomotive_numbers": "NS 1073",
            "location": "Fostoria, Ohio",
            "source": "trackside",
            "tags": ["heritage"],
            "title": "Heritage Unit Trackside"
        }
        
        create_response2 = requests.post(f"{BASE_URL}/api/roundhouse",
            json=heritage_trackside_data, 
            headers=auth_headers,
            timeout=30
        )
        
        if create_response2.status_code == 200:
            create_data2 = create_response2.json()
            if create_data2.get('ok') and create_data2.get('photo'):
                photo_id2 = create_data2['photo']['id']
                source = create_data2['photo'].get('source')
                is_heritage = create_data2['photo'].get('is_heritage')
                
                if source == 'trackside' and is_heritage:
                    passed += log_test("TEST 2: Trackside heritage photo created", "PASS",
                                     f"Photo ID: {photo_id2}, Source: {source}")
                else:
                    failed += log_test("TEST 2: Photo creation issue", "FAIL",
                                     f"Source: {source}, Heritage: {is_heritage}")
            else:
                failed += log_test("TEST 2: Photo creation failed", "FAIL", f"Response: {create_data2}")
        else:
            failed += log_test("TEST 2: API error", "FAIL", f"Status: {create_response2.status_code}")
            
    except Exception as e:
        failed += log_test("TEST 2: Exception", "FAIL", f"Error: {str(e)}")

    # Wait and check that NO new heritage alert was created
    time.sleep(2)

    try:
        messages_response2 = requests.get(f"{BASE_URL}/api/chat?action=messages&room_id={yard_room_id}&limit=5", 
                                        timeout=30)
        
        if messages_response2.status_code == 200:
            messages_data2 = messages_response2.json()
            recent_messages = messages_data2.get('messages', [])
            
            # Look for any NEW heritage alerts (should be none)
            new_alerts = [msg for msg in recent_messages[-3:] 
                         if (msg.get('username') == 'RoundhouseBot' and 
                             'HERITAGE UNIT ON CAM' in msg.get('message', '') and
                             'trackside' not in msg.get('message', '').lower())]
            
            if len(new_alerts) == 0:
                passed += log_test("TEST 2 NO-ALERT: Trackside upload did NOT trigger alert", "PASS",
                                 "Correctly filtered out non-camera sources")
            else:
                failed += log_test("TEST 2 NO-ALERT: Unexpected heritage alert found", "FAIL",
                                 f"Found {len(new_alerts)} new alerts for trackside upload")
        else:
            failed += log_test("TEST 2 NO-ALERT: Chat check failed", "FAIL",
                             f"Status: {messages_response2.status_code}")
            
    except Exception as e:
        failed += log_test("TEST 2 NO-ALERT: Exception", "FAIL", f"Error: {str(e)}")

    # Test 3: Create collection
    try:
        collection_data = {
            "action": "create_collection",
            "name": "UP Locomotives Test",
            "description": "Union Pacific power"
        }
        
        coll_response = requests.post(f"{BASE_URL}/api/roundhouse",
            json=collection_data,
            headers=auth_headers, 
            timeout=30
        )
        
        if coll_response.status_code == 200:
            coll_data = coll_response.json()
            if coll_data.get('ok') and coll_data.get('collection'):
                collection_id = coll_data['collection']['id']
                coll_name = coll_data['collection']['name']
                passed += log_test("TEST 3: Collection created successfully", "PASS",
                                 f"ID: {collection_id}, Name: {coll_name}")
            else:
                failed += log_test("TEST 3: Collection creation failed", "FAIL", f"Response: {coll_data}")
                collection_id = None
        else:
            failed += log_test("TEST 3: Collection API error", "FAIL", f"Status: {coll_response.status_code}")
            collection_id = None
            
    except Exception as e:
        failed += log_test("TEST 3: Collection exception", "FAIL", f"Error: {str(e)}")
        collection_id = None

    # Test 4: Create photo in collection
    if collection_id:
        try:
            photo_in_coll_data = {
                "action": "create",
                "railroad": "UP",
                "locomotive_numbers": "UP 1943", 
                "source": "camera_capture",
                "camera_name": "Test Cam",
                "collection_id": collection_id,
                "collection_name": "UP Locomotives Test",
                "tags": []
            }
            
            photo_response = requests.post(f"{BASE_URL}/api/roundhouse",
                json=photo_in_coll_data,
                headers=auth_headers,
                timeout=30
            )
            
            if photo_response.status_code == 200:
                photo_data = photo_response.json()
                if photo_data.get('ok') and photo_data.get('photo'):
                    photo_coll_id = photo_data['photo'].get('collection_id')
                    photo_coll_name = photo_data['photo'].get('collection_name')
                    
                    if photo_coll_id == collection_id:
                        passed += log_test("TEST 4: Photo created in collection", "PASS",
                                         f"Collection: {photo_coll_name}")
                    else:
                        failed += log_test("TEST 4: Collection ID mismatch", "FAIL",
                                         f"Expected: {collection_id}, Got: {photo_coll_id}")
                else:
                    failed += log_test("TEST 4: Photo creation failed", "FAIL", f"Response: {photo_data}")
            else:
                failed += log_test("TEST 4: Photo API error", "FAIL", f"Status: {photo_response.status_code}")
                
        except Exception as e:
            failed += log_test("TEST 4: Photo exception", "FAIL", f"Error: {str(e)}")

        # Verify collection photo count incremented
        try:
            collections_response = requests.get(f"{BASE_URL}/api/roundhouse?action=collections", timeout=30)
            
            if collections_response.status_code == 200:
                collections_data = collections_response.json()
                if collections_data.get('ok'):
                    test_collection = next((c for c in collections_data.get('collections', []) 
                                          if c.get('id') == collection_id), None)
                    
                    if test_collection:
                        photo_count = test_collection.get('photo_count', 0)
                        if photo_count > 0:
                            passed += log_test("TEST 4 VERIFY: Collection photo count updated", "PASS",
                                             f"Photo count: {photo_count}")
                        else:
                            failed += log_test("TEST 4 VERIFY: Photo count not updated", "FAIL",
                                             f"Count: {photo_count}")
                    else:
                        failed += log_test("TEST 4 VERIFY: Collection not found", "FAIL",
                                         f"ID {collection_id} not in collections list")
                else:
                    failed += log_test("TEST 4 VERIFY: Collections API error", "FAIL", 
                                     f"Response: {collections_data}")
            else:
                failed += log_test("TEST 4 VERIFY: Collections fetch failed", "FAIL",
                                 f"Status: {collections_response.status_code}")
                
        except Exception as e:
            failed += log_test("TEST 4 VERIFY: Exception", "FAIL", f"Error: {str(e)}")
    else:
        failed += log_test("TEST 4: Skipped", "FAIL", "No collection ID from Test 3")

    # Final Summary
    print("\n" + "=" * 60)
    print(f"ROUNDHOUSE HERITAGE & COLLECTIONS TEST RESULTS")
    print("=" * 60)
    print(f"✅ PASSED: {passed}")
    print(f"❌ FAILED: {failed}")
    print(f"📊 SUCCESS RATE: {(passed/(passed+failed)*100):.1f}%" if (passed+failed) > 0 else "N/A")
    
    if failed == 0:
        print("🎉 ALL TESTS PASSED! Heritage alerts and collections working correctly.")
        return True
    else:
        print(f"⚠️  {failed} test(s) failed. Please review the issues above.")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)