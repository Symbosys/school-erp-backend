import { z } from "zod";

export const teacherLoginSchema = z.object({
  email: z.string().min(1, "Email or Employee ID is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const teacherUpdateFcmTokenSchema = z.object({
  fcmToken: z.string().min(1, "FCM token is required"),
});

export type TeacherLoginInput = z.infer<typeof teacherLoginSchema>;
export type TeacherUpdateFcmTokenInput = z.infer<typeof teacherUpdateFcmTokenSchema>;
