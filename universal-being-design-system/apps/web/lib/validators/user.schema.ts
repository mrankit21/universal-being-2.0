import { z } from "zod";

export const userCreateSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["admin", "manager", "editor"]),
  active: z.boolean().default(true),
});

export const userUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  role: z.enum(["admin", "manager", "editor"]).optional(),
  active: z.boolean().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// --- Auth: OTP + secret-code login schemas ---
// (`app/api/auth/otp/request`, `app/api/auth/otp/verify`,
// `app/api/auth/secret-code`). Mirrors the fields those routes already
// destructure — validation only, no change to route behavior.

export const otpRequestSchema = z.object({
  mobile: z.string().min(1, "Mobile number is required"),
});

export const otpVerifySchema = z.object({
  mobile: z.string().min(1, "Mobile number is required"),
  code: z.string().length(6, "Code must be 6 digits"),
});

export const secretCodeLoginSchema = z.object({
  code: z.string().min(1, "Code is required"),
});

export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type UserUpdateInput = z.infer<typeof userUpdateSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type OtpRequestInput = z.infer<typeof otpRequestSchema>;
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>;
export type SecretCodeLoginInput = z.infer<typeof secretCodeLoginSchema>;
