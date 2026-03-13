#!/usr/bin/env python3
"""
Test URL parsing issue in DELETE endpoint - simpler version
"""

import requests

BASE_URL = "https://photo-modal-enhance.preview.emergentagent.com"
TEST_USERNAME = "chicagotest"
TEST_PASSWORD = "sZyE8cDFk"

def test_url_parsing_simple():
    print("🔍 Testing URL Parsing Issue")
    print("=" * 35)
    
    # Use existing sighting to test URL parsing
    comment_id = "fa1d2c8d-f2fa-4225-a518-ea7f3e199946"
    sighting_id = "a4a93909-9e0f-4168-89f6-8ab00edcb35e"
    
    # Test URL parsing logic manually  
    route_part = f"/sightings/comments/{comment_id}"
    extracted_comment_id = route_part.split('/sightings/comments/')[1]
    print(f"   Route part: {route_part}")
    print(f"   Extracted comment_id: '{extracted_comment_id}' (length: {len(extracted_comment_id)})")
    print(f"   Original comment_id:  '{comment_id}' (length: {len(comment_id)})")
    print(f"   IDs match: {extracted_comment_id == comment_id}")
    
    # The issue might be that the query string is included in the route parsing
    # Let's simulate what happens when the route includes query params
    full_route = f"/sightings/comments/{comment_id}?sighting_id={sighting_id}"
    bad_extracted_id = full_route.split('/sightings/comments/')[1]
    print(f"\n🔍 If route includes query params:")
    print(f"   Full route: {full_route}")
    print(f"   Bad extracted ID: '{bad_extracted_id}'")
    print(f"   This would include query params: {bad_extracted_id != comment_id}")

if __name__ == "__main__":
    test_url_parsing_simple()