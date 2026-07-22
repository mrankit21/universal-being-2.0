/**
 * Bootstrap script: creates the first Admin user directly in MongoDB.
 * Needed because User Management itself lives behind admin auth — there
 * must be one way to create the very first account outside the API.
 *
 * Usage:
 *   MONGODB_URI="mongodb+srv://..." node scripts/create-admin.mjs \
 *     --name "Ankit" --email admin@universalbeing.in --password "changeme123"
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith("--")) pairs.push([arg.slice(2), all[i + 1]]);
    return pairs;
  }, [])
);

const { name, email, password } = args;

if (!name || !email || !password) {
  console.error('Usage: node scripts/create-admin.mjs --name "Your Name" --email you@example.com --password "yourpassword"');
  process.exit(1);
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("Set MONGODB_URI in your environment before running this script.");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    passwordHash: String,
    role: { type: String, enum: ["admin", "manager", "editor"], default: "admin" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

async function main() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.models.User || mongoose.model("User", UserSchema);

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    console.log(`A user with email ${email} already exists (role: ${existing.role}). Nothing changed.`);
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ name, email: email.toLowerCase(), passwordHash, role: "admin", active: true });
  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
