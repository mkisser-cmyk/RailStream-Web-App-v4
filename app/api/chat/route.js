// Chat API Routes
// Global "Yard Chat" for RailStream members

import { NextResponse } from 'next/server';
import { MongoClient, ObjectId } from 'mongodb';

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017';
const DB_NAME = 'railstream';
const COLLECTION = 'chat_messages';

// MongoDB connection (cached)
let cachedClient = null;

async function getDb() {
  if (!cachedClient) {
    cachedClient = new MongoClient(MONGO_URL);
    await cachedClient.connect();
  }
  return cachedClient.db(DB_NAME);
}

// GET - Fetch recent messages
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const before = searchParams.get('before'); // For pagination
    
    const db = await getDb();
    const collection = db.collection(COLLECTION);
    
    const query = {};
    if (before) {
      query.created_at = { $lt: new Date(before) };
    }
    
    const messages = await collection
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    
    // Return in chronological order (oldest first)
    const formatted = messages.reverse().map(msg => ({
      id: msg._id.toString(),
      username: msg.username,
      tier: msg.tier,
      message: msg.message,
      created_at: msg.created_at.toISOString(),
      is_admin: msg.is_admin || false,
    }));
    
    return NextResponse.json({ 
      ok: true, 
      messages: formatted,
      count: formatted.length
    });
    
  } catch (error) {
    console.error('Chat GET error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST - Send a new message
export async function POST(request) {
  try {
    const body = await request.json();
    const { message, user } = body;
    
    // Validate
    if (!message || typeof message !== 'string') {
      return NextResponse.json({ ok: false, error: 'Message is required' }, { status: 400 });
    }
    
    if (!user || !user.username) {
      return NextResponse.json({ ok: false, error: 'Must be logged in to chat' }, { status: 401 });
    }
    
    // Sanitize message
    const cleanMessage = message.trim().slice(0, 500); // Max 500 chars
    
    if (cleanMessage.length === 0) {
      return NextResponse.json({ ok: false, error: 'Message cannot be empty' }, { status: 400 });
    }
    
    const db = await getDb();
    const collection = db.collection(COLLECTION);
    
    const newMessage = {
      username: user.username,
      tier: user.membership_tier || 'guest',
      message: cleanMessage,
      is_admin: user.is_admin || false,
      created_at: new Date(),
      user_id: user.user_id || null,
    };
    
    const result = await collection.insertOne(newMessage);
    
    return NextResponse.json({
      ok: true,
      message: {
        id: result.insertedId.toString(),
        username: newMessage.username,
        tier: newMessage.tier,
        message: newMessage.message,
        created_at: newMessage.created_at.toISOString(),
        is_admin: newMessage.is_admin,
      }
    });
    
  } catch (error) {
    console.error('Chat POST error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to send message' }, { status: 500 });
  }
}

// DELETE - Admin delete message
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const messageId = searchParams.get('id');
    const body = await request.json();
    const { user } = body;
    
    if (!messageId) {
      return NextResponse.json({ ok: false, error: 'Message ID required' }, { status: 400 });
    }
    
    if (!user?.is_admin) {
      return NextResponse.json({ ok: false, error: 'Admin access required' }, { status: 403 });
    }
    
    const db = await getDb();
    const collection = db.collection(COLLECTION);
    
    const result = await collection.deleteOne({ _id: new ObjectId(messageId) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json({ ok: false, error: 'Message not found' }, { status: 404 });
    }
    
    return NextResponse.json({ ok: true, deleted: messageId });
    
  } catch (error) {
    console.error('Chat DELETE error:', error);
    return NextResponse.json({ ok: false, error: 'Failed to delete message' }, { status: 500 });
  }
}
