#!/usr/bin/env python3
"""
Backend test script for RailStream Studio API endpoints
Tests the 3 Studio integration endpoints that connect to studio.railstream.net
"""
import requests
import json
import os
import sys
from typing import Dict, Any

# Load environment variables
NEXT_PUBLIC_BASE_URL = "https://sightings-redesign.preview.emergentagent.com"  # From .env
BASE_URL = f"{NEXT_PUBLIC_BASE_URL}/api"

class StudioAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.session.timeout = 30
        
    def test_studio_sites(self) -> Dict[str, Any]:
        """Test GET /api/studio/sites endpoint"""
        print("🧪 Testing GET /api/studio/sites...")
        
        try:
            response = self.session.get(f"{self.base_url}/studio/sites")
            result = {
                "endpoint": "GET /api/studio/sites",
                "status_code": response.status_code,
                "success": False,
                "details": {}
            }
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                has_ok = "ok" in data and data["ok"] is True
                has_sites = "sites" in data and isinstance(data["sites"], list)
                has_cached_at = "cached_at" in data
                
                sites_count = len(data.get("sites", []))
                
                result["details"] = {
                    "has_ok_field": has_ok,
                    "has_sites_array": has_sites,
                    "has_cached_at": has_cached_at,
                    "sites_count": sites_count,
                    "expected_sites": 19,
                    "sites_count_correct": sites_count == 19
                }
                
                # Verify site structure if sites exist
                if has_sites and sites_count > 0:
                    sample_site = data["sites"][0]
                    required_fields = ["id", "name", "location", "health"]
                    health_fields = ["status", "stream_status", "uptime_seconds", "video_bitrate", "fps", "cpu_usage"]
                    
                    site_has_required = all(field in sample_site for field in required_fields)
                    health_has_required = all(field in sample_site.get("health", {}) for field in health_fields)
                    
                    result["details"].update({
                        "site_has_required_fields": site_has_required,
                        "health_has_required_fields": health_has_required,
                        "sample_site_id": sample_site.get("id"),
                        "sample_site_name": sample_site.get("name"),
                        "sample_health_status": sample_site.get("health", {}).get("status")
                    })
                    
                    result["success"] = (has_ok and has_sites and has_cached_at and 
                                       sites_count == 19 and site_has_required and health_has_required)
                else:
                    result["success"] = False
                    result["details"]["error"] = "No sites returned or invalid structure"
                    
            else:
                result["details"] = {
                    "error": f"HTTP {response.status_code}",
                    "response_text": response.text[:500]
                }
            
            print(f"   ✅ Status: {response.status_code}" if result["success"] else f"   ❌ Status: {response.status_code}")
            return result
            
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return {
                "endpoint": "GET /api/studio/sites",
                "success": False,
                "error": str(e)
            }
    
    def test_studio_thumbnail(self, site_id: str = None) -> Dict[str, Any]:
        """Test GET /api/studio/thumbnail?id=SITE_ID endpoint"""
        print(f"🧪 Testing GET /api/studio/thumbnail?id={site_id}...")
        
        try:
            if not site_id:
                # First get a valid site ID from sites endpoint
                sites_response = self.session.get(f"{self.base_url}/studio/sites")
                if sites_response.status_code == 200:
                    sites_data = sites_response.json()
                    if sites_data.get("sites") and len(sites_data["sites"]) > 0:
                        site_id = sites_data["sites"][0]["id"]
                        print(f"   📋 Using site ID from sites list: {site_id}")
                    else:
                        return {
                            "endpoint": "GET /api/studio/thumbnail",
                            "success": False,
                            "error": "Could not get valid site ID from /api/studio/sites"
                        }
                else:
                    return {
                        "endpoint": "GET /api/studio/thumbnail", 
                        "success": False,
                        "error": f"Sites endpoint failed with status {sites_response.status_code}"
                    }
            
            response = self.session.get(f"{self.base_url}/studio/thumbnail?id={site_id}")
            result = {
                "endpoint": f"GET /api/studio/thumbnail?id={site_id}",
                "status_code": response.status_code,
                "success": False,
                "details": {}
            }
            
            if response.status_code == 200:
                content_type = response.headers.get("Content-Type", "")
                content_length = len(response.content)
                
                is_image = content_type.startswith("image/")
                has_content = content_length > 0
                
                result["details"] = {
                    "content_type": content_type,
                    "content_length": content_length,
                    "is_image": is_image,
                    "has_content": has_content,
                    "is_jpeg_or_fallback": content_type in ["image/jpeg", "image/gif"]
                }
                
                result["success"] = is_image and has_content
                
            else:
                result["details"] = {
                    "error": f"HTTP {response.status_code}",
                    "response_text": response.text[:200]
                }
            
            print(f"   ✅ Status: {response.status_code}, Content-Type: {response.headers.get('Content-Type')}, Size: {len(response.content)} bytes" if result["success"] else f"   ❌ Status: {response.status_code}")
            return result
            
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return {
                "endpoint": "GET /api/studio/thumbnail",
                "success": False,
                "error": str(e)
            }
    
    def test_studio_thumbnail_invalid_id(self) -> Dict[str, Any]:
        """Test GET /api/studio/thumbnail with invalid ID"""
        print("🧪 Testing GET /api/studio/thumbnail with invalid ID...")
        
        try:
            response = self.session.get(f"{self.base_url}/studio/thumbnail?id=invalid-site-id-12345")
            result = {
                "endpoint": "GET /api/studio/thumbnail?id=invalid-site-id-12345",
                "status_code": response.status_code,
                "success": False,
                "details": {}
            }
            
            if response.status_code == 200:
                content_type = response.headers.get("Content-Type", "")
                content_length = len(response.content)
                
                # Should return fallback image (1x1 pixel)
                is_fallback = content_type == "image/gif" and content_length > 0
                
                result["details"] = {
                    "content_type": content_type,
                    "content_length": content_length,
                    "is_fallback_image": is_fallback
                }
                
                result["success"] = is_fallback
                
            else:
                result["details"] = {
                    "error": f"HTTP {response.status_code}",
                    "response_text": response.text[:200]
                }
            
            print(f"   ✅ Status: {response.status_code}, Returns fallback image" if result["success"] else f"   ❌ Status: {response.status_code}")
            return result
            
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return {
                "endpoint": "GET /api/studio/thumbnail (invalid ID)",
                "success": False,
                "error": str(e)
            }
    
    def test_studio_thumbnail_no_id(self) -> Dict[str, Any]:
        """Test GET /api/studio/thumbnail without id parameter"""
        print("🧪 Testing GET /api/studio/thumbnail without id parameter...")
        
        try:
            response = self.session.get(f"{self.base_url}/studio/thumbnail")
            result = {
                "endpoint": "GET /api/studio/thumbnail (no id)",
                "status_code": response.status_code,
                "success": False,
                "details": {}
            }
            
            # Should return 400 error
            if response.status_code == 400:
                try:
                    error_data = response.json()
                    has_error = "error" in error_data
                    result["details"] = {
                        "response_json": error_data,
                        "has_error_field": has_error,
                        "error_message": error_data.get("error", "")
                    }
                    result["success"] = has_error
                except:
                    result["details"] = {"response_text": response.text[:200]}
                    result["success"] = True  # 400 status is expected
            else:
                result["details"] = {
                    "error": f"Expected 400, got HTTP {response.status_code}",
                    "response_text": response.text[:200]
                }
            
            print(f"   ✅ Status: {response.status_code} (expected 400)" if result["success"] else f"   ❌ Status: {response.status_code} (expected 400)")
            return result
            
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return {
                "endpoint": "GET /api/studio/thumbnail (no id)",
                "success": False,
                "error": str(e)
            }
    
    def test_studio_thumbnails_map(self) -> Dict[str, Any]:
        """Test GET /api/studio/thumbnails-map endpoint"""
        print("🧪 Testing GET /api/studio/thumbnails-map...")
        
        try:
            response = self.session.get(f"{self.base_url}/studio/thumbnails-map")
            result = {
                "endpoint": "GET /api/studio/thumbnails-map",
                "status_code": response.status_code,
                "success": False,
                "details": {}
            }
            
            if response.status_code == 200:
                data = response.json()
                
                # Verify response structure
                has_ok = "ok" in data and data["ok"] is True
                has_mapping = "mapping" in data and isinstance(data["mapping"], dict)
                has_available_thumbnails = "available_thumbnails" in data and isinstance(data["available_thumbnails"], list)
                
                mapping_count = len(data.get("mapping", {}))
                
                result["details"] = {
                    "has_ok_field": has_ok,
                    "has_mapping": has_mapping,
                    "has_available_thumbnails": has_available_thumbnails,
                    "mapping_count": mapping_count,
                    "expected_mapping_entries": 19,
                    "available_thumbnails_count": len(data.get("available_thumbnails", []))
                }
                
                # Verify mapping structure
                if has_mapping and mapping_count > 0:
                    sample_key = list(data["mapping"].keys())[0]
                    sample_value = data["mapping"][sample_key]
                    
                    result["details"].update({
                        "sample_catalog_id": sample_key,
                        "sample_studio_site_id": sample_value,
                        "mapping_has_valid_entries": isinstance(sample_key, str) and isinstance(sample_value, str)
                    })
                    
                result["success"] = has_ok and has_mapping and has_available_thumbnails and mapping_count > 0
                    
            else:
                result["details"] = {
                    "error": f"HTTP {response.status_code}",
                    "response_text": response.text[:500]
                }
            
            print(f"   ✅ Status: {response.status_code}, Mapping entries: {result['details'].get('mapping_count', 0)}" if result["success"] else f"   ❌ Status: {response.status_code}")
            return result
            
        except Exception as e:
            print(f"   ❌ Exception: {str(e)}")
            return {
                "endpoint": "GET /api/studio/thumbnails-map",
                "success": False,
                "error": str(e)
            }

def main():
    print("🚀 Starting RailStream Studio API Backend Tests")
    print(f"🌐 Base URL: {BASE_URL}")
    print("=" * 70)
    
    tester = StudioAPITester()
    all_results = []
    
    # Test 1: Studio Sites API
    sites_result = tester.test_studio_sites()
    all_results.append(sites_result)
    
    print()
    
    # Test 2: Studio Thumbnail API (with valid ID)
    thumbnail_result = tester.test_studio_thumbnail()
    all_results.append(thumbnail_result)
    
    print()
    
    # Test 3: Studio Thumbnail API (with invalid ID)
    thumbnail_invalid_result = tester.test_studio_thumbnail_invalid_id()
    all_results.append(thumbnail_invalid_result)
    
    print()
    
    # Test 4: Studio Thumbnail API (no ID parameter)
    thumbnail_no_id_result = tester.test_studio_thumbnail_no_id()
    all_results.append(thumbnail_no_id_result)
    
    print()
    
    # Test 5: Studio Thumbnails Map API
    map_result = tester.test_studio_thumbnails_map()
    all_results.append(map_result)
    
    print()
    print("=" * 70)
    print("📋 TEST RESULTS SUMMARY")
    print("=" * 70)
    
    total_tests = len(all_results)
    passed_tests = sum(1 for result in all_results if result.get("success"))
    
    for i, result in enumerate(all_results, 1):
        status = "✅ PASS" if result.get("success") else "❌ FAIL"
        endpoint = result.get("endpoint", "Unknown")
        print(f"{i}. {status} - {endpoint}")
        if not result.get("success") and "error" in result:
            print(f"   Error: {result['error']}")
    
    print(f"\n📊 Overall Result: {passed_tests}/{total_tests} tests passed")
    success_rate = (passed_tests / total_tests) * 100
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    if passed_tests == total_tests:
        print("🎉 All Studio API endpoints are working correctly!")
        return 0
    else:
        print("⚠️  Some Studio API endpoints have issues.")
        return 1

if __name__ == "__main__":
    sys.exit(main())