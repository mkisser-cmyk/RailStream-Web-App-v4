#!/usr/bin/env python3
"""
Roundhouse API Backend Testing Script
Tests the new Collections feature and enhanced photo creation with additional fields.
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Test configuration
BASE_URL = "https://dvr-seek-fix.preview.emergentagent.com/api"
TEST_CREDENTIALS = {
    "username": "chicagotest",
    "password": "sZyE8cDFk"
}

# Global test state
access_token = None
created_collection_id = None
created_photo_id = None

def login():
    """Authenticate and get access token"""
    global access_token
    try:
        print("🔐 Testing authentication...")
        response = requests.post(
            f"{BASE_URL}/auth/login",
            json=TEST_CREDENTIALS,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            access_token = data.get("access_token")
            user_info = data.get("user", {})
            print(f"✅ Login successful - User: {user_info.get('username', 'N/A')}, Tier: {user_info.get('membership_tier', 'N/A')}")
            return True
        else:
            print(f"❌ Login failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Login error: {e}")
        return False

def get_auth_headers():
    """Get authentication headers"""
    return {"Authorization": f"Bearer {access_token}"} if access_token else {}

def test_create_collection():
    """Test POST /api/roundhouse with action: 'create_collection'"""
    global created_collection_id
    try:
        print("\n📁 Testing collection creation...")
        
        payload = {
            "action": "create_collection",
            "name": "Test Collection",
            "description": "Test collection for API testing"
        }
        
        response = requests.post(
            f"{BASE_URL}/roundhouse",
            json=payload,
            headers=get_auth_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                collection = data.get("collection", {})
                created_collection_id = collection.get("id")
                print(f"✅ Collection created successfully")
                print(f"   - ID: {created_collection_id}")
                print(f"   - Name: {collection.get('name')}")
                print(f"   - Description: {collection.get('description')}")
                print(f"   - Username: {collection.get('username')}")
                print(f"   - Photo Count: {collection.get('photo_count')}")
                print(f"   - Created At: {collection.get('created_at')}")
                return True
            else:
                print(f"❌ Collection creation failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Collection creation failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Collection creation error: {e}")
        return False

def test_list_collections():
    """Test GET /api/roundhouse?action=collections"""
    try:
        print("\n📋 Testing collections list...")
        
        response = requests.get(
            f"{BASE_URL}/roundhouse?action=collections",
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                collections = data.get("collections", [])
                print(f"✅ Collections list retrieved successfully")
                print(f"   - Total collections: {len(collections)}")
                
                # Check if our created collection is in the list
                if created_collection_id:
                    found = any(c.get("id") == created_collection_id for c in collections)
                    if found:
                        print(f"   - ✅ Created collection found in list")
                    else:
                        print(f"   - ❌ Created collection NOT found in list")
                
                # Show first few collections
                for i, collection in enumerate(collections[:3]):
                    print(f"   - Collection {i+1}: {collection.get('name')} (ID: {collection.get('id')})")
                
                return True
            else:
                print(f"❌ Collections list failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Collections list failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Collections list error: {e}")
        return False

def test_create_photo():
    """Test POST /api/roundhouse with action: 'create' with enhanced fields"""
    global created_photo_id
    try:
        print("\n📸 Testing photo creation with enhanced fields...")
        
        payload = {
            "action": "create",
            "railroad": "NS",
            "locomotive_numbers": "NS 1073",
            "location": "Fostoria, OH",
            "title": "Heritage on Q335",
            "loco_model": "SD70ACe",
            "builder": "EMD",
            "photo_date": "2026-03-12",
            "collection_id": created_collection_id,
            "collection_name": "Test Collection",
            "source": "trackside",
            "tags": ["heritage"],
            "description": "NS Southern Railway heritage unit leading Q335"
        }
        
        response = requests.post(
            f"{BASE_URL}/roundhouse",
            json=payload,
            headers=get_auth_headers(),
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                photo = data.get("photo", {})
                created_photo_id = photo.get("id")
                print(f"✅ Photo created successfully")
                print(f"   - ID: {created_photo_id}")
                print(f"   - Railroad: {photo.get('railroad')}")
                print(f"   - Locomotive Numbers: {photo.get('locomotive_numbers')}")
                print(f"   - Location: {photo.get('location')}")
                print(f"   - Title: {photo.get('title')}")
                print(f"   - Loco Model: {photo.get('loco_model')}")
                print(f"   - Builder: {photo.get('builder')}")
                print(f"   - Photo Date: {photo.get('photo_date')}")
                print(f"   - Collection ID: {photo.get('collection_id')}")
                print(f"   - Collection Name: {photo.get('collection_name')}")
                print(f"   - Source: {photo.get('source')}")
                print(f"   - Tags: {photo.get('tags')}")
                print(f"   - Is Heritage: {photo.get('is_heritage')}")
                print(f"   - Heritage Info: {photo.get('heritage_info')}")
                print(f"   - Username: {photo.get('username')}")
                
                # Verify auto-heritage detection
                if photo.get("is_heritage") and "NS 1073" in photo.get("heritage_info", ""):
                    print(f"   - ✅ Heritage auto-detection working correctly")
                else:
                    print(f"   - ❌ Heritage auto-detection may not be working")
                
                return True
            else:
                print(f"❌ Photo creation failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Photo creation failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Photo creation error: {e}")
        return False

def test_get_collection_detail():
    """Test GET /api/roundhouse?action=collection&id=<collection_id>"""
    try:
        print("\n🔍 Testing collection detail retrieval...")
        
        if not created_collection_id:
            print("❌ No collection ID available for testing")
            return False
        
        response = requests.get(
            f"{BASE_URL}/roundhouse?action=collection&id={created_collection_id}",
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                collection = data.get("collection", {})
                photos = data.get("photos", [])
                print(f"✅ Collection detail retrieved successfully")
                print(f"   - Collection ID: {collection.get('id')}")
                print(f"   - Name: {collection.get('name')}")
                print(f"   - Description: {collection.get('description')}")
                print(f"   - Photo Count: {collection.get('photo_count')}")
                print(f"   - Photos in response: {len(photos)}")
                
                # Check if our created photo is in the collection
                if created_photo_id and photos:
                    found = any(p.get("id") == created_photo_id for p in photos)
                    if found:
                        print(f"   - ✅ Created photo found in collection")
                    else:
                        print(f"   - ❌ Created photo NOT found in collection")
                
                return True
            else:
                print(f"❌ Collection detail failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Collection detail failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Collection detail error: {e}")
        return False

def test_filter_photos_by_collection():
    """Test GET /api/roundhouse?collection_id=<collection_id>"""
    try:
        print("\n🔎 Testing photo filtering by collection...")
        
        if not created_collection_id:
            print("❌ No collection ID available for testing")
            return False
        
        response = requests.get(
            f"{BASE_URL}/roundhouse?collection_id={created_collection_id}",
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                photos = data.get("photos", [])
                total = data.get("total", 0)
                page = data.get("page", 1)
                pages = data.get("pages", 1)
                
                print(f"✅ Photo filtering by collection successful")
                print(f"   - Total photos: {total}")
                print(f"   - Current page: {page}")
                print(f"   - Total pages: {pages}")
                print(f"   - Photos in response: {len(photos)}")
                
                # Check if our created photo is in the results
                if created_photo_id and photos:
                    found_photo = None
                    for photo in photos:
                        if photo.get("id") == created_photo_id:
                            found_photo = photo
                            break
                    
                    if found_photo:
                        print(f"   - ✅ Created photo found in filtered results")
                        print(f"   - Photo collection_id: {found_photo.get('collection_id')}")
                        print(f"   - Photo collection_name: {found_photo.get('collection_name')}")
                    else:
                        print(f"   - ❌ Created photo NOT found in filtered results")
                
                return True
            else:
                print(f"❌ Photo filtering failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Photo filtering failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Photo filtering error: {e}")
        return False

def test_stats_with_collection_count():
    """Test GET /api/roundhouse?action=stats to verify collection_count"""
    try:
        print("\n📊 Testing stats with collection count...")
        
        response = requests.get(
            f"{BASE_URL}/roundhouse?action=stats",
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            if data.get("ok"):
                print(f"✅ Stats retrieved successfully")
                print(f"   - Total photos: {data.get('total', 'N/A')}")
                print(f"   - Heritage count: {data.get('heritage_count', 'N/A')}")
                print(f"   - Today's photos: {data.get('today', 'N/A')}")
                print(f"   - Collection count: {data.get('collection_count', 'N/A')}")
                
                # Verify collection_count is included
                if 'collection_count' in data:
                    print(f"   - ✅ Collection count is included in stats")
                else:
                    print(f"   - ❌ Collection count is MISSING from stats")
                
                # Show top contributors and railroads
                top_contributors = data.get('top_contributors', [])
                top_railroads = data.get('top_railroads', [])
                print(f"   - Top contributors: {len(top_contributors)}")
                print(f"   - Top railroads: {len(top_railroads)}")
                
                return True
            else:
                print(f"❌ Stats retrieval failed: {data.get('error', 'Unknown error')}")
                return False
        else:
            print(f"❌ Stats retrieval failed: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Stats retrieval error: {e}")
        return False

def cleanup_test_data():
    """Clean up created test data"""
    print("\n🧹 Cleaning up test data...")
    
    # Delete created photo
    if created_photo_id:
        try:
            response = requests.post(
                f"{BASE_URL}/roundhouse",
                json={"action": "delete", "photo_id": created_photo_id},
                headers=get_auth_headers(),
                timeout=30
            )
            if response.status_code == 200 and response.json().get("ok"):
                print(f"✅ Test photo deleted successfully")
            else:
                print(f"❌ Failed to delete test photo: {response.text}")
        except Exception as e:
            print(f"❌ Error deleting test photo: {e}")
    
    # Note: We don't delete collections as there's no delete collection endpoint
    # This is expected behavior for data preservation
    if created_collection_id:
        print(f"ℹ️  Test collection '{created_collection_id}' left in database (no delete endpoint)")

def main():
    """Main test execution"""
    print("🚂 Roundhouse API Testing Suite")
    print("=" * 50)
    
    # Track test results
    test_results = []
    
    # 1. Authentication
    if not login():
        print("❌ Authentication failed. Cannot proceed with tests.")
        return False
    
    # 2. Create Collection
    result = test_create_collection()
    test_results.append(("Create Collection", result))
    
    # 3. List Collections
    result = test_list_collections()
    test_results.append(("List Collections", result))
    
    # 4. Create Photo with Enhanced Fields
    result = test_create_photo()
    test_results.append(("Create Photo (Enhanced)", result))
    
    # 5. Get Collection Detail
    result = test_get_collection_detail()
    test_results.append(("Get Collection Detail", result))
    
    # 6. Filter Photos by Collection
    result = test_filter_photos_by_collection()
    test_results.append(("Filter Photos by Collection", result))
    
    # 7. Get Stats with Collection Count
    result = test_stats_with_collection_count()
    test_results.append(("Stats with Collection Count", result))
    
    # 8. Cleanup
    cleanup_test_data()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 TEST SUMMARY")
    print("=" * 50)
    
    passed = 0
    total = len(test_results)
    
    for test_name, result in test_results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
        if result:
            passed += 1
    
    print(f"\nResults: {passed}/{total} tests passed ({(passed/total*100):.1f}%)")
    
    if passed == total:
        print("🎉 All tests passed! The Roundhouse API is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the output above for details.")
        return False

if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)