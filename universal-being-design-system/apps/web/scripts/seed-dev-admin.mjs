/**
 * Dev-only admin auto-seed. Runs as a plain Node script BEFORE `next dev`
 * starts (see the "predev" script in package.json) — deliberately kept
 * outside Next.js's webpack/edge bundling pipeline. An earlier attempt did
 * this from `instrumentation.ts`, but Next.js also compiles that file for
 * the Edge runtime, and in dev mode the unreachable-at-runtime `mongoose`/
 * `mongodb` import still gets bundled for Edge, which fails to resolve
 * Node core modules like `net` ("Module not found: Can't resolve 'net'").
 * A standalone script avoids that entirely.
 *
 * Safe by design:
 *  - Never runs in production (only wired into the "predev" script).
 *  - Does nothing if MONGODB_URI isn't set (logs a note and exits 0 so
 *    `next dev` still starts — the public site works without a DB).
 *  - Never overwrites or touches an existing user; only creates one if no
 *    admin exists yet.
 *  - Set DISABLE_DEV_ADMIN_SEED=true to skip entirely.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

// Node 20.6+ has a built-in .env loader — no extra dependency needed.
try {
  process.loadEnvFile(envPath);
} catch {
  // .env.local missing or Node too old for loadEnvFile — fall back to a
  // tiny manual parser so this script still works either way.
  try {
    const fs = await import("node:fs");
    const lines = fs.readFileSync(envPath, "utf8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch {
    console.warn("[dev-admin-seed] Could not read .env.local — relying on shell environment variables only.");
  }
}

if (process.env.DISABLE_DEV_ADMIN_SEED === "true") {
  console.log("[dev-admin-seed] Skipped (DISABLE_DEV_ADMIN_SEED=true).");
  process.exit(0);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI.includes("<user>")) {
  console.warn(
    "[dev-admin-seed] MONGODB_URI is not set (or still a placeholder) in .env.local — " +
      "skipping admin auto-seed. The Admin Panel will need a real MongoDB connection string."
  );
  process.exit(0);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: { type: String, enum: ["admin", "manager", "editor"], default: "editor" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

async function main() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const existingAdmin = await User.findOne({ role: "admin" });
  if (existingAdmin) {
    console.log(`[dev-admin-seed] Admin account already exists (${existingAdmin.email}) — skipping.`);
    return;
  }

  const email = (process.env.DEV_ADMIN_EMAIL || "admin@universalbeing.dev").toLowerCase();
  const password = process.env.DEV_ADMIN_PASSWORD || "DevAdmin123!";
  const name = process.env.DEV_ADMIN_NAME || "Dev Admin";

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email, passwordHash, role: "admin", active: true });

  console.log("\n[dev-admin-seed] ─────────────────────────────────────────");
  console.log("[dev-admin-seed] Created development Administrator account:");
  console.log(`[dev-admin-seed]   Email:    ${email}`);
  console.log(`[dev-admin-seed]   Password: ${password}`);
  console.log("[dev-admin-seed] ─────────────────────────────────────────\n");
}

main()
  .catch((err) => {
    console.error("[dev-admin-seed] Failed to seed development admin account:", err.message);
    // Don't block `next dev` from starting just because seeding failed.
  })
  .finally(() => mongoose.disconnect());
