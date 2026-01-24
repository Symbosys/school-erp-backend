import { z } from "zod";

/**
 * Zod Schema for Teacher Onboarding
 */
export const onboardTeacherSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  employeeId: z.string().min(1, "Employee ID is required").max(50, "Employee ID is too long"),
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
  phone: z.string().min(1, "Phone number is required").max(20, "Phone number is too long"),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date of birth format",
  }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required").max(100, "City is too long"),
  state: z.string().min(1, "State is required").max(100, "State is too long"),
  pincode: z.string().min(1, "Pincode is required").max(10, "Pincode is too long"),
  qualification: z.string().min(1, "Qualification is required").max(255, "Qualification is too long"),
  specialization: z.string().max(255, "Specialization is too long").optional(),
  experience: z.string().transform((val) => parseInt(val, 10)).or(z.number()).pipe(z.number().int().min(0, "Experience cannot be negative")),
  joiningDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid joining date format",
  }),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Teacher Update
 */
export const updateTeacherSchema = z.object({
  firstName: z.string().max(100, "First name is too long").optional(),
  lastName: z.string().max(100, "Last name is too long").optional(),
  email: z.string().email("Invalid email format").max(255, "Email is too long").optional(),
  phone: z.string().max(20, "Phone number is too long").optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  address: z.string().optional(),
  city: z.string().max(100, "City is too long").optional(),
  state: z.string().max(100, "State is too long").optional(),
  pincode: z.string().max(10, "Pincode is too long").optional(),
  qualification: z.string().max(255, "Qualification is too long").optional(),
  specialization: z.string().max(255, "Specialization is too long").optional(),
  experience: z.number().int().min(0, "Experience cannot be negative").optional(),
  joiningDate: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
  isActive: z.boolean().optional(),
});

export type OnboardTeacherInput = z.infer<typeof onboardTeacherSchema>;
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;
