import mongoose from 'mongoose';

// Filigran kodu → IP hash eşlemesi. Sadece sızıntı takibi için tutulur;
// 90 gün görülmeyen kayıtlar TTL ile silinir.
const ViewerCodeSchema = new mongoose.Schema({
  code:     { type: String, required: true, unique: true },
  ipHash:   { type: String, required: true },
  lastSeen: { type: Date, default: Date.now, expires: 90 * 24 * 60 * 60 },
});

export const ViewerCode =
  (mongoose.models.ViewerCode as mongoose.Model<mongoose.Document>) ||
  mongoose.model('ViewerCode', ViewerCodeSchema);
