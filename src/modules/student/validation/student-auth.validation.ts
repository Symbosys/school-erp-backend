import { z } from "zod";

export const studentLoginSchema = z.object({
  email: z.string().email("Invalid email address").trim(),
  password: z.string().min(6, "Password must be at least 6 characters").trim(),
});

export const studentUpdateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required").trim(),
});

export type StudentLoginInput = z.infer<typeof studentLoginSchema>;
export type StudentUpdateFcmTokenInput = z.infer<typeof studentUpdateFcmTokenSchema>;
