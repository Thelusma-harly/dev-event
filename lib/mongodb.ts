import mongoose, { type ConnectOptions, type Mongoose } from "mongoose";

/**
 * We keep the MongoDB URI in an env var so it can vary per environment
 * (dev/staging/prod) without changing code.
 */

/**
 * In development, Next.js reloads modules on file changes.
 * This cache prevents creating a new connection on every reload.
 */
declare global {
  var mongooseCache:
    | {
        conn: Mongoose | null;
        promise: Promise<Mongoose> | null;
      }
    | undefined;
}

const cached = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.mongooseCache = cached;

export async function connectToDatabase(): Promise<Mongoose> {
  // Reuse existing connection if we already have one.
  if (cached.conn) return cached.conn;

  // Create the connection promise once, then await it everywhere.
  if (!cached.promise) {
    const mongodbUri = process.env.MONGODB_URI;

    if (!mongodbUri) {
      throw new Error(
        "Missing MONGODB_URI environment variable. Set it in .env.local (development) or your deployment environment.",
      );
    }

    const options: ConnectOptions = {
      // Disables buffering so you fail fast when the DB is unavailable.
      bufferCommands: false,
      // Keep a small pool by default; scale based on your traffic profile.
      maxPoolSize: 10,
      // Avoid long hangs when the URI is wrong or the cluster is unreachable.
      serverSelectionTimeoutMS: 5_000,
      family: 4,
    };

    cached.promise = mongoose.connect(mongodbUri, options);
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    // If the initial connection fails, allow retries on the next call.
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}
