import { z } from "zod";

/**
 * Schema for School Login
 */
export const schoolLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

/**
 * Schema for Setting/Updating Password
 */
export const setPasswordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SchoolLoginInput = z.infer<typeof schoolLoginSchema>;
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;
