#!/usr/bin/env python3
"""
RailStream API Backend Testing Script - Review Request
Tests specific endpoints and credentials from the review request
"""

import requests
import json
import sys
from typing import Dict, Any, Optional

# Base URL from environment
BASE_URL = "https://dvr-seek-fix.preview.emergentagent.com"
API_URL = f"{BASE_URL}/api"

# Review request specific test credentials
REVIEW_USERNAME = "chicagotest"
REVIEW_PASSWORD = "sZyE8cDFk"
ATLANTA_CAMERA_ID = "699894a055761e18195294e3"
FOS_WEST_CAMERA_ID = "FOS-WEST"

class RailStreamReviewTester:
    def __init__(self):
        self.session = requests.Session()
        self.token = None
        self.test_results = {}
        
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
            print(f"   Response: {json.dumps(response_data, indent=2)}")
    
    def test_camera_catalog_review(self):
        """Test GET /api/cameras/catalog - Should return array of 46 cameras"""
        try:
            print("\n🔍 Testing GET /api/cameras/catalog")
            response = self.session.get(f"{API_URL}/cameras/catalog")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"   📊 Retrieved {len(data)} cameras")
                    
                    # Check if we have expected count
                    if len(data) == 46:
                        count_msg = "Correct count of 46 cameras"
                    else:
                        count_msg = f"Got {len(data)} cameras (expected 46)"
                    
                    # Check first camera structure
                    if data:
                        camera = data[0]
                        required_fields = ['_id', 'name', 'location', 'min_tier', 'status', 'thumbnail_path', 'short_code']
                        if all(field in camera for field in required_fields):
                            self.log_result("Camera Catalog Review", True, f"{count_msg}, all required fields present")
                            print(f"   📋 Sample camera: {camera['name']} at {camera['location']}")
                            return True, data
                        else:
                            missing = [f for f in required_fields if f not in camera]
                            self.log_result("Camera Catalog Review", False, f"Missing fields: {missing}", camera)
                            return False, data
                    else:
                        self.log_result("Camera Catalog Review", False, "Empty camera list", data)
                        return False, data
                else:
                    self.log_result("Camera Catalog Review", False, "Response is not an array", data)
                    return False, None
            else:
                self.log_result("Camera Catalog Review", False, f"HTTP {response.status_code}", response.text)
                return False, None
        except Exception as e:
            self.log_result("Camera Catalog Review", False, f"Exception: {str(e)}")
            return False, None
    
    def test_auth_login_review(self):
        """Test POST /api/auth/login with chicagotest credentials"""
        try:
            print(f"\n🔍 Testing POST /api/auth/login with {REVIEW_USERNAME}")
            login_data = {
                "username": REVIEW_USERNAME,
                "password": REVIEW_PASSWORD
            }
            response = self.session.post(f"{API_URL}/auth/login", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                # Check required fields
                if all(key in data for key in ['access_token', 'user']):
                    self.token = data['access_token']
                    user = data['user']
                    print(f"   👤 User: {user.get('username', 'N/A')}")
                    print(f"   🎫 Token length: {len(self.token)} characters")
                    self.log_result("Auth Login Review", True, f"Login successful for {REVIEW_USERNAME}")
                    return True
                else:
                    self.log_result("Auth Login Review", False, "Missing required fields in response", data)
                    return False
            else:
                response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Auth Login Review", False, f"HTTP {response.status_code}", response_data)
                return False
        except Exception as e:
            self.log_result("Auth Login Review", False, f"Exception: {str(e)}")
            return False
    
    def test_playback_authorize_atlanta_no_auth(self):
        """Test POST /api/playback/authorize with Atlanta camera (no auth)"""
        try:
            print(f"\n🔍 Testing POST /api/playback/authorize with Atlanta camera (no auth)")
            playback_data = {
                "camera_id": ATLANTA_CAMERA_ID
            }
            response = self.session.post(f"{API_URL}/playback/authorize", json=playback_data)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   📊 Response keys: {list(data.keys())}")
                
                if data.get('ok') is True:
                    hls_url = data.get('hls_url', '')
                    camera_name = data.get('camera_name', 'N/A')
                    session_id = data.get('session_id', 'N/A')
                    
                    print(f"   📹 Camera: {camera_name}")
                    print(f"   🎬 HLS URL contains media01.railstream.net: {'media01.railstream.net' in hls_url}")
                    print(f"   🆔 Session ID: {session_id}")
                    
                    if 'media01.railstream.net' in hls_url and hls_url.endswith('.m3u8'):
                        self.log_result("Playback Authorize Atlanta (No Auth)", True, f"Authorized {camera_name}, HLS URL contains media01.railstream.net")
                        return True
                    else:
                        self.log_result("Playback Authorize Atlanta (No Auth)", False, f"HLS URL format unexpected: {hls_url}", data)
                        return False
                else:
                    self.log_result("Playback Authorize Atlanta (No Auth)", False, f"ok field is not true: {data.get('ok')}", data)
                    return False
            else:
                response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Playback Authorize Atlanta (No Auth)", False, f"HTTP {response.status_code}", response_data)
                return False
        except Exception as e:
            self.log_result("Playback Authorize Atlanta (No Auth)", False, f"Exception: {str(e)}")
            return False
    
    def test_playback_authorize_atlanta_with_auth(self):
        """Test POST /api/playback/authorize with Atlanta camera (with Bearer token)"""
        if not self.token:
            self.log_result("Playback Authorize Atlanta (With Auth)", False, "No authentication token available")
            return False
            
        try:
            print(f"\n🔍 Testing POST /api/playback/authorize with Atlanta camera (with auth)")
            headers = {'Authorization': f'Bearer {self.token}'}
            playback_data = {
                "camera_id": ATLANTA_CAMERA_ID
            }
            response = self.session.post(f"{API_URL}/playback/authorize", json=playback_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   📊 Response keys: {list(data.keys())}")
                
                if data.get('ok') is True:
                    hls_url = data.get('hls_url', '')
                    camera_name = data.get('camera_name', 'N/A')
                    
                    print(f"   📹 Camera: {camera_name}")
                    print(f"   🎬 HLS URL: {hls_url[:100]}..." if len(hls_url) > 100 else f"   🎬 HLS URL: {hls_url}")
                    
                    self.log_result("Playback Authorize Atlanta (With Auth)", True, f"Authorized {camera_name} with authentication")
                    return True
                else:
                    self.log_result("Playback Authorize Atlanta (With Auth)", False, f"ok field is not true: {data.get('ok')}", data)
                    return False
            else:
                response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Playback Authorize Atlanta (With Auth)", False, f"HTTP {response.status_code}", response_data)
                return False
        except Exception as e:
            self.log_result("Playback Authorize Atlanta (With Auth)", False, f"Exception: {str(e)}")
            return False
    
    def test_web_authorize_fos_west(self):
        """Test POST /api/playback/web-authorize with FOS-WEST camera"""
        try:
            print(f"\n🔍 Testing POST /api/playback/web-authorize with FOS-WEST camera")
            web_auth_data = {
                "camera_id": FOS_WEST_CAMERA_ID
            }
            response = self.session.post(f"{API_URL}/playback/web-authorize", json=web_auth_data)
            
            if response.status_code == 200:
                data = response.json()
                print(f"   📊 Response keys: {list(data.keys())}")
                
                if data.get('ok') is True:
                    edge_base = data.get('edge_base', 'N/A')
                    wms_auth = data.get('wms_auth', 'N/A')
                    
                    print(f"   🌐 Edge Base: {edge_base}")
                    print(f"   🔐 WMS Auth: {wms_auth}")
                    
                    self.log_result("Web Authorize FOS-WEST", True, f"Web authorization successful for {FOS_WEST_CAMERA_ID}")
                    return True
                else:
                    self.log_result("Web Authorize FOS-WEST", False, f"ok field is not true: {data.get('ok')}", data)
                    return False
            else:
                response_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else response.text
                self.log_result("Web Authorize FOS-WEST", False, f"HTTP {response.status_code}", response_data)
                return False
        except Exception as e:
            self.log_result("Web Authorize FOS-WEST", False, f"Exception: {str(e)}")
            return False
    
    def run_review_tests(self):
        """Run all review-specific tests"""
        print(f"🚀 Starting RailStream API Review Tests")
        print(f"📍 Base URL: {BASE_URL}")
        print(f"👤 Test Credentials: {REVIEW_USERNAME}")
        print(f"📹 Atlanta Camera ID: {ATLANTA_CAMERA_ID}")
        print(f"📹 FOS-WEST Camera ID: {FOS_WEST_CAMERA_ID}")
        print("=" * 80)
        
        # Test 1: Camera catalog
        catalog_success, catalog_data = self.test_camera_catalog_review()
        
        # Test 2: Auth login with review credentials
        login_success = self.test_auth_login_review()
        
        # Test 3: Playback authorize Atlanta (no auth)
        self.test_playback_authorize_atlanta_no_auth()
        
        # Test 4: Playback authorize Atlanta (with auth) - only if login succeeded
        if login_success:
            self.test_playback_authorize_atlanta_with_auth()
        else:
            self.log_result("Playback Authorize Atlanta (With Auth)", False, "Skipped - login failed")
        
        # Test 5: Web authorize FOS-WEST
        self.test_web_authorize_fos_west()
        
        # Summary
        print("\n" + "=" * 80)
        print("📊 REVIEW TEST SUMMARY")
        print("=" * 80)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result['success'])
        
        for test_name, result in self.test_results.items():
            status = "✅ PASS" if result['success'] else "❌ FAIL"
            print(f"{status}: {test_name}")
        
        print(f"\n📈 Results: {passed_tests}/{total_tests} tests passed ({passed_tests/total_tests*100:.1f}%)")
        
        if passed_tests == total_tests:
            print("🎉 All review tests PASSED!")
            return True
        else:
            print("⚠️  Some review tests FAILED!")
            return False

def main():
    """Main function to run review tests"""
    tester = RailStreamReviewTester()
    success = tester.run_review_tests()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()