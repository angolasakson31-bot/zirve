import mongoose from 'mongoose';

const DeletedPhotoSchema = new mongoose.Schema({
  trackingCode: { type: String, required: true, unique: true },
  reason: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 90 }, // 90-day TTL
});

export default mongoose.models.DeletedPhoto ?? mongoose.model('DeletedPhoto', DeletedPhotoSchema);
