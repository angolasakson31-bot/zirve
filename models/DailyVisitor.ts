import mongoose from 'mongoose';

const DailyVisitorSchema = new mongoose.Schema({
  date:      { type: String, required: true },   // 'YYYY-MM-DD' Türkiye saatiyle
  ipHash:    { type: String, required: true },   // IP'nin HMAC-SHA256 hash'i — anonim
  sessionId: { type: String },                   // (legacy, opsiyonel — IP-based dedup'a geçiş öncesi)
  createdAt: { type: Date, default: Date.now, expires: 172800 }, // 48 saat TTL
});

// Aynı gün içinde aynı IP'den birden fazla ping gelse bile tek kayıt oluşur.
// sparse:true → eski (sessionId-only) kayıtlarda ipHash undefined, yeni index'e
// dahil olmaz. Böylece migration sırasında "null+null collision" sorunu çıkmaz.
DailyVisitorSchema.index(
  { date: 1, ipHash: 1 },
  { unique: true, sparse: true },
);

export const DailyVisitor =
  (mongoose.models.DailyVisitor as mongoose.Model<mongoose.Document>) ||
  mongoose.model('DailyVisitor', DailyVisitorSchema);
