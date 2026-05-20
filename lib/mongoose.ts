import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) throw new Error('MONGODB_URI is not defined');

let cached = (global as any).__mongoose;
if (!cached) cached = (global as any).__mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 5000,
    }).then(m => m).catch(err => {
      cached.promise = null;
      throw err;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}
