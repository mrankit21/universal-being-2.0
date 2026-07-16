/**
 * Shared helper for Phase 4 seed scripts (scripts/seed-trips.ts,
 * scripts/seed-destinations.ts, ...). Loads `.env.local` the same way
 * `scripts/seed-dev-admin.mjs` does, then connects Mongoose using the same
 * MONGODB_URI the app itself uses (lib/db/mongoose.ts).
 *
 * Run with: npx tsx scripts/seed-trips.ts
 * (tsx resolves the "@/*" path alias from tsconfig.json automatically.)
 */
import mongoose from "mongoose";
import path from "node:path";
import { fileURLToPath } from "node:url";

export async function loadEnv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.join(__dirname, "..", ".env.local");

  try {
    // Node 20.6+ built-in loader (same approach as seed-dev-admin.mjs).
    process.loadEnvFile(envPath);
  } catch {
    try {
      const fs = await import("node:fs");
      const lines = fs.readFileSync(envPath, "utf8").split("\n");
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        const eq = trimmed.indexOf("=");
        if (eq === -1) continue;
        const key = trimmed.slice(0, eq).trim();
        const value = trimmed
          .slice(eq + 1)
          .trim()
          .replace(/^["']|["']$/g, "");
        if (!(key in process.env)) process.env[key] = value;
      }
    } catch {
      console.warn("[seed-utils] Could not read .env.local — relying on shell environment variables only.");
    }
  }
}

export async function connect(): Promise<void> {
  await loadEnv();
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI || MONGODB_URI.includes("<user>")) {
    console.error(
      "[seed] MONGODB_URI is not set (or still a placeholder) in .env.local — cannot seed. " +
        "Add a real connection string first."
    );
    process.exit(1);
  }
  await mongoose.connect(MONGODB_URI);
  console.log("[seed] Connected to MongoDB.");
}

export async function disconnect(): Promise<void> {
  await mongoose.disconnect();
  console.log("[seed] Disconnected.");
}