/**
 * Admin User Mongoose model (requirement #10/#11). Passwords are always
 * stored as bcrypt hashes (`lib/auth/password.ts`) — this file never
 * receives or persists a plaintext password. `role` drives the permission
 * matrix in `lib/auth/rbac.ts`.
 */
import mongoose, { Schema, model, type Model, type Document } from "mongoose";
const models = mongoose.models;

export type AdminRole = "admin" | "manager" | "editor";

export interface UserDocument extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AdminRole;
  active: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

const UserSchema = new Schema<UserDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["admin", "manager", "editor"], default: "editor" },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: String },
  },
  { timestamps: true }
);

export const UserModel: Model<UserDocument> = models.User || model<UserDocument>("User", UserSchema);
