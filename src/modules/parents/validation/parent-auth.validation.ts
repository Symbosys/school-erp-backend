import { z } from "zod";

export const parentLoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const parentUpdateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
});

export type ParentLoginInput = z.infer<typeof parentLoginSchema>;
export type ParentUpdateFcmTokenInput = z.infer<typeof parentUpdateFcmTokenSchema>;
