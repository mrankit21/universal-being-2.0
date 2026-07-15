import { z } from "zod";

/** Customer-facing refund request (Part 6). Amount is optional — if
 * omitted, the server treats it as a full-refund request for the amount
 * actually paid; the admin can adjust before approving. */
export const refundRequestSchema = z.object({
  customerEmail: z.string().email(),
  reason: z.string().min(3).max(1000),
  amount: z.number().positive().optional(),
});
export type RefundRequestInput = z.infer<typeof refundRequestSchema>;

export const refundUpdateSchema = z.object({
  status: z.enum(["approved", "rejected", "processed"]),
  note: z.string().max(1000).optional(),
  amount: z.number().positive().optional(), // admin may adjust the amount on approval
});
export type RefundUpdateInput = z.infer<typeof refundUpdateSchema>;
