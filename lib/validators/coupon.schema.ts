import { z } from "zod";

export const couponCreateSchema = z.object({
  code: z.string().min(3).max(32).regex(/^[A-Za-z0-9_-]+$/, "Letters, numbers, - and _ only"),
  description: z.string().max(300).optional(),
  type: z.enum(["percentage", "flat"]),
  value: z.number().positive(),
  minAmount: z.number().min(0).optional(),
  maxDiscount: z.number().positive().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  usageLimit: z.number().int().positive().optional(),
  perUserLimit: z.number().int().positive().optional(),
  tripIds: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});
export type CouponCreateInput = z.infer<typeof couponCreateSchema>;

export const couponUpdateSchema = couponCreateSchema.partial();
export type CouponUpdateInput = z.infer<typeof couponUpdateSchema>;

export const couponValidateSchema = z.object({
  code: z.string().min(1),
  tripId: z.string().min(1),
  customerEmail: z.string().email(),
  amount: z.number().positive(), // the amount the discount would apply against (bookingAmountDue)
});
export type CouponValidateInput = z.infer<typeof couponValidateSchema>;
