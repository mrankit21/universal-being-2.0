/**
 * MongoDB connection singleton (Architecture §3/§7 — "Single source of truth:
 * MongoDB"). Next.js Route Handlers under `app/api/**` are today's BFF layer;
 * when the standalone Express server lands, this file's connection logic
 * moves verbatim — the Mongoose models in `lib/db/models/*` are written to be
 * imported by either runtime unchanged.
 *
 * Reuses a single cached connection across hot-reloads in dev and across
 * warm serverless invocations in prod (the standard Next.js + Mongoose
 * pattern — without this, each request would open a new connection and
 * exhaust the MongoDB connection pool).
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var __ubMongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.__ubMongooseCache ?? { conn: null, promise: null };
global.__ubMongooseCache = cached;

/**
 * Lazily connects to MongoDB. Throws a clear, actionable error if
 * `MONGODB_URI` is not configured rather than failing with an opaque
 * Mongoose error — this is the one function every API route calls first.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to your environment (.env.local in dev, " +
        "your host's environment settings in prod) to enable the database-backed " +
        "Admin Panel and APIs. See .env.example."
    );
  }

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .then((m) => m);
  }

  try {
    cached.conn = await cached.promise;
  } catch (err) {
    cached.promise = null;
    throw err;
  }

  return cached.conn;
}

/** True when a MONGODB_URI is configured, without opening a connection.
 * Used by `lib/api/*` to decide whether to hit the DB-backed API routes or
 * fall back to local seed data (keeps the marketing site runnable in dev
 * without a database, per the existing seed-data developer experience). */
export function isDatabaseConfigured(): boolean {
  return Boolean(MONGODB_URI);
}
