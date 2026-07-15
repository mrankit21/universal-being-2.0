/**
 * OTP challenge storage for mobile-number admin login (`/api/auth/otp/*`).
 * Backed by MongoDB rather than an in-process Map so codes stay valid
 * across dev-server hot reloads and across separate serverless invocations
 * in production — an in-memory store would silently break the moment two
 * requests land on different instances.
 *
 * The code itself is never stored in plaintext, mirroring how passwords
 * are handled in `lib/auth/password.ts`.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export interface OtpChallengeDocument extends Document {
  mobile: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt?: Date | null;
  createdAt: string;
  updatedAt: string;
}

const OtpChallengeSchema = new Schema<OtpChallengeDocument>(
  {
    mobile: { type: String, required: true, trim: true, index: true },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    consumedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// TTL index — Mongo automatically deletes expired challenges, so this
// collection never accumulates stale OTPs.
OtpChallengeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const OtpChallengeModel: Model<OtpChallengeDocument> =
  models.OtpChallenge || model<OtpChallengeDocument>("OtpChallenge", OtpChallengeSchema);
