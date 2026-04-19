import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPhoto extends Document {
  cloudinaryId: string;
  url: string;
  uploaderIp: string;
  totalScore: number;
  voteCount: number;
  average: number;
  voters: string[];          // IP listesi — tekrar oylama engeli
  isChampion: boolean;       // dünün şampiyonu mu?
  championDate: string | null; // 'YYYY-MM-DD'
  createdAt: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    cloudinaryId: { type: String, required: true },
    url:          { type: String, required: true },
    uploaderIp:   { type: String, required: true },
    totalScore:   { type: Number, default: 0 },
    voteCount:    { type: Number, default: 0 },
    average:      { type: Number, default: 0 },
    voters:       { type: [String], default: [] },
    isChampion:   { type: Boolean, default: false },
    championDate: { type: String, default: null },
  },
  { timestamps: true }
);

// Kolay lider sorgusu için index
PhotoSchema.index({ average: -1, voteCount: -1 });

const Photo: Model<IPhoto> =
  mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);

export default Photo;
