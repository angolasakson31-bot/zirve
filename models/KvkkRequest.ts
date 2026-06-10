import mongoose, { Schema, Document, Model } from 'mongoose';

export type KvkkRequestType =
  | 'access'   // Hakkımdaki verileri bilgilendirme
  | 'delete'   // Verilerimin silinmesi
  | 'correct'  // Düzeltme
  | 'object'   // İşlemeye itiraz
  | 'other';

export interface IKvkkRequest extends Document {
  name: string;
  email: string;
  requestType: KvkkRequestType;
  details: string;
  trackingCode?: string;
  ipHash: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: Date;
}

const KvkkRequestSchema = new Schema<IKvkkRequest>(
  {
    name:         { type: String, required: true, maxlength: 100 },
    email:        { type: String, required: true, maxlength: 200 },
    requestType:  { type: String, enum: ['access', 'delete', 'correct', 'object', 'other'], required: true },
    details:      { type: String, default: '', maxlength: 2000 },
    trackingCode: { type: String, default: '' },
    ipHash:       { type: String, required: true },
    status:       { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open', index: true },
  },
  { timestamps: true },
);

KvkkRequestSchema.index({ status: 1, createdAt: -1 });

const KvkkRequest: Model<IKvkkRequest> =
  mongoose.models.KvkkRequest || mongoose.model<IKvkkRequest>('KvkkRequest', KvkkRequestSchema);

export default KvkkRequest;
