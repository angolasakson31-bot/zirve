import mongoose, { Schema, Model } from 'mongoose';

interface IBannedIP {
  ip: string;
  reason: string;
  createdAt: Date;
}

const BannedIPSchema = new Schema<IBannedIP>(
  {
    ip: { type: String, required: true, unique: true },
    reason: { type: String, default: '' },
  },
  { timestamps: true }
);

const BannedIP: Model<IBannedIP> =
  mongoose.models.BannedIP || mongoose.model<IBannedIP>('BannedIP', BannedIPSchema);

export default BannedIP;
