import mongoose from 'mongoose';

const DailyVisitorSchema = new mongoose.Schema({
  date: { type: String, required: true },       // 'YYYY-MM-DD' Türkiye saatiyle
  sessionId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: 172800 }, // 48 saat sonra otomatik sil
});

DailyVisitorSchema.index({ date: 1, sessionId: 1 }, { unique: true });

export const DailyVisitor =
  (mongoose.models.DailyVisitor as mongoose.Model<mongoose.Document>) ||
  mongoose.model('DailyVisitor', DailyVisitorSchema);
