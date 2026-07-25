/**
 * Read-only auth diagnostic. Connects with the SAME env-loading logic as
 * `predev`/Next.js and prints exactly what the login route will see:
 *   - which MONGODB_URI / database / collection is actually being used
 *   - every user in that collection (email, role, active, hash prefix,
 *     mobile) without ever printing a full password hash
 *   - whether DEV_ADMIN_EMAIL / DEV_ADMIN_PASSWORD actually bcrypt-match
 *     the stored user, so you know for certain whether the credentials in
 *     .env.local / the README will work — instead of guessing.
 *
 * Usage:
 *   node scripts/diagnose-auth.mjs
 *   npm run diagnose:auth
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnvFile(filename) {
  const envPath = path.join(__dirname, "..", filename);
  try {
    process.loadEnvFile(envPath);
    return true;
  } catch {
    try {
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
      return true;
    } catch {
      return false;
    }
  }
}

// Mirror Next.js's real env precedence (highest wins), not just .env.local,
// so this script can catch "a stray .env is silently overriding
// .env.local" — one of the most common causes of "it worked in the seed
// script but not in the app" style bugs.
const nodeEnv = process.env.NODE_ENV || "development";
const filesLowToHigh = [".env", `.env.${nodeEnv}`, ".env.local", `.env.${nodeEnv}.local`];
const loaded = [];
for (const f of filesLowToHigh) {
  if (loadEnvFile(f)) loaded.push(f);
}

console.log("========================================================");
console.log(" Universal Being — Auth Diagnostic");
console.log("========================================================");
console.log(`NODE_ENV:            ${nodeEnv}`);
console.log(`Env files found:     ${loaded.length ? loaded.join(", ") : "(none — using shell env only)"}`);

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.log("\n❌ MONGODB_URI is not set in any env file or the shell environment.");
  console.log("   Add it to .env.local, then re-run this script.");
  process.exit(1);
}

const maskedUri = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, "//$1:****@");
console.log(`MONGODB_URI:         ${maskedUri}`);

const DEV_ADMIN_EMAIL = (process.env.DEV_ADMIN_EMAIL || "admin@universalbeing.dev").toLowerCase();
const DEV_ADMIN_PASSWORD = process.env.DEV_ADMIN_PASSWORD || "DevAdmin123!";
console.log(`DEV_ADMIN_EMAIL:      ${DEV_ADMIN_EMAIL}`);
console.log(`DEV_ADMIN_PASSWORD:   ${"*".repeat(DEV_ADMIN_PASSWORD.length)} (${DEV_ADMIN_PASSWORD.length} chars)`);

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: { type: String, enum: ["admin", "manager", "editor"], default: "editor" },
    active: { type: Boolean, default: true },
    mobile: String,
  },
  { timestamps: true }
);

async function main() {
  await mongoose.connect(MONGODB_URI);
  const conn = mongoose.connection;
  console.log(`\nConnected database:  "${conn.name}"`);
  console.log(`Connected host:      ${conn.host}`);

  const User = mongoose.models.User || mongoose.model("User", UserSchema);
  const collectionName = User.collection.collectionName;
  console.log(`Users collection:    "${collectionName}"`);

  const count = await User.countDocuments();
  console.log(`\nTotal user documents in this collection: ${count}`);

  if (count === 0) {
    console.log("\n❌ ROOT CAUSE FOUND: the users collection is empty.");
    console.log("   The predev seed script has not run against this database yet (or it");
    console.log("   ran against a different MONGODB_URI). Run `npm run dev` once, or");
    console.log("   `node scripts/seed-dev-admin.mjs` directly, then re-run this diagnostic.");
    await mongoose.disconnect();
    return;
  }

  const users = await User.find({}).lean();
  console.log("\nAll users found:");
  for (const u of users) {
    console.log("  ---------------------------------------------");
    console.log(`  email:        ${u.email}`);
    console.log(`  role:         ${u.role}`);
    console.log(`  active:       ${u.active}`);
    console.log(`  mobile:       ${u.mobile || "(none)"}`);
    console.log(`  hash prefix:  ${(u.passwordHash || "").slice(0, 7)}... (bcrypt hashes start with $2a$/$2b$)`);
  }

  const target = users.find((u) => u.email === DEV_ADMIN_EMAIL);
  console.log("\n--------------------------------------------------------");
  if (!target) {
    console.log(`❌ ROOT CAUSE FOUND: no user with email "${DEV_ADMIN_EMAIL}" exists in`);
    console.log(`   this collection. Whatever admin account WAS seeded uses a different`);
    console.log(`   email than the one in DEV_ADMIN_EMAIL / your login attempt.`);
    if (users.length) {
      console.log(`   → The valid email for this database is: ${users.find((u) => u.role === "admin")?.email ?? users[0].email}`);
    }
    await mongoose.disconnect();
    return;
  }

  if (!target.active) {
    console.log(`❌ ROOT CAUSE FOUND: user "${DEV_ADMIN_EMAIL}" exists but active=false.`);
    console.log("   The login route explicitly rejects inactive users.");
    await mongoose.disconnect();
    return;
  }

  const passwordMatches = await bcrypt.compare(DEV_ADMIN_PASSWORD, target.passwordHash || "");
  if (!passwordMatches) {
    console.log(`❌ ROOT CAUSE FOUND: user "${DEV_ADMIN_EMAIL}" exists and is active, but`);
    console.log("   its stored passwordHash does NOT match DEV_ADMIN_PASSWORD.");
    console.log("   This happens when an admin was created earlier with a different");
    console.log("   password (a previous manual run, a typo, or an old seed) and the");
    console.log('   seed script\'s old "skip if ANY admin exists" check left it in place.');
    console.log("   → Fixed seed script (this patch) self-heals this automatically on");
    console.log("     the next `npm run dev`. Or run: node scripts/seed-dev-admin.mjs");
    await mongoose.disconnect();
    return;
  }

  console.log(`✅ No issue found. "${DEV_ADMIN_EMAIL}" / the configured DEV_ADMIN_PASSWORD`);
  console.log("   is valid and should log in successfully against this exact database.");
  console.log("   If login still fails in the browser, the running `next dev` process");
  console.log("   is almost certainly pointed at a DIFFERENT MONGODB_URI than this");
  console.log("   script resolved above (check for a stray .env / .env.development.local,");
  console.log("   or restart the dev server after editing .env.local — Next.js only");
  console.log("   reads env files at process start).");

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("\n❌ Diagnostic failed with an error:", err.message);
  process.exit(1);
});
