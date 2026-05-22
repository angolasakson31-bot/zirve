import mongoose from 'mongoose';

const VisitorSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, unique: true },
  lastSeen: { type: Date, default: Date.now, expires: 300 }, // 5 dakika TTL
});

export const Visitor =
  (mongoose.models.Visitor as mongoose.Model<mongoose.Document>) ||
  mongoose.model('Visitor', VisitorSchema);
