#!/usr/bin/env python3
"""
Test authentication requirement for sightings creation using separate session
"""

import requests
import json

BASE_URL = "https://roundhouse-staging.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

def test_auth_requirement():
    """Test that sightings creation actually requires authentication"""
    # Create fresh session with no cookies/tokens
    session = requests.Session()
    
    sighting_data = {
        "camera_id": "699894a055761e18195294e3",
        "railroad": "NS",
        "sighting_time": "2026-03-11T02:30:00"
    }
    
    # Make request without any authentication
    response = session.post(f"{API_URL}/sightings", json=sighting_data)
    
    print(f"Response Status: {response.status_code}")
    print(f"Response Headers: {dict(response.headers)}")
    
    if response.headers.get('content-type', '').startswith('application/json'):
        data = response.json()
        print(f"Response Data: {json.dumps(data, indent=2)}")
    else:
        print(f"Response Text: {response.text}")
    
    if response.status_code in [401, 403]:
        print("✅ PASS: Authentication is properly required")
        return True
    else:
        print("❌ FAIL: Authentication check is not working properly")
        return False

if __name__ == "__main__":
    test_auth_requirement()