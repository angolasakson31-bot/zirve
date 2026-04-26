import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IComment {
  text: string;
  userHash: string;
  createdAt: Date;
}

export interface IPhoto extends Document {
  cloudinaryId: string;
  url: string;
  albumUrls: string[];
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
  comments: IComment[];
  createdAt: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    cloudinaryId:  { type: String, required: true },
    url:           { type: String, required: true },
    albumUrls:     { type: [String], default: [] },
    uploaderIp:    { type: String, required: true },
    contactInfo:   { type: String, default: '' },
    totalScore:    { type: Number, default: 0 },
    voteCount:     { type: Number, default: 0 },
    average:       { type: Number, default: 0 },
    likeCount:     { type: Number, default: 0 },
    dislikeCount:  { type: Number, default: 0 },
    voters:        { type: [String], default: [] },
    comments:      {
      type: [{
        text:      { type: String, required: true, maxlength: 60 },
        userHash:  { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
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
