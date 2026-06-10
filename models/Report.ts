import mongoose, { Schema, Document, Model } from 'mongoose';

export type ReportReason =
  | 'ncii'           // Rıza dışı mahrem içerik
  | 'minor'          // Reşit olmayan kişi
  | 'insult'         // Hakaret/iftira
  | 'copyright'      // Telif ihlali
  | 'personal_data'  // Kişisel veri ifşası
  | 'other';

export interface IReport extends Document {
  photoId: mongoose.Types.ObjectId;
  reason: ReportReason;
  details: string;
  reporterIpHash: string;
  reporterDevice: string;
  status: 'open' | 'resolved' | 'dismissed';
  createdAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    photoId:        { type: Schema.Types.ObjectId, ref: 'Photo', required: true, index: true },
    reason:         { type: String, enum: ['ncii', 'minor', 'insult', 'copyright', 'personal_data', 'other'], required: true },
    details:        { type: String, default: '', maxlength: 500 },
    reporterIpHash: { type: String, required: true },
    reporterDevice: { type: String, default: '' },
    status:         { type: String, enum: ['open', 'resolved', 'dismissed'], default: 'open', index: true },
  },
  { timestamps: true },
);

ReportSchema.index({ photoId: 1, reporterIpHash: 1 }, { unique: true });
ReportSchema.index({ status: 1, createdAt: -1 });

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;
