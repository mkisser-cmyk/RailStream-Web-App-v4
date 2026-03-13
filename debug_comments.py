#!/usr/bin/env python3
"""
Debug sighting comments deletion issue
"""

import requests
import json

BASE_URL = "https://photo-modal-enhance.preview.emergentagent.com"
TEST_USERNAME = "chicagotest"
TEST_PASSWORD = "sZyE8cDFk"

def debug_comments_deletion():
    print("🔍 Debugging Comments Deletion Issue")
    print("=" * 50)
    
    # Login first
    login_response = requests.post(f"{BASE_URL}/api/auth/login", json={
        "username": TEST_USERNAME,
        "password": TEST_PASSWORD
    })
    
    if login_response.status_code != 200:
        print(f"❌ Login failed: {login_response.status_code}")
        return
    
    access_token = login_response.json().get("access_token")
    headers = {"Authorization": f"Bearer {access_token}"}
    
    # Create sighting
    sighting_data = {
        "camera_id": "test-cam-debug",
        "camera_name": "Debug Camera", 
        "sighting_time": "2026-03-13T19:00:00Z",
        "railroad": "CSX",
        "train_id": "Q123",
        "direction": "Westbound", 
        "locomotives": "CSX 123",
        "train_type": "Manifest",
        "notes": "Debug test"
    }
    
    create_response = requests.post(f"{BASE_URL}/api/sightings", 
                                  json=sighting_data, 
                                  headers=headers)
    
    if create_response.status_code != 201:
        print(f"❌ Create sighting failed: {create_response.status_code} - {create_response.text}")
        return
    
    sighting_id = create_response.json().get("sighting", {}).get("_id")
    print(f"✅ Created sighting: {sighting_id}")
    
    # Add comment
    comment_response = requests.post(f"{BASE_URL}/api/sightings/comments", 
                                   json={
                                       "sighting_id": sighting_id,
                                       "text": "Debug comment"
                                   }, 
                                   headers=headers)
    
    if comment_response.status_code != 200:
        print(f"❌ Add comment failed: {comment_response.status_code} - {comment_response.text}")
        return
    
    comment_id = comment_response.json().get("comment", {}).get("id")
    print(f"✅ Added comment: {comment_id}")
    
    # Test GET request to verify sighting exists
    print(f"\n🔍 Testing GET request to verify sighting exists...")
    list_response = requests.get(f"{BASE_URL}/api/sightings?limit=1", headers=headers)
    if list_response.status_code == 200:
        sightings = list_response.json().get("sightings", [])
        found = any(s.get("_id") == sighting_id for s in sightings)
        print(f"   Sighting found in GET list: {found}")
    
    # Test different delete URLs
    print(f"\n🔍 Testing delete with different URL formats...")
    
    # Format 1: With query parameter (current)
    print(f"   Trying: DELETE /api/sightings/comments/{comment_id}?sighting_id={sighting_id}")
    delete_response1 = requests.delete(f"{BASE_URL}/api/sightings/comments/{comment_id}?sighting_id={sighting_id}", 
                                      headers=headers)
    print(f"   Response: {delete_response1.status_code} - {delete_response1.text}")
    
    # Let's also test without encoding the comment_id or sighting_id
    print(f"\n🔍 Raw values being used:")
    print(f"   sighting_id: '{sighting_id}' (length: {len(sighting_id)})")
    print(f"   comment_id: '{comment_id}' (length: {len(comment_id)})")
    
    # Try manual verification by checking what the API received
    print(f"\n🔍 Manual verification - Let me check logs...")

if __name__ == "__main__":
    debug_comments_deletion()