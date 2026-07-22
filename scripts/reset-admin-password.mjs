/**
 * One-off fix: the `predev` seed script (seed-dev-admin.mjs) only ever
 * *creates* an admin if none exists -- it never updates an existing one's
 * password. So changing DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD / DEV_ADMIN_NAME
 * in .env.local after an admin already exists has no effect on login.
 *
 * This script updates the existing admin account's password (and name) to
 * match whatever is currently in .env.local. Run it once whenever you want
 * to change the dev admin's password.
 *
 * Run: node scripts/reset-admin-password.mjs
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env.local");

try {
  process.loadEnvFile(envPath);
} catch {
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
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI || MONGODB_URI.includes("<user>")) {
  console.error("[reset-admin-password] MONGODB_URI not set in .env.local.");
  process.exit(1);
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

  const email = (process.env.DEV_ADMIN_EMAIL || "admin@universalbeing.dev").toLowerCase();
  const password = process.env.DEV_ADMIN_PASSWORD || "DevAdmin123!";
  const name = process.env.DEV_ADMIN_NAME || "Dev Admin";

  const existingAdmin = await User.findOne({ role: "admin" });
  if (!existingAdmin) {
    console.log("[reset-admin-password] No admin found — run `npm run dev` once, the normal seed script will create one.");
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  existingAdmin.email = email;
  existingAdmin.passwordHash = passwordHash;
  existingAdmin.name = name;
  await existingAdmin.save();

  console.log("\n[reset-admin-password] ─────────────────────────────────────────");
  console.log("[reset-admin-password] Updated admin account:");
  console.log(`[reset-admin-password]   Email:    ${email}`);
  console.log(`[reset-admin-password]   Password: ${password}`);
  console.log("[reset-admin-password] ─────────────────────────────────────────\n");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("[reset-admin-password] Failed:", err.message);
  process.exit(1);
});
