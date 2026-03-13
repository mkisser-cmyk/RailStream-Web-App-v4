#!/usr/bin/env python3
"""
Test database connectivity for sightings
"""

import requests
import json

BASE_URL = "https://photo-modal-enhance.preview.emergentagent.com"
TEST_USERNAME = "chicagotest"
TEST_PASSWORD = "sZyE8cDFk"

def test_database_connectivity():
    print("🔍 Testing Database Connectivity")
    print("=" * 40)
    
    # Login
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    access_token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    print("✅ Login successful")
    
    # Test 1: Get all existing sightings
    print("\n🔍 Test 1: Get all existing sightings")
    list_response = requests.get(f"{BASE_URL}/api/sightings?limit=100", headers=headers)
    if list_response.status_code == 200:
        sightings_data = list_response.json()
        print(f"   Found {len(sightings_data.get('sightings', []))} existing sightings")
        print(f"   Total: {sightings_data.get('total', 0)}")
        
        # If there are existing sightings, test commenting on one
        if sightings_data.get('sightings'):
            existing_sighting = sightings_data['sightings'][0]
            existing_id = existing_sighting.get('_id')
            print(f"   Testing comments on existing sighting: {existing_id}")
            
            # Add comment to existing sighting
            comment_response = requests.post(f"{BASE_URL}/api/sightings/comments", 
                                           json={
                                               "sighting_id": existing_id,
                                               "text": "Test comment on existing sighting"
                                           }, 
                                           headers=headers)
            print(f"   Add comment response: {comment_response.status_code}")
            if comment_response.status_code == 200:
                comment_data = comment_response.json()
                comment_id = comment_data.get('comment', {}).get('id')
                print(f"   Comment added: {comment_id}")
                
                # Try to delete the comment
                delete_response = requests.delete(f"{BASE_URL}/api/sightings/comments/{comment_id}?sighting_id={existing_id}", 
                                                headers=headers)
                print(f"   Delete comment response: {delete_response.status_code}")
                if delete_response.status_code != 200:
                    print(f"   Delete error: {delete_response.text}")
                else:
                    print("   ✅ Comment deletion successful")
            
    else:
        print(f"   ❌ Failed to get sightings: {list_response.status_code} - {list_response.text}")

if __name__ == "__main__":
    test_database_connectivity()