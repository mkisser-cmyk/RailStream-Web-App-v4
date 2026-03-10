import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const UserPreferencesSchema = new mongoose.Schema({
  _id: { type: String, default: () => uuidv4() },
  userId: { type: String, required: true, unique: true, index: true },
  username: { type: String, default: '' },
  favorites: { type: [String], default: [] },  // Array of camera _id strings
  presets: { type: Array, default: [] },        // Array of { name, viewMode, cameras: [...cameraIds] }
  updatedAt: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.models.UserPreferences || mongoose.model('UserPreferences', UserPreferencesSchema);
