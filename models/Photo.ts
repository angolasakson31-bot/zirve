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
  uploaderDevice: string;
  contactInfo?: string;
  totalScore: number;
  voteCount: number;
  average: number;
  likeCount: number;
  dislikeCount: number;
  voters: string[];
  deviceVoters: string[];
  isChampion: boolean;
  championDate: string | null;
  isArchived: boolean;
  trackingCode: string;
  fileHash: string;
  blurPlaceholder: string;
  comments: IComment[];
  // Şikâyet ve moderasyon
  reportCount: number;
  isHidden: boolean;
  moderationStatus: 'pending' | 'approved' | 'rejected';
  moderationLabels: string[];
  createdAt: Date;
}

const PhotoSchema = new Schema<IPhoto>(
  {
    cloudinaryId:  { type: String, required: true },
    url:           { type: String, required: true },
    albumUrls:     { type: [String], default: [] },
    uploaderIp:     { type: String, required: true },
    uploaderDevice: { type: String, default: '' },
    contactInfo:    { type: String, default: '' },
    totalScore:    { type: Number, default: 0 },
    voteCount:     { type: Number, default: 0 },
    average:       { type: Number, default: 0 },
    likeCount:     { type: Number, default: 0 },
    dislikeCount:  { type: Number, default: 0 },
    voters:        { type: [String], default: [] },
    deviceVoters:  { type: [String], default: [] },
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
    isArchived:       { type: Boolean, default: false },
    trackingCode:     { type: String, required: true, unique: true },
    fileHash:         { type: String, required: true },
    blurPlaceholder:  { type: String, default: '' },
    reportCount:      { type: Number, default: 0 },
    isHidden:         { type: Boolean, default: false },
    moderationStatus: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    moderationLabels: { type: [String], default: [] },
  },
  { timestamps: true }
);

PhotoSchema.index({ average: -1, voteCount: -1 });
PhotoSchema.index({ trackingCode: 1 });
PhotoSchema.index({ uploaderIp: 1 });
PhotoSchema.index({ uploaderDevice: 1 });
PhotoSchema.index({ fileHash: 1 });
PhotoSchema.index({ isArchived: 1, createdAt: -1 });
// Unique partial index — aynı anda iki document'in isChampion=true olmasını
// MongoDB seviyesinde engeller. Eşzamanlı vote'larda split-brain'i önler.
// isChampion=false olan dokümanlar bu indexte yer almaz (partialFilterExpression).
PhotoSchema.index(
  { isChampion: 1 },
  { unique: true, partialFilterExpression: { isChampion: true } },
);
PhotoSchema.index({ championDate: 1 });
PhotoSchema.index({ deviceVoters: 1 });
PhotoSchema.index({ isHidden: 1 });
PhotoSchema.index({ moderationStatus: 1 });
// random/has-new sorgularının hızlanması için compound index
PhotoSchema.index({ isArchived: 1, createdAt: -1, uploaderIp: 1 });

const Photo: Model<IPhoto> =
  mongoose.models.Photo || mongoose.model<IPhoto>('Photo', PhotoSchema);

export default Photo;
