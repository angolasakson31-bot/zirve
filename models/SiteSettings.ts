import mongoose from 'mongoose';

const SiteSettingsSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
});

export default mongoose.models.SiteSettings ??
  mongoose.model('SiteSettings', SiteSettingsSchema);
