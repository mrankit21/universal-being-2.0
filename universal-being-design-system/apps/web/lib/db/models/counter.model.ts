/**
 * Generic atomic counter (Step 8C, Part 7 — Invoice Numbering).
 *
 * A single-purpose collection: `{ _id: "invoice:2026", seq: 42 }`. Invoice
 * numbers must never collide or skip under concurrent bookings, so the
 * increment happens via `findOneAndUpdate` with `$inc` — atomic at the
 * MongoDB level, no read-then-write race regardless of how many payments
 * are being verified at once.
 */
import { Schema, model, models, type Model, type Document } from "mongoose";

export interface CounterDocument extends Omit<Document, "_id"> {
  _id: string;
  seq: number;
}

const CounterSchema = new Schema<CounterDocument>({
  _id: { type: String, required: true },
  seq: { type: Number, required: true, default: 0 },
});

export const CounterModel: Model<CounterDocument> =
  models.Counter || model<CounterDocument>("Counter", CounterSchema);

/** Atomically returns the next sequence number for `key`, creating the
 * counter at 1 if it doesn't exist yet. */
export async function nextSequence(key: string): Promise<number> {
  const doc = await CounterModel.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  return doc.seq;
}
