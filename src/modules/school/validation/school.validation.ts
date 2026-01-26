import { z } from "zod";

/**
 * Zod Schema for School Onboarding
 */
export const onboardSchoolSchema = z.object({
  name: z.string().min(1, "School name is required").max(255, "School name is too long"),
  code: z.string().min(1, "School code is required").max(50, "School code is too long"),
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
  phone: z.string().min(1, "Phone number is required").max(20, "Phone number is too long"),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required").max(100, "City name is too long"),
  state: z.string().min(1, "State is required").max(100, "State name is too long"),
  country: z.string().min(1, "Country is required").max(100, "Country name is too long"),
  pincode: z.string().min(1, "Pincode is required").max(10, "Pincode is too long"),
  establishedDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date format",
  }),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  subscriptionPlan: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).optional(),
  subscriptionStart: z.string().optional(),
  subscriptionEnd: z.string().optional(),
  maxStudents: z.number().int().positive("Max students must be positive").optional(),
  maxTeachers: z.number().int().positive("Max teachers must be positive").optional(),
});

/**
 * Zod Schema for School Update
 */
export const updateSchoolSchema = z.object({
  name: z.string().min(1, "School name is required").max(255, "School name is too long").optional(),
  email: z.string().email("Invalid email format").max(255, "Email is too long").optional(),
  password: z.string().min(8, "Password must be at least 8 characters long").optional(),
  phone: z.string().max(20, "Phone number is too long").optional(),
  address: z.string().optional(),
  city: z.string().max(100, "City name is too long").optional(),
  state: z.string().max(100, "State name is too long").optional(),
  country: z.string().max(100, "Country name is too long").optional(),
  pincode: z.string().max(10, "Pincode is too long").optional(),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
  subscriptionPlan: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).optional(),
  subscriptionStart: z.string().optional(),
  subscriptionEnd: z.string().optional(),
  maxStudents: z.number().int().positive("Max students must be positive").optional(),
  maxTeachers: z.number().int().positive("Max teachers must be positive").optional(),
});

/**
 * Zod Schema for Subscription Update
 */
export const updateSubscriptionSchema = z.object({
  subscriptionStatus: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"]).optional(),
  subscriptionPlan: z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).optional(),
  subscriptionStart: z.string().optional(),
  subscriptionEnd: z.string().optional(),
  maxStudents: z.number().int().positive("Max students must be positive").optional(),
  maxTeachers: z.number().int().positive("Max teachers must be positive").optional(),
});

/**
 * Zod Schema for Toggle Status
 */
export const toggleStatusSchema = z.object({
  isActive: z.boolean(),
});

export type OnboardSchoolInput = z.infer<typeof onboardSchoolSchema>;
export type UpdateSchoolInput = z.infer<typeof updateSchoolSchema>;
export type UpdateSubscriptionInput = z.infer<typeof updateSubscriptionSchema>;
export type ToggleStatusInput = z.infer<typeof toggleStatusSchema>;
