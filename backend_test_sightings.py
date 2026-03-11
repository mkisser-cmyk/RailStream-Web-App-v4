#!/usr/bin/env python3
"""
RailStream Sightings API Testing Script
Tests all sightings CRUD API endpoints as specified in the review request
"""

import requests
import json
import sys
import base64
from typing import Dict, Any, Optional

# Base URL from environment  
BASE_URL = "https://hls-timestamp-fix.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

# Test credentials from review request
TEST_USERNAME = "chicagotest"
TEST_PASSWORD = "sZyE8cDFk"

# Sample base64 JPEG image (1x1 pixel for testing)
SAMPLE_IMAGE_BASE64 = "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAFRABAAAAAAAAAAAAAAAAAAAABf/aAAwDAQACEQMRAD8AJQB//9k="

class SightingsAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = {}
        self.created_sighting_id = None
        self.uploaded_image_filename = None
        
    def log_result(self, test_name: str, success: bool, message: str, response_data: Any = None):
        """Log test results"""
        self.test_results[test_name] = {
            'success': success,
            'message': message,
            'response_data': response_data
        }
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if response_data and not success:
            print(f"   Response: {json.dumps(response_data, indent=2) if isinstance(response_data, (dict, list)) else str(response_data)}")
    
    def test_auth_login(self):
        """Test auth login with test credentials"""
        try:
            login_data = {
                "username": TEST_USERNAME,
                "password": TEST_PASSWORD
            }
            response = self.session.post(f"{API_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                if 'access_token' in data:
                    self.token = data['access_token']
                    user_info = data.get('user', {})
                    tier = user_info.get('membership_tier', 'unknown')
                    self.log_result("Auth Login", True, f"Login successful, tier: {tier}")
                    return True
                else:
                    self.log_result("Auth Login", False, "Missing access_token in response", data)
                    return False
            else:
                self.log_result("Auth Login", False, f"HTTP {response.status_code}", 
                              response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text)
                return False
        except Exception as e:
            self.log_result("Auth Login", False, f"Exception: {str(e)}")
            return False
    
    def test_sightings_list_public(self):
        """Test GET /api/sightings - public endpoint"""
        try:
            response = self.session.get(f"{API_URL}/sightings")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['ok', 'sightings', 'total', 'pages']
                if all(field in data for field in required_fields):
                    if data['ok'] is True and isinstance(data['sightings'], list):
                        self.log_result("Sightings List Public", True, f"Retrieved {data['total']} sightings, {data['pages']} pages")
                        return True
                    else:
                        self.log_result("Sightings List Public", False, "Invalid response structure", data)
                        return False
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_result("Sightings List Public", False, f"Missing fields: {missing}", data)
                    return False
            else:
                self.log_result("Sightings List Public", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Sightings List Public", False, f"Exception: {str(e)}")
            return False
    
    def test_sightings_list_with_filters(self):
        """Test GET /api/sightings with filters"""
        try:
            # Test with railroad filter
            response = self.session.get(f"{API_URL}/sightings?railroad=CSX")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') is True:
                    self.log_result("Sightings List Filters", True, f"Railroad filter works: {data['total']} CSX sightings")
                else:
                    self.log_result("Sightings List Filters", False, "ok field not true", data)
                    return False
            else:
                self.log_result("Sightings List Filters", False, f"HTTP {response.status_code}", response.text)
                return False
            
            # Test with pagination
            response = self.session.get(f"{API_URL}/sightings?page=1&limit=5")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') is True:
                    sightings_count = len(data['sightings'])
                    self.log_result("Sightings List Pagination", True, f"Pagination works: {sightings_count} sightings (limit 5)")
                    return True
                else:
                    self.log_result("Sightings List Pagination", False, "ok field not true", data)
                    return False
            else:
                self.log_result("Sightings List Pagination", False, f"HTTP {response.status_code}", response.text)
                return False
                
        except Exception as e:
            self.log_result("Sightings List Filters", False, f"Exception: {str(e)}")
            return False
    
    def test_sightings_stats(self):
        """Test GET /api/sightings/stats - public endpoint"""
        try:
            response = self.session.get(f"{API_URL}/sightings/stats")
            
            if response.status_code == 200:
                data = response.json()
                required_fields = ['ok', 'total', 'today', 'top_railroads', 'top_locations']
                if all(field in data for field in required_fields):
                    if data['ok'] is True:
                        stats_info = f"total: {data['total']}, today: {data['today']}, " \
                                   f"railroads: {len(data['top_railroads'])}, locations: {len(data['top_locations'])}"
                        self.log_result("Sightings Stats", True, f"Stats retrieved: {stats_info}")
                        return True
                    else:
                        self.log_result("Sightings Stats", False, "ok field not true", data)
                        return False
                else:
                    missing = [f for f in required_fields if f not in data]
                    self.log_result("Sightings Stats", False, f"Missing fields: {missing}", data)
                    return False
            else:
                self.log_result("Sightings Stats", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Sightings Stats", False, f"Exception: {str(e)}")
            return False
    
    def test_create_sighting_auth_required(self):
        """Test POST /api/sightings requires authentication"""
        try:
            sighting_data = {
                "camera_id": "699894a055761e18195294e3",
                "railroad": "NS",
                "sighting_time": "2026-03-11T02:30:00"
            }
            # Make request without auth token
            response = self.session.post(f"{API_URL}/sightings", json=sighting_data)
            
            if response.status_code in [401, 403]:
                self.log_result("Create Sighting Auth Required", True, f"Correctly rejected unauthenticated request with HTTP {response.status_code}")
                return True
            else:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Create Sighting Auth Required", False, f"Expected 401/403, got HTTP {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Create Sighting Auth Required", False, f"Exception: {str(e)}")
            return False
    
    def test_create_sighting_authenticated(self):
        """Test POST /api/sightings with authentication"""
        if not self.token:
            self.log_result("Create Sighting Authenticated", False, "No auth token available")
            return False
            
        try:
            sighting_data = {
                "camera_id": "699894a055761e18195294e3",
                "camera_name": "Atlanta, Georgia",
                "location": "Static View - Bim's Package",
                "sighting_time": "2026-03-11T02:30:00",
                "railroad": "NS",
                "train_id": "Test123",
                "direction": "Eastbound",
                "train_type": "Intermodal",
                "locomotives": "NS 9999",
                "notes": "Test sighting from automated test"
            }
            
            headers = {'Authorization': f'Bearer {self.token}'}
            response = self.session.post(f"{API_URL}/sightings", json=sighting_data, headers=headers)
            
            if response.status_code == 201:
                data = response.json()
                if data.get('ok') is True and 'sighting' in data:
                    sighting = data['sighting']
                    if '_id' in sighting and sighting['railroad'] == 'NS':
                        self.created_sighting_id = sighting['_id']
                        self.log_result("Create Sighting Authenticated", True, f"Sighting created with ID: {self.created_sighting_id}")
                        return True
                    else:
                        self.log_result("Create Sighting Authenticated", False, "Missing _id or incorrect data", data)
                        return False
                else:
                    self.log_result("Create Sighting Authenticated", False, "Invalid response structure", data)
                    return False
            else:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Create Sighting Authenticated", False, f"HTTP {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Create Sighting Authenticated", False, f"Exception: {str(e)}")
            return False
    
    def test_upload_sighting_image(self):
        """Test POST /api/sightings/upload"""
        if not self.token or not self.created_sighting_id:
            self.log_result("Upload Sighting Image", False, "No auth token or sighting ID available")
            return False
            
        try:
            upload_data = {
                "image_data": f"data:image/jpeg;base64,{SAMPLE_IMAGE_BASE64}",
                "sighting_id": self.created_sighting_id
            }
            
            headers = {'Authorization': f'Bearer {self.token}'}
            response = self.session.post(f"{API_URL}/sightings/upload", json=upload_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') is True and 'image_url' in data:
                    image_url = data['image_url']
                    filename = data.get('filename', '')
                    self.uploaded_image_filename = filename
                    self.log_result("Upload Sighting Image", True, f"Image uploaded: {image_url}")
                    return True
                else:
                    self.log_result("Upload Sighting Image", False, "Invalid response structure", data)
                    return False
            else:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Upload Sighting Image", False, f"HTTP {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Upload Sighting Image", False, f"Exception: {str(e)}")
            return False
    
    def test_serve_sighting_image(self):
        """Test GET /api/sightings/image/{filename}"""
        if not self.uploaded_image_filename:
            self.log_result("Serve Sighting Image", False, "No uploaded image filename available")
            return False
            
        try:
            response = self.session.get(f"{API_URL}/sightings/image/{self.uploaded_image_filename}")
            
            if response.status_code == 200:
                content_type = response.headers.get('Content-Type', '')
                if content_type == 'image/jpeg':
                    content_length = len(response.content)
                    self.log_result("Serve Sighting Image", True, f"Image served: {content_type}, {content_length} bytes")
                    return True
                else:
                    self.log_result("Serve Sighting Image", False, f"Wrong content type: {content_type}")
                    return False
            else:
                self.log_result("Serve Sighting Image", False, f"HTTP {response.status_code}")
                return False
        except Exception as e:
            self.log_result("Serve Sighting Image", False, f"Exception: {str(e)}")
            return False
    
    def test_verify_sighting_in_list(self):
        """Test that created sighting appears in list"""
        if not self.created_sighting_id:
            self.log_result("Verify Sighting in List", False, "No created sighting ID available")
            return False
            
        try:
            response = self.session.get(f"{API_URL}/sightings?page=1&limit=10")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') is True:
                    sightings = data['sightings']
                    found_sighting = None
                    for sighting in sightings:
                        if sighting.get('_id') == self.created_sighting_id:
                            found_sighting = sighting
                            break
                    
                    if found_sighting:
                        self.log_result("Verify Sighting in List", True, f"Created sighting found in list: {found_sighting.get('railroad', 'unknown')}")
                        return True
                    else:
                        self.log_result("Verify Sighting in List", False, f"Created sighting not found in list (searched {len(sightings)} sightings)")
                        return False
                else:
                    self.log_result("Verify Sighting in List", False, "ok field not true", data)
                    return False
            else:
                self.log_result("Verify Sighting in List", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Verify Sighting in List", False, f"Exception: {str(e)}")
            return False
    
    def test_update_sighting(self):
        """Test PUT /api/sightings/{id}"""
        if not self.token or not self.created_sighting_id:
            self.log_result("Update Sighting", False, "No auth token or sighting ID available")
            return False
            
        try:
            update_data = {
                "notes": "Updated test sighting notes"
            }
            
            headers = {'Authorization': f'Bearer {self.token}'}
            response = self.session.put(f"{API_URL}/sightings/{self.created_sighting_id}", json=update_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') is True and 'sighting' in data:
                    updated_sighting = data['sighting']
                    if updated_sighting.get('notes') == "Updated test sighting notes":
                        self.log_result("Update Sighting", True, "Sighting updated successfully")
                        return True
                    else:
                        self.log_result("Update Sighting", False, "Notes not updated correctly", data)
                        return False
                else:
                    self.log_result("Update Sighting", False, "Invalid response structure", data)
                    return False
            else:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Update Sighting", False, f"HTTP {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Update Sighting", False, f"Exception: {str(e)}")
            return False
    
    def test_delete_sighting(self):
        """Test DELETE /api/sightings/{id}"""
        if not self.token or not self.created_sighting_id:
            self.log_result("Delete Sighting", False, "No auth token or sighting ID available")
            return False
            
        try:
            headers = {'Authorization': f'Bearer {self.token}'}
            response = self.session.delete(f"{API_URL}/sightings/{self.created_sighting_id}", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') is True and data.get('deleted') == self.created_sighting_id:
                    self.log_result("Delete Sighting", True, f"Sighting deleted successfully: {self.created_sighting_id}")
                    return True
                else:
                    self.log_result("Delete Sighting", False, "Invalid response structure", data)
                    return False
            else:
                data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Delete Sighting", False, f"HTTP {response.status_code}", data)
                return False
        except Exception as e:
            self.log_result("Delete Sighting", False, f"Exception: {str(e)}")
            return False
    
    def test_verify_sighting_deleted(self):
        """Test that deleted sighting no longer appears in list"""
        if not self.created_sighting_id:
            self.log_result("Verify Sighting Deleted", False, "No created sighting ID available")
            return False
            
        try:
            response = self.session.get(f"{API_URL}/sightings?page=1&limit=50")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('ok') is True:
                    sightings = data['sightings']
                    found_sighting = any(s.get('_id') == self.created_sighting_id for s in sightings)
                    
                    if not found_sighting:
                        self.log_result("Verify Sighting Deleted", True, f"Deleted sighting no longer in list (searched {len(sightings)} sightings)")
                        return True
                    else:
                        self.log_result("Verify Sighting Deleted", False, "Deleted sighting still found in list")
                        return False
                else:
                    self.log_result("Verify Sighting Deleted", False, "ok field not true", data)
                    return False
            else:
                self.log_result("Verify Sighting Deleted", False, f"HTTP {response.status_code}", response.text)
                return False
        except Exception as e:
            self.log_result("Verify Sighting Deleted", False, f"Exception: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all sightings API tests in sequence"""
        print(f"🚀 Starting RailStream Sightings API Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"🔑 Test Credentials: {TEST_USERNAME}")
        print("=" * 70)
        
        # Test sequence as per review request
        print("\n1️⃣ Authentication Setup")
        login_success = self.test_auth_login()
        
        print("\n2️⃣ Public Endpoints (no auth required)")
        self.test_sightings_list_public()
        self.test_sightings_list_with_filters()
        self.test_sightings_stats()
        
        print("\n3️⃣ Authentication Required Tests")
        self.test_create_sighting_auth_required()
        
        if login_success:
            print("\n4️⃣ Authenticated Operations")
            sighting_created = self.test_create_sighting_authenticated()
            
            if sighting_created:
                print("\n5️⃣ Image Upload and Serving")
                image_uploaded = self.test_upload_sighting_image()
                if image_uploaded:
                    self.test_serve_sighting_image()
                
                print("\n6️⃣ Verification and Updates")
                self.test_verify_sighting_in_list()
                self.test_update_sighting()
                
                print("\n7️⃣ Cleanup")
                self.test_delete_sighting()
                self.test_verify_sighting_deleted()
        else:
            self.log_result("All Authenticated Tests", False, "Skipped - login failed")
        
        # Summary
        print("\n" + "=" * 70)
        print("📊 TEST SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['success'])
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\n📈 Results: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 All tests PASSED!")
            return True
        else:
            print("⚠️  Some tests FAILED!")
            return False

def main():
    """Main function to run sightings API tests"""
    tester = SightingsAPITester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()