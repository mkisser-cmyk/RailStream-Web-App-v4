// The Roundhouse — Community Rail Photo Archives API
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';

let _client = null;
async function getDb() {
  if (!_client) {
    _client = new MongoClient(process.env.MONGO_URL);
    await _client.connect();
  }
  return _client.db();
}

// ── Heritage Unit Database ──
const HERITAGE_UNITS = {
  // Norfolk Southern Heritage Fleet (SD70ACe)
  'NS 1065': { railroad: 'NS', name: 'Norfolk & Western', scheme: 'N&W' },
  'NS 1066': { railroad: 'NS', name: 'Virginian Railway', scheme: 'Virginian' },
  'NS 1067': { railroad: 'NS', name: 'Reading Lines', scheme: 'Reading' },
  'NS 1068': { railroad: 'NS', name: 'Erie Railroad', scheme: 'Erie' },
  'NS 1069': { railroad: 'NS', name: 'Lackawanna Railroad', scheme: 'DL&W' },
  'NS 1070': { railroad: 'NS', name: 'Wabash Railroad', scheme: 'Wabash' },
  'NS 1071': { railroad: 'NS', name: 'Jersey Central Lines', scheme: 'CNJ' },
  'NS 1072': { railroad: 'NS', name: 'Illinois Terminal', scheme: 'IT' },
  'NS 1073': { railroad: 'NS', name: 'Southern Railway', scheme: 'Southern' },
  'NS 1074': { railroad: 'NS', name: 'Savannah & Atlanta', scheme: 'S&A' },
  'NS 1076': { railroad: 'NS', name: 'Central of Georgia', scheme: 'CofGA' },
  'NS 1077': { railroad: 'NS', name: 'Nickel Plate Road', scheme: 'NKP' },
  'NS 1080': { railroad: 'NS', name: 'Erie Lackawanna', scheme: 'EL' },
  'NS 1081': { railroad: 'NS', name: 'Pennsylvania Railroad', scheme: 'PRR' },
  'NS 1082': { railroad: 'NS', name: 'Lehigh Valley', scheme: 'LV' },
  'NS 1083': { railroad: 'NS', name: 'Interstate Railroad', scheme: 'Interstate' },
  'NS 8099': { railroad: 'NS', name: 'Norfolk Southern', scheme: 'NS Standard' },
  'NS 8100': { railroad: 'NS', name: 'Norfolk & Western', scheme: 'N&W Modern' },

  // Union Pacific Heritage Fleet (SD70ACe)
  'UP 1943': { railroad: 'UP', name: 'Union Pacific Overland', scheme: 'UP Overland' },
  'UP 1982': { railroad: 'UP', name: 'Missouri Pacific', scheme: 'MoPac' },
  'UP 1983': { railroad: 'UP', name: 'Western Pacific', scheme: 'WP' },
  'UP 1988': { railroad: 'UP', name: 'Chicago & North Western', scheme: 'CNW' },
  'UP 1989': { railroad: 'UP', name: 'Denver & Rio Grande Western', scheme: 'DRGW' },
  'UP 1995': { railroad: 'UP', name: 'Katy Railroad', scheme: 'MKT' },
  'UP 1996': { railroad: 'UP', name: 'Southern Pacific', scheme: 'SP' },
  'UP 4141': { railroad: 'UP', name: 'George H.W. Bush', scheme: 'Bush 4141' },
  'UP 4014': { railroad: 'UP', name: 'Big Boy Steam', scheme: 'Big Boy' },
  'UP 1862': { railroad: 'UP', name: 'Union Pacific', scheme: 'UP 150th' },

  // CSX Heritage / Special Units
  'CSX 1776': { railroad: 'CSX', name: 'Spirit of America', scheme: 'Stars & Stripes' },
  'CSX 1827': { railroad: 'CSX', name: 'Baltimore & Ohio', scheme: 'B&O' },
  'CSX 1836': { railroad: 'CSX', name: 'Louisville & Nashville', scheme: 'L&N' },
  'CSX 1837': { railroad: 'CSX', name: 'Clinchfield Railroad', scheme: 'Clinchfield' },
  'CSX 1870': { railroad: 'CSX', name: 'Chesapeake & Ohio', scheme: 'C&O' },
  'CSX 911': { railroad: 'CSX', name: 'First Responders', scheme: 'Spirit of First Responders' },

  // KCS Heritage / Special Units
  'KCS 4006': { railroad: 'KCS', name: 'Southern Belle', scheme: 'Southern Belle' },
  'KCS 4771': { railroad: 'KCS', name: 'KCS de Mexico', scheme: 'KCSM' },
  'KCS 1': { railroad: 'KCS', name: 'The General', scheme: 'KCS Classic' },
};

// Auto-detect heritage units from locomotive number string
function detectHeritage(locoStr) {
  if (!locoStr) return { isHeritage: false, units: [] };
  const normalized = locoStr.toUpperCase().replace(/[,;]+/g, ',');
  const found = [];

  for (const [key, info] of Object.entries(HERITAGE_UNITS)) {
    const keyUpper = key.toUpperCase();
    // Match "NS 1073", "NS1073", "NS-1073"
    const keyVariants = [keyUpper, keyUpper.replace(' ', ''), keyUpper.replace(' ', '-')];
    for (const variant of keyVariants) {
      if (normalized.includes(variant)) {
        found.push({ unit: key, ...info });
        break;
      }
    }
  }

  return { isHeritage: found.length > 0, units: found };
}

// Helper: verify auth token
async function verifyAuth(request) {
  const auth = request.headers.get('authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);

  try {
    const upstreamUrl = process.env.UPSTREAM_API || 'https://api.railstream.net';
    const res = await fetch(`${upstreamUrl}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

// GET /api/roundhouse
export async function GET(request) {
  try {
    const db = await getDb();
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    // ── GET HERITAGE DATABASE ──
    if (action === 'heritage_units') {
      return NextResponse.json({ ok: true, units: HERITAGE_UNITS });
    }

    // ── GET STATS ──
    if (action === 'stats') {
      const total = await db.collection('roundhouse_photos').countDocuments({});
      const heritageCount = await db.collection('roundhouse_photos').countDocuments({ is_heritage: true });
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const today = await db.collection('roundhouse_photos').countDocuments({ created_at: { $gte: todayStart } });
      const collectionCount = await db.collection('roundhouse_collections').countDocuments({});

      const topContributors = await db.collection('roundhouse_photos').aggregate([
        { $group: { _id: '$username', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).toArray();

      const topRailroads = await db.collection('roundhouse_photos').aggregate([
        { $group: { _id: '$railroad', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ]).toArray();

      return NextResponse.json({
        ok: true,
        total,
        heritage_count: heritageCount,
        today,
        collection_count: collectionCount,
        top_contributors: topContributors.map(t => ({ username: t._id, count: t.count })),
        top_railroads: topRailroads.map(t => ({ name: t._id, count: t.count })),
      });
    }

    // ── GET SINGLE PHOTO ──
    if (action === 'get') {
      const id = url.searchParams.get('id');
      if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });
      const photo = await db.collection('roundhouse_photos').findOne({ id });
      if (!photo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });
      return NextResponse.json({ ok: true, photo });
    }

    // ── DETECT HERITAGE (used by frontend for real-time detection) ──
    if (action === 'detect_heritage') {
      const locos = url.searchParams.get('locomotives') || '';
      const result = detectHeritage(locos);
      return NextResponse.json({ ok: true, ...result });
    }

    // ── LIST COLLECTIONS ──
    if (action === 'collections') {
      const userId = url.searchParams.get('user') || '';
      const query = {};
      if (userId) query.username = userId;

      const collections = await db.collection('roundhouse_collections')
        .find(query)
        .sort({ updated_at: -1 })
        .toArray();

      return NextResponse.json({
        ok: true,
        collections: collections.map(c => ({
          id: c.id,
          name: c.name,
          description: c.description || '',
          cover_image_url: c.cover_image_url || '',
          username: c.username,
          photo_count: c.photo_count || 0,
          created_at: c.created_at,
          updated_at: c.updated_at,
        })),
      });
    }

    // ── GET SINGLE COLLECTION WITH ITS PHOTOS ──
    if (action === 'collection') {
      const id = url.searchParams.get('id');
      if (!id) return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 });

      const collection = await db.collection('roundhouse_collections').findOne({ id });
      if (!collection) return NextResponse.json({ ok: false, error: 'Collection not found' }, { status: 404 });

      const photos = await db.collection('roundhouse_photos')
        .find({ collection_id: id })
        .sort({ created_at: -1 })
        .toArray();

      return NextResponse.json({
        ok: true,
        collection: {
          id: collection.id,
          name: collection.name,
          description: collection.description || '',
          cover_image_url: collection.cover_image_url || '',
          username: collection.username,
          photo_count: collection.photo_count || 0,
          created_at: collection.created_at,
        },
        photos: photos.map(p => ({
          id: p.id, username: p.username, image_url: p.image_url, railroad: p.railroad,
          locomotive_numbers: p.locomotive_numbers, location: p.location, camera_name: p.camera_name,
          source: p.source, tags: p.tags || [], is_heritage: p.is_heritage || false,
          heritage_info: p.heritage_info || '', title: p.title || '', description: p.description || '',
          loco_model: p.loco_model || '', builder: p.builder || '', photo_date: p.photo_date || '',
          likes: p.likes || 0, liked_by: p.liked_by || [], created_at: p.created_at,
        })),
      });
    }

    // ── LIST PHOTOS (with search, filters, pagination) ──
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '30'), 100);
    const search = url.searchParams.get('search') || '';
    const railroad = url.searchParams.get('railroad') || '';
    const tag = url.searchParams.get('tag') || '';
    const source = url.searchParams.get('source') || '';
    const heritage = url.searchParams.get('heritage') || '';
    const user = url.searchParams.get('user') || '';
    const collectionId = url.searchParams.get('collection_id') || '';
    const sort = url.searchParams.get('sort') || 'newest';

    const query = {};
    if (railroad) query.railroad = railroad;
    if (tag) query.tags = tag;
    if (source) query.source = source;
    if (heritage === 'true') query.is_heritage = true;
    if (user) query.username = user;
    if (collectionId) query.collection_id = collectionId;

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { locomotive_numbers: searchRegex },
        { title: searchRegex },
        { description: searchRegex },
        { location: searchRegex },
        { railroad: searchRegex },
        { username: searchRegex },
        { heritage_info: searchRegex },
        { loco_model: searchRegex },
        { builder: searchRegex },
      ];
    }

    const sortMap = {
      newest: { created_at: -1 },
      oldest: { created_at: 1 },
      most_liked: { likes: -1, created_at: -1 },
    };

    const total = await db.collection('roundhouse_photos').countDocuments(query);
    const photos = await db.collection('roundhouse_photos')
      .find(query)
      .sort(sortMap[sort] || sortMap.newest)
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      ok: true,
      photos: photos.map(p => ({
        id: p.id,
        username: p.username,
        image_url: p.image_url,
        railroad: p.railroad,
        locomotive_numbers: p.locomotive_numbers,
        location: p.location,
        camera_name: p.camera_name,
        source: p.source,
        tags: p.tags || [],
        is_heritage: p.is_heritage || false,
        heritage_info: p.heritage_info || '',
        heritage_units: p.heritage_units || [],
        title: p.title || '',
        description: p.description || '',
        loco_model: p.loco_model || '',
        builder: p.builder || '',
        photo_date: p.photo_date || '',
        collection_id: p.collection_id || '',
        collection_name: p.collection_name || '',
        likes: p.likes || 0,
        liked_by: p.liked_by || [],
        created_at: p.created_at,
      })),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    console.error('Roundhouse GET error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}

// POST /api/roundhouse
export async function POST(request) {
  try {
    const db = await getDb();
    const body = await request.json();
    const { action } = body;

    // ── UPLOAD IMAGE ──
    if (action === 'upload_image') {
      const user = await verifyAuth(request);
      if (!user) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });

      const { image_data, photo_id } = body;
      if (!image_data || !photo_id) {
        return NextResponse.json({ ok: false, error: 'image_data and photo_id required' }, { status: 400 });
      }

      // Save image to disk (supports NFS mount via ROUNDHOUSE_UPLOADS_PATH env var)
      const uploadsDir = process.env.ROUNDHOUSE_UPLOADS_PATH || '/app/uploads/roundhouse';
      if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

      const matches = image_data.match(/^data:image\/(\w+);base64,(.+)$/);
      if (!matches) return NextResponse.json({ ok: false, error: 'Invalid image data' }, { status: 400 });

      const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      const buffer = Buffer.from(matches[2], 'base64');

      // 15MB limit
      if (buffer.length > 15 * 1024 * 1024) {
        return NextResponse.json({ ok: false, error: 'Image must be under 15MB' }, { status: 400 });
      }

      // Add text watermark to the image metadata/name for tracking
      const filename = `rh_${photo_id}.${ext}`;
      fs.writeFileSync(path.join(uploadsDir, filename), buffer);

      const imageUrl = `/api/roundhouse/image/rh_${photo_id}.${ext}`;
      await db.collection('roundhouse_photos').updateOne(
        { id: photo_id },
        { $set: { image_url: imageUrl, updated_at: new Date() } }
      );

      // Set as collection cover image if it's the first photo in the collection
      const photoDoc = await db.collection('roundhouse_photos').findOne({ id: photo_id });
      if (photoDoc?.collection_id) {
        const coll = await db.collection('roundhouse_collections').findOne({ id: photoDoc.collection_id });
        if (coll && !coll.cover_image_url) {
          await db.collection('roundhouse_collections').updateOne(
            { id: photoDoc.collection_id },
            { $set: { cover_image_url: imageUrl } }
          );
        }
      }

      return NextResponse.json({ ok: true, image_url: imageUrl });
    }

    // ── CREATE PHOTO ENTRY ──
    if (action === 'create') {
      const user = await verifyAuth(request);
      if (!user) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });

      const isPaid = ['conductor', 'engineer', 'fireman', 'development', 'admin'].includes(
        user.membership_tier || user.tier
      );
      if (!isPaid) {
        return NextResponse.json({ ok: false, error: 'Paid membership required to post' }, { status: 403 });
      }

      const {
        railroad, locomotive_numbers, location, camera_id, camera_name, source, tags,
        title, description, loco_model, builder, photo_date, collection_id, collection_name,
      } = body;

      if (!railroad) return NextResponse.json({ ok: false, error: 'Railroad is required' }, { status: 400 });

      // Auto-detect heritage
      const heritage = detectHeritage(locomotive_numbers);

      const photoId = uuidv4();
      const photo = {
        id: photoId,
        username: user.username || user.name,
        railroad,
        locomotive_numbers: locomotive_numbers || '',
        location: location || '',
        camera_id: camera_id || null,
        camera_name: camera_name || null,
        source: source || 'upload',
        tags: tags || [],
        is_heritage: heritage.isHeritage || (tags || []).includes('heritage'),
        heritage_units: heritage.units,
        heritage_info: heritage.units.map(u => `${u.unit} — ${u.name}`).join(', '),
        title: title || '',
        description: description || '',
        loco_model: loco_model || '',
        builder: builder || '',
        photo_date: photo_date || '',
        collection_id: collection_id || '',
        collection_name: collection_name || '',
        image_url: '', // Set after upload
        likes: 0,
        liked_by: [],
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db.collection('roundhouse_photos').insertOne(photo);

      // ── Update collection photo count ──
      if (collection_id) {
        await db.collection('roundhouse_collections').updateOne(
          { id: collection_id },
          { $inc: { photo_count: 1 }, $set: { updated_at: new Date() } }
        );
        // Set cover image on collection if it's the first photo
        const coll = await db.collection('roundhouse_collections').findOne({ id: collection_id });
        if (coll && !coll.cover_image_url) {
          // Cover will be set after image upload
        }
      }

      // ── Heritage Alert to Chat ──
      if (photo.is_heritage && heritage.units.length > 0) {
        try {
          const alertMsg = `🚨 HERITAGE ALERT! ${heritage.units.map(u => `${u.unit} (${u.name})`).join(', ')} spotted at ${location || 'unknown location'} by ${photo.username}! Check The Roundhouse for the photo.`;

          // Post to The Yard chat
          const yardRoom = await db.collection('chat_rooms').findOne({ name: 'The Yard' });
          if (yardRoom) {
            await db.collection('chat_messages').insertOne({
              id: uuidv4(),
              room_id: yardRoom.id,
              username: 'RoundhouseBot',
              tier: 'system',
              message: alertMsg,
              is_admin: false,
              is_mod: false,
              is_system: true,
              pinned: false,
              reactions: {},
              created_at: new Date(),
            });
          }
        } catch (chatErr) {
          console.error('Heritage chat alert failed:', chatErr);
        }
      }

      return NextResponse.json({ ok: true, photo: { ...photo } });
    }

    // ── CREATE COLLECTION ──
    if (action === 'create_collection') {
      const user = await verifyAuth(request);
      if (!user) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });

      const { name, description: desc } = body;
      if (!name?.trim()) return NextResponse.json({ ok: false, error: 'Collection name is required' }, { status: 400 });

      const collId = uuidv4();
      const collection = {
        id: collId,
        name: name.trim(),
        description: (desc || '').trim(),
        cover_image_url: '',
        username: user.username || user.name,
        photo_count: 0,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await db.collection('roundhouse_collections').insertOne(collection);
      return NextResponse.json({ ok: true, collection });
    }

    // ── LIKE / UNLIKE PHOTO ──
    if (action === 'like') {
      const user = await verifyAuth(request);
      if (!user) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });

      const { photo_id } = body;
      if (!photo_id) return NextResponse.json({ ok: false, error: 'photo_id required' }, { status: 400 });

      const photo = await db.collection('roundhouse_photos').findOne({ id: photo_id });
      if (!photo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

      const username = user.username || user.name;
      const likedBy = photo.liked_by || [];
      const isLiked = likedBy.includes(username);

      if (isLiked) {
        await db.collection('roundhouse_photos').updateOne(
          { id: photo_id },
          { $pull: { liked_by: username }, $inc: { likes: -1 } }
        );
      } else {
        await db.collection('roundhouse_photos').updateOne(
          { id: photo_id },
          { $push: { liked_by: username }, $inc: { likes: 1 } }
        );
      }

      return NextResponse.json({ ok: true, liked: !isLiked, likes: isLiked ? (photo.likes || 1) - 1 : (photo.likes || 0) + 1 });
    }

    // ── DELETE PHOTO ──
    if (action === 'delete') {
      const user = await verifyAuth(request);
      if (!user) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });

      const { photo_id } = body;
      const photo = await db.collection('roundhouse_photos').findOne({ id: photo_id });
      if (!photo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

      const username = user.username || user.name;
      const isAdmin = user.is_admin || user.membership_tier === 'admin';
      if (photo.username !== username && !isAdmin) {
        return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 });
      }

      // Delete image file
      if (photo.image_url && photo.image_url.startsWith('/uploads/')) {
        const filePath = path.join('/app', photo.image_url);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }

      await db.collection('roundhouse_photos').deleteOne({ id: photo_id });
      return NextResponse.json({ ok: true });
    }

    // ── UPDATE PHOTO ──
    if (action === 'update') {
      const user = await verifyAuth(request);
      if (!user) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });

      const { photo_id, railroad, locomotive_numbers, location, tags, title, description, loco_model, builder, photo_date, collection_id, collection_name } = body;
      if (!photo_id) return NextResponse.json({ ok: false, error: 'photo_id required' }, { status: 400 });

      const photo = await db.collection('roundhouse_photos').findOne({ id: photo_id });
      if (!photo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

      const username = user.username || user.name;
      const isAdmin = user.is_admin || user.membership_tier === 'admin';
      if (photo.username !== username && !isAdmin) {
        return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 });
      }

      // Build update object — only include fields that were provided
      const update = { updated_at: new Date() };
      if (railroad !== undefined) update.railroad = railroad;
      if (locomotive_numbers !== undefined) {
        update.locomotive_numbers = locomotive_numbers;
        // Re-detect heritage
        const heritage = detectHeritage(locomotive_numbers);
        update.is_heritage = heritage.isHeritage || (tags || photo.tags || []).includes('heritage');
        update.heritage_units = heritage.units;
        update.heritage_info = heritage.units.map(u => `${u.unit} — ${u.name}`).join(', ');
      }
      if (location !== undefined) update.location = location;
      if (tags !== undefined) update.tags = tags;
      if (title !== undefined) update.title = title;
      if (description !== undefined) update.description = description;
      if (loco_model !== undefined) update.loco_model = loco_model;
      if (builder !== undefined) update.builder = builder;
      if (photo_date !== undefined) update.photo_date = photo_date;
      if (collection_id !== undefined) update.collection_id = collection_id;
      if (collection_name !== undefined) update.collection_name = collection_name;

      await db.collection('roundhouse_photos').updateOne(
        { id: photo_id },
        { $set: update }
      );

      // Return the full updated photo
      const updatedPhoto = await db.collection('roundhouse_photos').findOne({ id: photo_id });
      return NextResponse.json({ ok: true, photo: updatedPhoto });
    }

    // ── ADD COMMENT ──
    if (action === 'add_comment') {
      const user = await verifyAuth(request);
      if (!user) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });

      const { photo_id, text } = body;
      if (!photo_id || !text?.trim()) return NextResponse.json({ ok: false, error: 'photo_id and text required' }, { status: 400 });

      const username = user.username || user.name;
      const comment = {
        id: crypto.randomUUID(),
        username,
        text: text.trim().substring(0, 1000), // Max 1000 chars
        created_at: new Date().toISOString(),
      };

      await db.collection('roundhouse_photos').updateOne(
        { id: photo_id },
        { $push: { comments: comment } }
      );

      return NextResponse.json({ ok: true, comment });
    }

    // ── DELETE COMMENT ──
    if (action === 'delete_comment') {
      const user = await verifyAuth(request);
      if (!user) return NextResponse.json({ ok: false, error: 'Login required' }, { status: 401 });

      const { photo_id, comment_id } = body;
      if (!photo_id || !comment_id) return NextResponse.json({ ok: false, error: 'photo_id and comment_id required' }, { status: 400 });

      const photo = await db.collection('roundhouse_photos').findOne({ id: photo_id });
      if (!photo) return NextResponse.json({ ok: false, error: 'Not found' }, { status: 404 });

      const username = user.username || user.name;
      const isAdmin = user.is_admin || user.membership_tier === 'admin' || user.tier === 'admin';
      const isOwner = photo.username === username; // Photo owner can delete any comment
      const comment = (photo.comments || []).find(c => c.id === comment_id);
      const isCommentAuthor = comment && comment.username === username;

      if (!isAdmin && !isOwner && !isCommentAuthor) {
        return NextResponse.json({ ok: false, error: 'Not authorized' }, { status: 403 });
      }

      await db.collection('roundhouse_photos').updateOne(
        { id: photo_id },
        { $pull: { comments: { id: comment_id } } }
      );

      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    console.error('Roundhouse POST error:', err);
    return NextResponse.json({ ok: false, error: 'Server error' }, { status: 500 });
  }
}
