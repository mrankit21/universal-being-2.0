/**
 * Customer Mongoose model — public site accounts (signup/login from the
 * header's login modal), kept entirely separate from `UserModel`
 * (`lib/db/models/user.model.ts`), which is admin-panel-only and has its
 * own roles/RBAC. A customer never has an admin role and an admin login
 * never touches this collection — two independent auth systems sharing
 * only the same password-hashing helper (`lib/auth/password.ts`).
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export interface CustomerDocument extends Document {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  active: boolean;
  lastLoginAt?: string;
  resetTokenHash?: string;
  resetTokenExpiresAt?: Date;
  createdAt: string;
  updatedAt: string;
}

const CustomerSchema = new Schema<CustomerDocument>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    passwordHash: { type: String, required: true },
    active: { type: Boolean, default: true },
    lastLoginAt: { type: String },
    // Forgot-password flow (`/api/customer/auth/forgot-password` +
    // `/reset-password`): only ever stores a bcrypt hash of the reset
    // token, never the token itself — same reasoning as `passwordHash`.
    resetTokenHash: { type: String, select: false },
    resetTokenExpiresAt: { type: Date, select: false },
  },
  { timestamps: true }
);

export const CustomerModel: Model<CustomerDocument> =
  models.Customer || model<CustomerDocument>("Customer", CustomerSchema);
