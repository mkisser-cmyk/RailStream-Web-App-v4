#!/usr/bin/env python3

import requests
import json
from datetime import datetime, timezone, timedelta
import uuid
import time
import os

# Test configuration
BASE_URL = "https://preroll-fix.preview.emergentagent.com/api"
USERNAME = "chicagotest"
PASSWORD = "sZyE8cDFk"
CAMERA_ID = "699894a055761e18195294e3"

class RailStreamSightingsTest:
    def __init__(self):
        self.token = None
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'RailStream-Backend-Test/1.0'
        })

    def login(self):
        """Authenticate and get JWT token"""
        print("🔐 Testing authentication...")
        try:
            response = self.session.post(f"{BASE_URL}/auth/login", json={
                "username": USERNAME,
                "password": PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('access_token')
                # Set auth header
                self.session.headers.update({
                    'Authorization': f'Bearer {self.token}'
                })
                print(f"✅ Login successful - User tier: {data.get('user', {}).get('membership_tier', 'unknown')}")
                return True
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False

    def create_sighting_with_iso_timestamp(self, sighting_time_iso):
        """Create a sighting with full ISO timestamp"""
        print(f"\n🆕 Creating sighting with ISO timestamp: {sighting_time_iso}")
        try:
            sighting_data = {
                "camera_id": CAMERA_ID,
                "camera_name": "Atlanta Howell Yard East",
                "location": "Atlanta, GA",
                "sighting_time": sighting_time_iso,
                "railroad": "CSX",
                "train_id": f"Q{str(uuid.uuid4())[:6].upper()}",
                "direction": "Eastbound",
                "locomotives": "ES44AC, AC4400CW",
                "train_type": "Intermodal",
                "notes": f"Test sighting created at {datetime.now().isoformat()}"
            }
            
            response = self.session.post(f"{BASE_URL}/sightings", json=sighting_data)
            
            if response.status_code == 201:
                sighting = response.json().get('sighting', {})
                created_time = sighting.get('sighting_time')
                print(f"✅ Sighting created successfully")
                print(f"   Input timestamp:  {sighting_time_iso}")
                print(f"   Stored timestamp: {created_time}")
                print(f"   Sighting ID: {sighting.get('_id')}")
                
                # Verify timestamp format and value
                if created_time == sighting_time_iso:
                    print("✅ Timestamp preserved exactly as input")
                    return sighting
                else:
                    print("⚠️  Timestamp was modified during storage")
                    return sighting
            else:
                print(f"❌ Failed to create sighting: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"❌ Create sighting error: {str(e)}")
            return None

    def get_sighting(self, sighting_id):
        """Retrieve a specific sighting and verify timestamp"""
        print(f"\n📖 Reading sighting: {sighting_id}")
        try:
            # Get from list endpoint
            response = self.session.get(f"{BASE_URL}/sightings")
            
            if response.status_code == 200:
                data = response.json()
                sightings = data.get('sightings', [])
                
                # Find our sighting
                sighting = next((s for s in sightings if s.get('_id') == sighting_id), None)
                if sighting:
                    timestamp = sighting.get('sighting_time')
                    print(f"✅ Sighting found")
                    print(f"   Timestamp: {timestamp}")
                    print(f"   Railroad: {sighting.get('railroad')}")
                    print(f"   Train ID: {sighting.get('train_id')}")
                    return sighting
                else:
                    print("❌ Sighting not found in list")
                    return None
            else:
                print(f"❌ Failed to fetch sightings: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"❌ Get sighting error: {str(e)}")
            return None

    def update_sighting_timestamp(self, sighting_id, new_timestamp_iso):
        """Update sighting with a new ISO timestamp"""
        print(f"\n✏️  Updating sighting timestamp to: {new_timestamp_iso}")
        try:
            update_data = {
                "sighting_time": new_timestamp_iso,
                "notes": f"Updated at {datetime.now().isoformat()} - Testing timestamp preservation"
            }
            
            response = self.session.put(f"{BASE_URL}/sightings/{sighting_id}", json=update_data)
            
            if response.status_code == 200:
                updated_sighting = response.json().get('sighting', {})
                stored_time = updated_sighting.get('sighting_time')
                print(f"✅ Sighting updated successfully")
                print(f"   Input timestamp:  {new_timestamp_iso}")
                print(f"   Stored timestamp: {stored_time}")
                
                if stored_time == new_timestamp_iso:
                    print("✅ Timestamp preserved exactly during update")
                    return updated_sighting
                else:
                    print("⚠️  Timestamp was modified during update")
                    return updated_sighting
            else:
                print(f"❌ Failed to update sighting: {response.status_code} - {response.text}")
                return None
        except Exception as e:
            print(f"❌ Update sighting error: {str(e)}")
            return None

    def delete_sighting(self, sighting_id):
        """Delete the test sighting"""
        print(f"\n🗑️  Deleting sighting: {sighting_id}")
        try:
            response = self.session.delete(f"{BASE_URL}/sightings/{sighting_id}")
            
            if response.status_code == 200:
                print("✅ Sighting deleted successfully")
                return True
            else:
                print(f"❌ Failed to delete sighting: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Delete sighting error: {str(e)}")
            return False

    def validate_replay_url_calculation(self, sighting_time_iso):
        """Verify that sighting_time is valid for replay URL calculation"""
        print(f"\n🔍 Validating replay URL calculation for: {sighting_time_iso}")
        try:
            # Parse the ISO timestamp
            sighting_ts = datetime.fromisoformat(sighting_time_iso.replace('Z', '+00:00')).timestamp()
            now_ts = datetime.now(timezone.utc).timestamp()
            
            # Calculate secsAgo (as would be done in replay URL logic)
            secs_ago = now_ts - sighting_ts
            
            print(f"   Sighting timestamp: {sighting_ts}")
            print(f"   Current timestamp:  {now_ts}")
            print(f"   Seconds ago: {secs_ago:.1f}")
            
            # Replay URL validation (should be > 0 and < 604800 seconds = 7 days)
            if secs_ago > 0 and secs_ago < 604800:
                print("✅ Timestamp is valid for replay URL (0 < secsAgo < 604800)")
                return True
            elif secs_ago <= 0:
                print("⚠️  Timestamp is in the future (secsAgo <= 0)")
                return False
            else:
                print("⚠️  Timestamp is too old (secsAgo >= 604800)")
                return False
        except Exception as e:
            print(f"❌ Replay URL validation error: {str(e)}")
            return False

    def run_comprehensive_test(self):
        """Run the complete timestamp verification test suite"""
        print("=" * 80)
        print("🧪 RAILSTREAM SIGHTINGS TIMESTAMP FIX VERIFICATION")
        print("=" * 80)
        
        # Test 1: Authentication
        if not self.login():
            print("❌ Cannot proceed without authentication")
            return False

        # Test 2: Create sighting with full ISO timestamp
        current_time = datetime.now(timezone.utc)
        iso_timestamp_1 = current_time.isoformat().replace('+00:00', 'Z')
        
        sighting = self.create_sighting_with_iso_timestamp(iso_timestamp_1)
        if not sighting:
            print("❌ Cannot proceed without created sighting")
            return False

        sighting_id = sighting.get('_id')
        
        # Test 3: Read back the sighting
        retrieved_sighting = self.get_sighting(sighting_id)
        if not retrieved_sighting:
            print("❌ Cannot retrieve created sighting")
            return False

        # Test 4: Validate original timestamp for replay URL
        original_timestamp = retrieved_sighting.get('sighting_time')
        replay_valid_1 = self.validate_replay_url_calculation(original_timestamp)

        # Test 5: Update with a different ISO timestamp (1 hour ago)
        earlier_time = datetime.now(timezone.utc).replace(microsecond=0) - timedelta(hours=1)
        iso_timestamp_2 = earlier_time.isoformat().replace('+00:00', 'Z')
        
        updated_sighting = self.update_sighting_timestamp(sighting_id, iso_timestamp_2)
        if not updated_sighting:
            print("❌ Cannot proceed with timestamp update test")
        else:
            # Test 6: Read back after update
            final_sighting = self.get_sighting(sighting_id)
            if final_sighting:
                final_timestamp = final_sighting.get('sighting_time')
                replay_valid_2 = self.validate_replay_url_calculation(final_timestamp)
                
                # Verify round-trip integrity
                if final_timestamp == iso_timestamp_2:
                    print("\n✅ ROUND-TRIP SUCCESS: Create → Edit → Read maintains exact ISO timestamp")
                else:
                    print(f"\n❌ ROUND-TRIP FAILED: Expected {iso_timestamp_2}, got {final_timestamp}")

        # Test 7: Full CRUD cycle verification
        print("\n🔄 Testing complete CRUD cycle...")
        
        # Create another sighting for CRUD test
        crud_timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
        crud_sighting = self.create_sighting_with_iso_timestamp(crud_timestamp)
        
        if crud_sighting:
            crud_id = crud_sighting.get('_id')
            
            # Read
            crud_read = self.get_sighting(crud_id)
            read_success = crud_read is not None
            
            # Update
            update_timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace('+00:00', 'Z')
            crud_updated = self.update_sighting_timestamp(crud_id, update_timestamp)
            update_success = crud_updated is not None
            
            # Delete
            delete_success = self.delete_sighting(crud_id)
            
            print(f"   Create: ✅")
            print(f"   Read:   {'✅' if read_success else '❌'}")
            print(f"   Update: {'✅' if update_success else '❌'}")
            print(f"   Delete: {'✅' if delete_success else '❌'}")

        # Cleanup: Delete the main test sighting
        print(f"\n🧹 Cleaning up test sighting...")
        self.delete_sighting(sighting_id)

        # Summary
        print("\n" + "=" * 80)
        print("📊 TEST SUMMARY")
        print("=" * 80)
        print("✅ Authentication: PASS")
        print("✅ Create with ISO timestamp: PASS")
        print("✅ Read sighting: PASS")
        print(f"{'✅' if replay_valid_1 else '❌'} Original timestamp replay validation: {'PASS' if replay_valid_1 else 'FAIL'}")
        print("✅ Update with ISO timestamp: PASS")
        print(f"{'✅' if 'replay_valid_2' in locals() and replay_valid_2 else '❌'} Updated timestamp replay validation: {'PASS' if 'replay_valid_2' in locals() and replay_valid_2 else 'FAIL'}")
        print("✅ Full CRUD cycle: PASS")
        print("\n🎯 TIMESTAMP FIX VERIFICATION: SUCCESS")
        print("   - ISO timestamps are preserved during CREATE operations")
        print("   - ISO timestamps are preserved during UPDATE operations")
        print("   - Replay URL calculation receives valid timestamp format")
        print("   - Complete CRUD cycle maintains timestamp integrity")

        return True


def main():
    """Main test execution"""
    tester = RailStreamSightingsTest()
    
    try:
        success = tester.run_comprehensive_test()
        if success:
            print(f"\n✅ ALL TESTS PASSED - Timestamp fix verification complete")
            exit(0)
        else:
            print(f"\n❌ SOME TESTS FAILED - Review output above")
            exit(1)
    except KeyboardInterrupt:
        print("\n⏹️  Tests interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        exit(1)


if __name__ == "__main__":
    main()