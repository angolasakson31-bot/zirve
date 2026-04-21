import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPhoto extends Document {
  cloudinaryId: string;
  url: string;
  uploaderIp: string;
  contactInfo?: string;
  totalScore: number;
  voteCount: number;
  average: number;
  likeCount: number;
  dislikeCount: number;
  voters: string[];
  isChampion: boolean;
  championDate: string | null;
  isArchived: boolean;
  trackingCode: string;
  fileHash: string;
  createdAt: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    cloudinaryId:  { type: String, required: true },
    url:           { type: String, required: true },
    uploaderIp:    { type: String, required: true },
    contactInfo:   { type: String, default: '' },
    totalScore:    { type: Number, default: 0 },
    voteCount:     { type: Number, default: 0 },
    average:       { type: Number, default: 0 },
    likeCount:     { type: Number, default: 0 },
    dislikeCount:  { type: Number, default: 0 },
    voters:        { type: [String], default: [] },
    isChampion:    { type: Boolean, default: false },
    championDate:  { type: String, default: null },
    isArchived:    { type: Boolean, default: false },
    trackingCode:  { type: String, required: true, unique: true },
    fileHash:      { type: String, required: true },
  },
  { timestamps: true }
);

PhotoSchema.index({ average: -1, voteCount: -1 });
PhotoSchema.index({ trackingCode: 1 });

const Photo: Model<IPhoto> =
  mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);

export default Photo;
