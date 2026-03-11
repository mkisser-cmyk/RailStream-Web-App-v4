#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timezone
import uuid

# Test configuration
BASE_URL = "https://sighting-log-debug.preview.emergentagent.com/api"
USERNAME = "chicagotest"
PASSWORD = "sZyE8cDFk"
CAMERA_ID = "699894a055761e18195294e3"

def test_specific_review_scenarios():
    """Test the exact scenarios mentioned in the review request"""
    print("🧪 TESTING SPECIFIC REVIEW REQUEST SCENARIOS")
    print("=" * 60)
    
    # Login
    session = requests.Session()
    session.headers.update({'Content-Type': 'application/json'})
    
    print("🔐 Logging in...")
    login_resp = session.post(f"{BASE_URL}/auth/login", json={
        "username": USERNAME,
        "password": PASSWORD
    })
    
    if login_resp.status_code != 200:
        print(f"❌ Login failed: {login_resp.status_code}")
        return False
    
    token = login_resp.json().get('access_token')
    session.headers.update({'Authorization': f'Bearer {token}'})
    print("✅ Login successful")
    
    # Test 1: Create sighting with specific ISO timestamp format from review
    print("\n📝 Test 1: Create with ISO timestamp '2026-03-11T15:43:27.000Z'")
    iso_timestamp = "2026-03-11T15:43:27.000Z"
    
    create_data = {
        "camera_id": CAMERA_ID,
        "camera_name": "Atlanta Howell Yard East", 
        "location": "Atlanta, GA",
        "sighting_time": iso_timestamp,
        "railroad": "CSX",
        "train_id": "Q12345",
        "direction": "Eastbound",
        "locomotives": "ES44AC",
        "train_type": "Intermodal",
        "notes": "Review request test scenario"
    }
    
    create_resp = session.post(f"{BASE_URL}/sightings", json=create_data)
    
    if create_resp.status_code != 201:
        print(f"❌ Create failed: {create_resp.status_code} - {create_resp.text}")
        return False
    
    sighting = create_resp.json().get('sighting', {})
    sighting_id = sighting.get('_id')
    stored_timestamp = sighting.get('sighting_time')
    
    print(f"✅ Sighting created: {sighting_id}")
    print(f"   Input:  {iso_timestamp}")
    print(f"   Stored: {stored_timestamp}")
    
    if stored_timestamp != iso_timestamp:
        print("❌ Timestamp not preserved during creation!")
        return False
    
    print("✅ Timestamp preserved correctly")
    
    # Test 2: Edit with new ISO timestamp
    print(f"\n✏️  Test 2: Edit sighting with new ISO timestamp")
    new_timestamp = "2026-03-11T16:30:15.500Z"
    
    edit_data = {
        "sighting_time": new_timestamp,
        "notes": "Updated in review test"
    }
    
    edit_resp = session.put(f"{BASE_URL}/sightings/{sighting_id}", json=edit_data)
    
    if edit_resp.status_code != 200:
        print(f"❌ Edit failed: {edit_resp.status_code} - {edit_resp.text}")
        return False
    
    updated_sighting = edit_resp.json().get('sighting', {})
    updated_timestamp = updated_sighting.get('sighting_time')
    
    print(f"✅ Sighting updated")
    print(f"   New input:  {new_timestamp}")
    print(f"   New stored: {updated_timestamp}")
    
    if updated_timestamp != new_timestamp:
        print("❌ Timestamp not preserved during update!")
        return False
    
    print("✅ Timestamp preserved correctly during update")
    
    # Test 3: Verify sighting_time in response is valid for replay URL
    print(f"\n🔍 Test 3: Verify replay URL calculation validity")
    
    # Parse timestamp and check secsAgo calculation
    try:
        from datetime import datetime, timezone
        sighting_dt = datetime.fromisoformat(updated_timestamp.replace('Z', '+00:00'))
        now_dt = datetime.now(timezone.utc)
        
        sighting_ts = sighting_dt.timestamp()
        now_ts = now_dt.timestamp()
        secs_ago = now_ts - sighting_ts
        
        print(f"   Sighting timestamp: {sighting_ts}")
        print(f"   Current timestamp:  {now_ts}")
        print(f"   SecsAgo: {secs_ago:.1f}")
        
        if 0 < secs_ago < 604800:  # 7 days in seconds
            print("✅ SecsAgo is valid for replay URL (0 < secsAgo < 604800)")
        else:
            print(f"❌ SecsAgo {secs_ago} is NOT valid for replay URL")
            return False
            
    except Exception as e:
        print(f"❌ Failed to parse timestamp: {e}")
        return False
    
    # Test 4: Round-trip verification (create → edit → read)
    print(f"\n🔄 Test 4: Round-trip verification")
    
    # Read back via GET /api/sightings
    list_resp = session.get(f"{BASE_URL}/sightings")
    if list_resp.status_code != 200:
        print(f"❌ Failed to fetch sightings list: {list_resp.status_code}")
        return False
    
    sightings_data = list_resp.json()
    sightings = sightings_data.get('sightings', [])
    
    # Find our sighting
    our_sighting = next((s for s in sightings if s.get('_id') == sighting_id), None)
    
    if not our_sighting:
        print("❌ Sighting not found in list")
        return False
    
    final_timestamp = our_sighting.get('sighting_time')
    print(f"✅ Round-trip complete")
    print(f"   Final timestamp: {final_timestamp}")
    
    if final_timestamp != new_timestamp:
        print(f"❌ Round-trip failed! Expected {new_timestamp}, got {final_timestamp}")
        return False
    
    print("✅ Round-trip maintains exact ISO timestamp")
    
    # Cleanup
    print(f"\n🧹 Cleaning up...")
    delete_resp = session.delete(f"{BASE_URL}/sightings/{sighting_id}")
    if delete_resp.status_code == 200:
        print("✅ Test sighting deleted")
    else:
        print(f"⚠️  Failed to delete test sighting: {delete_resp.status_code}")
    
    print(f"\n🎯 ALL REVIEW SCENARIOS PASSED")
    print("   ✅ Create with full ISO timestamp → preserved")
    print("   ✅ Edit with full ISO timestamp → preserved") 
    print("   ✅ sighting_time valid for replay URL calculation")
    print("   ✅ Round-trip: create → edit → read → timestamp intact")
    
    return True

if __name__ == "__main__":
    success = test_specific_review_scenarios()
    exit(0 if success else 1)