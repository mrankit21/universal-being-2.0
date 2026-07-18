import { z } from "zod";

export const customerSignupSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const customerForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const customerResetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type CustomerSignupInput = z.infer<typeof customerSignupSchema>;
export type CustomerLoginInput = z.infer<typeof customerLoginSchema>;
export type CustomerForgotPasswordInput = z.infer<typeof customerForgotPasswordSchema>;
export type CustomerResetPasswordInput = z.infer<typeof customerResetPasswordSchema>;
