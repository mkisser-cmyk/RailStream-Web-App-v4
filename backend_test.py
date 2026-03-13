#!/usr/bin/env python3
"""
Comprehensive test for Sighting Comments feature
Tests all comment operations: create, list, delete, auth validation
"""

import requests
import json
import time

# Configuration
BASE_URL = "https://photo-modal-enhance.preview.emergentagent.com"
TEST_USERNAME = "chicagotest"
TEST_PASSWORD = "sZyE8cDFk"

def test_sighting_comments():
    """Test the complete sighting comments workflow"""
    print("🧪 Testing Sighting Comments Feature")
    print("=" * 60)
    
    test_results = []
    access_token = None
    sighting_id = None
    comment1_id = None
    comment2_id = None
    
    try:
        # Step 1: Login
        print("\n1️⃣ Step 1: Login with test credentials")
        login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
            "username": TEST_USERNAME,
            "password": TEST_PASSWORD
        })
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            access_token = login_data.get("access_token")
            print(f"✅ Login successful: {login_data.get('user', {}).get('username')}")
            print(f"   Token obtained: {access_token[:20]}...")
            test_results.append("✅ Login: SUCCESS")
        else:
            print(f"❌ Login failed: {login_response.status_code} - {login_response.text}")
            test_results.append("❌ Login: FAILED")
            return test_results

        headers = {"Authorization": f"Bearer {access_token}"}

        # Step 2: Create a sighting first (needed for comments)
        print("\n2️⃣ Step 2: Create a test sighting")
        sighting_data = {
            "camera_id": "test-cam-1",
            "camera_name": "Fostoria Cam 1", 
            "sighting_time": "2026-03-13T18:30:00Z",
            "railroad": "NS",
            "train_id": "Q335",
            "direction": "Eastbound", 
            "locomotives": "NS 9254, NS 1073",
            "train_type": "Intermodal",
            "notes": "Heritage unit trailing!"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/sightings", 
                                      json=sighting_data, 
                                      headers=headers)
        
        if create_response.status_code == 201:
            sighting_result = create_response.json()
            sighting_id = sighting_result.get("sighting", {}).get("_id")
            print(f"✅ Sighting created successfully")
            print(f"   Sighting ID: {sighting_id}")
            test_results.append("✅ Create Sighting: SUCCESS")
        else:
            print(f"❌ Create sighting failed: {create_response.status_code} - {create_response.text}")
            test_results.append("❌ Create Sighting: FAILED")
            return test_results

        # Step 3: Add first comment
        print("\n3️⃣ Step 3: Add first comment")
        comment1_data = {
            "sighting_id": sighting_id,
            "text": "Great catch! Love seeing heritage units in the wild."
        }
        
        comment1_response = requests.post(f"{BASE_URL}/api/sightings/comments", 
                                        json=comment1_data, 
                                        headers=headers)
        
        if comment1_response.status_code == 200:
            comment1_result = comment1_response.json()
            if comment1_result.get("ok") and comment1_result.get("comment"):
                comment1_id = comment1_result["comment"]["id"]
                print(f"✅ First comment added successfully")
                print(f"   Comment ID: {comment1_id}")
                print(f"   Comment: {comment1_result['comment']['text']}")
                print(f"   Username: {comment1_result['comment']['username']}")
                test_results.append("✅ Add Comment 1: SUCCESS")
            else:
                print(f"❌ First comment response invalid: {comment1_result}")
                test_results.append("❌ Add Comment 1: FAILED")
        else:
            print(f"❌ First comment failed: {comment1_response.status_code} - {comment1_response.text}")
            test_results.append("❌ Add Comment 1: FAILED")

        # Step 4: Add second comment  
        print("\n4️⃣ Step 4: Add second comment")
        comment2_data = {
            "sighting_id": sighting_id,
            "text": "Was this on the main or siding?"
        }
        
        comment2_response = requests.post(f"{BASE_URL}/api/sightings/comments", 
                                        json=comment2_data, 
                                        headers=headers)
        
        if comment2_response.status_code == 200:
            comment2_result = comment2_response.json()
            if comment2_result.get("ok") and comment2_result.get("comment"):
                comment2_id = comment2_result["comment"]["id"]
                print(f"✅ Second comment added successfully")
                print(f"   Comment ID: {comment2_id}")
                print(f"   Comment: {comment2_result['comment']['text']}")
                test_results.append("✅ Add Comment 2: SUCCESS")
            else:
                print(f"❌ Second comment response invalid: {comment2_result}")
                test_results.append("❌ Add Comment 2: FAILED")
        else:
            print(f"❌ Second comment failed: {comment2_response.status_code} - {comment2_response.text}")
            test_results.append("❌ Add Comment 2: FAILED")

        # Step 5: Verify comments appear in sighting
        print("\n5️⃣ Step 5: Verify comments appear in sighting")
        list_response = requests.get(f"{BASE_URL}/api/sightings?limit=5", headers=headers)
        
        if list_response.status_code == 200:
            sightings_data = list_response.json()
            found_sighting = None
            for sighting in sightings_data.get("sightings", []):
                if sighting.get("_id") == sighting_id:
                    found_sighting = sighting
                    break
            
            if found_sighting:
                comments = found_sighting.get("comments", [])
                print(f"✅ Sighting found with {len(comments)} comments")
                if len(comments) == 2:
                    print("   ✅ Both comments are present")
                    for i, comment in enumerate(comments, 1):
                        print(f"      Comment {i}: {comment.get('text')} (ID: {comment.get('id')})")
                    test_results.append("✅ Verify Comments in Sighting: SUCCESS")
                else:
                    print(f"   ❌ Expected 2 comments, found {len(comments)}")
                    test_results.append("❌ Verify Comments in Sighting: FAILED")
            else:
                print(f"❌ Could not find sighting with ID {sighting_id}")
                test_results.append("❌ Verify Comments in Sighting: FAILED")
        else:
            print(f"❌ List sightings failed: {list_response.status_code} - {list_response.text}")
            test_results.append("❌ Verify Comments in Sighting: FAILED")

        # Step 6: Delete first comment
        print("\n6️⃣ Step 6: Delete first comment")
        if comment1_id:
            delete_response = requests.delete(f"{BASE_URL}/api/sightings/comments/{comment1_id}?sighting_id={sighting_id}", 
                                            headers=headers)
            
            if delete_response.status_code == 200:
                delete_result = delete_response.json()
                if delete_result.get("ok"):
                    print(f"✅ Comment deleted successfully")
                    test_results.append("✅ Delete Comment: SUCCESS")
                else:
                    print(f"❌ Delete comment response invalid: {delete_result}")
                    test_results.append("❌ Delete Comment: FAILED")
            else:
                print(f"❌ Delete comment failed: {delete_response.status_code} - {delete_response.text}")
                test_results.append("❌ Delete Comment: FAILED")
        else:
            print("❌ No comment1_id to delete")
            test_results.append("❌ Delete Comment: FAILED")

        # Step 7: Verify comment was deleted
        print("\n7️⃣ Step 7: Verify comment was deleted")
        verify_response = requests.get(f"{BASE_URL}/api/sightings?limit=5", headers=headers)
        
        if verify_response.status_code == 200:
            verify_data = verify_response.json()
            found_sighting = None
            for sighting in verify_data.get("sightings", []):
                if sighting.get("_id") == sighting_id:
                    found_sighting = sighting
                    break
            
            if found_sighting:
                comments = found_sighting.get("comments", [])
                print(f"✅ Sighting found with {len(comments)} comments after deletion")
                if len(comments) == 1:
                    print("   ✅ Only 1 comment remaining (deletion successful)")
                    remaining_comment = comments[0]
                    print(f"      Remaining comment: {remaining_comment.get('text')}")
                    test_results.append("✅ Verify Comment Deletion: SUCCESS")
                else:
                    print(f"   ❌ Expected 1 comment, found {len(comments)}")
                    test_results.append("❌ Verify Comment Deletion: FAILED")
            else:
                print(f"❌ Could not find sighting with ID {sighting_id}")
                test_results.append("❌ Verify Comment Deletion: FAILED")
        else:
            print(f"❌ Verify deletion failed: {verify_response.status_code} - {verify_response.text}")
            test_results.append("❌ Verify Comment Deletion: FAILED")

        # Step 8: Test auth validation - comment without token
        print("\n8️⃣ Step 8: Test auth validation - comment without token")
        no_auth_response = requests.post(f"{BASE_URL}/api/sightings/comments", json={
            "sighting_id": sighting_id,
            "text": "This should fail"
        })
        
        if no_auth_response.status_code == 401:
            print(f"✅ Auth validation working - correctly rejected with 401")
            test_results.append("✅ Auth Validation (No Token): SUCCESS")
        else:
            print(f"❌ Auth validation failed - expected 401, got {no_auth_response.status_code}")
            test_results.append("❌ Auth Validation (No Token): FAILED")

        # Step 9: Test validation - missing sighting_id
        print("\n9️⃣ Step 9: Test validation - missing sighting_id")
        missing_id_response = requests.post(f"{BASE_URL}/api/sightings/comments", 
                                          json={"text": "Missing sighting_id"}, 
                                          headers=headers)
        
        if missing_id_response.status_code == 400:
            print(f"✅ Validation working - correctly rejected missing sighting_id with 400")
            test_results.append("✅ Validation (Missing ID): SUCCESS")
        else:
            print(f"❌ Validation failed - expected 400, got {missing_id_response.status_code}")
            test_results.append("❌ Validation (Missing ID): FAILED")

    except Exception as e:
        print(f"❌ Test failed with exception: {str(e)}")
        test_results.append(f"❌ Exception: {str(e)}")

    print("\n" + "="*60)
    print("📊 FINAL TEST RESULTS")
    print("="*60)
    
    success_count = len([r for r in test_results if r.startswith("✅")])
    total_count = len(test_results)
    
    for result in test_results:
        print(result)
    
    print(f"\n🎯 Overall: {success_count}/{total_count} tests passed ({success_count/total_count*100:.1f}%)")
    
    return test_results


if __name__ == "__main__":
    test_sighting_comments()