#!/usr/bin/env python3
"""
Heritage Alert Debug Test - Check chat messages for heritage alerts
"""
import requests
import json
import time

# API Configuration
BASE_URL = "https://photo-modal-enhance.preview.emergentagent.com"

def main():
    print("=== HERITAGE ALERT DEBUG TEST ===")
    
    # Get chat rooms first
    rooms_response = requests.get(f"{BASE_URL}/api/chat?action=rooms", timeout=30)
    if rooms_response.status_code == 200:
        rooms_data = rooms_response.json()
        yard_room = next((r for r in rooms_data.get('rooms', []) if r['name'] == 'The Yard'), None)
        if yard_room:
            yard_room_id = yard_room['id']
            print(f"✅ Found 'The Yard' room: {yard_room_id}")
        else:
            print("❌ 'The Yard' room not found")
            return
    else:
        print(f"❌ Failed to get chat rooms: {rooms_response.status_code}")
        return
    
    # Get recent chat messages
    messages_response = requests.get(f"{BASE_URL}/api/chat?action=messages&room_id={yard_room_id}&limit=20", 
                                   timeout=30)
    
    if messages_response.status_code == 200:
        messages_data = messages_response.json()
        messages = messages_data.get('messages', [])
        
        print(f"\n📨 Recent messages in The Yard (last {len(messages)}):")
        
        heritage_count = 0
        for i, msg in enumerate(messages):
            username = msg.get('username', 'Unknown')
            message_text = msg.get('message', '')
            created_at = msg.get('created_at', 'Unknown')
            is_system = msg.get('is_system', False)
            is_heritage_alert = msg.get('is_heritage_alert', False)
            
            # Check for heritage-related messages
            is_heritage_msg = (
                username == 'RoundhouseBot' or
                'heritage' in message_text.lower() or
                'HERITAGE UNIT' in message_text or
                is_heritage_alert or
                is_system
            )
            
            if is_heritage_msg:
                heritage_count += 1
                print(f"  🔍 #{i+1} [{username}] {created_at}")
                print(f"      Message: {message_text}")
                print(f"      System: {is_system}, Heritage Alert: {is_heritage_alert}")
            else:
                print(f"  #{i+1} [{username}] {message_text[:60]}...")
        
        print(f"\n📊 Found {heritage_count} heritage-related messages")
        
        if heritage_count == 0:
            print("🔍 No heritage alerts found. This could mean:")
            print("  1. Heritage alert logic is not triggering")
            print("  2. Chat database/SSE bus issue")
            print("  3. Timing issue (alert posted to different room)")
            
            # Check all messages for any RoundhouseBot activity
            bot_messages = [msg for msg in messages if msg.get('username') == 'RoundhouseBot']
            print(f"\n🤖 RoundhouseBot messages: {len(bot_messages)}")
            for msg in bot_messages:
                print(f"  - {msg.get('created_at')}: {msg.get('message')}")
        
    else:
        print(f"❌ Failed to get chat messages: {messages_response.status_code}")

if __name__ == "__main__":
    main()