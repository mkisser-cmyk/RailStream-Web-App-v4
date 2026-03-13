#!/usr/bin/env python3
"""
Heritage Alert Debug - Trigger and trace the heritage alert flow
"""
import requests
import json
import time

# API Configuration  
BASE_URL = "https://photo-modal-enhance.preview.emergentagent.com"
TEST_USER = "chicagotest"
TEST_PASS = "sZyE8cDFk"

def main():
    print("=== HERITAGE ALERT DEBUG & FIX TEST ===")
    
    # Login
    login_response = requests.post(f"{BASE_URL}/api/auth/login", 
        json={"username": TEST_USER, "password": TEST_PASS}, timeout=30)
    
    if login_response.status_code == 200:
        auth_token = login_response.json()['access_token']
        auth_headers = {"Authorization": f"Bearer {auth_token}"}
        print("✅ Login successful")
    else:
        print("❌ Login failed")
        return
    
    # Test heritage detection first
    print("\n🔍 Testing heritage detection...")
    heritage_test = requests.get(f"{BASE_URL}/api/roundhouse?action=detect_heritage&locomotives=NS 1073", timeout=30)
    if heritage_test.status_code == 200:
        heritage_data = heritage_test.json()
        print(f"Heritage detection result: {heritage_data}")
    else:
        print("❌ Heritage detection failed")
    
    # Create camera capture with heritage unit
    print("\n📸 Creating camera capture with heritage unit...")
    heritage_cam_data = {
        "action": "create",
        "railroad": "NS",
        "locomotive_numbers": "NS 1073",  # Known heritage unit
        "location": "Fostoria, Ohio", 
        "source": "camera_capture",  # This should trigger alert
        "camera_name": "Fostoria Cam Debug",
        "tags": ["heritage"],
        "title": "Heritage Alert Debug Test"
    }
    
    create_response = requests.post(f"{BASE_URL}/api/roundhouse", 
        json=heritage_cam_data, headers=auth_headers, timeout=30)
    
    if create_response.status_code == 200:
        result = create_response.json()
        print(f"✅ Photo created successfully")
        print(f"   Photo ID: {result['photo']['id']}")
        print(f"   Is Heritage: {result['photo']['is_heritage']}")
        print(f"   Heritage Units: {result['photo']['heritage_units']}")
        print(f"   Source: {result['photo']['source']}")
        
        # Important: Check if the heritage alert logic should trigger
        is_heritage = result['photo']['is_heritage']
        heritage_units = result['photo']['heritage_units'] 
        source = result['photo']['source']
        
        print(f"\n🔍 Heritage Alert Trigger Check:")
        print(f"   is_heritage: {is_heritage}")
        print(f"   heritage_units count: {len(heritage_units) if heritage_units else 0}")
        print(f"   source: {source}")
        print(f"   Should trigger: {is_heritage and heritage_units and len(heritage_units) > 0 and source == 'camera_capture'}")
        
    else:
        print(f"❌ Photo creation failed: {create_response.status_code}")
        print(f"   Response: {create_response.text}")
        return
    
    # Wait a bit for async processing
    print("\n⏳ Waiting 3 seconds for heritage alert processing...")
    time.sleep(3)
    
    # Check chat for the alert
    print("\n💬 Checking chat for heritage alert...")
    messages_response = requests.get(f"{BASE_URL}/api/chat?action=messages&room_id=the-yard&limit=10", 
                                   timeout=30)
    
    if messages_response.status_code == 200:
        messages = messages_response.json().get('messages', [])
        
        # Look for RoundhouseBot messages
        bot_messages = [msg for msg in messages if msg.get('username') == 'RoundhouseBot']
        recent_heritage_alerts = [msg for msg in messages 
                                if 'HERITAGE UNIT ON CAM' in msg.get('message', '')]
        
        print(f"📊 Chat Analysis:")
        print(f"   Total messages: {len(messages)}")
        print(f"   RoundhouseBot messages: {len(bot_messages)}")
        print(f"   Heritage alerts: {len(recent_heritage_alerts)}")
        
        if recent_heritage_alerts:
            print("\n🎉 HERITAGE ALERTS FOUND:")
            for alert in recent_heritage_alerts:
                print(f"   - {alert['created_at']}: {alert['message']}")
        else:
            print("\n❌ NO HERITAGE ALERTS FOUND")
            print("   This indicates the heritage alert logic may not be working")
            print("   Possible issues:")
            print("   1. Chat/MongoDB connection issue")
            print("   2. SSE bus not working")
            print("   3. 'The Yard' room not found in database")
            print("   4. Heritage alert code path not executing")
            
            # Debug: Check if The Yard room exists in database
            print("\n🔍 Checking chat rooms...")
            rooms_response = requests.get(f"{BASE_URL}/api/chat?action=rooms", timeout=30)
            if rooms_response.status_code == 200:
                rooms = rooms_response.json().get('rooms', [])
                yard_room = next((r for r in rooms if r['name'] == 'The Yard'), None)
                if yard_room:
                    print(f"   ✅ 'The Yard' room exists: ID={yard_room['id']}")
                else:
                    print("   ❌ 'The Yard' room NOT found")
            
    else:
        print(f"❌ Chat messages fetch failed: {messages_response.status_code}")

if __name__ == "__main__":
    main()