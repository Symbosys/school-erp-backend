import { z } from "zod";

/**
 * Zod Schema for Creating Parent
 */
export const createParentSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z.string().email("Invalid email format").max(255, "Email is too long"),
  phone: z.string().min(1, "Phone number is required").max(20, "Phone number is too long"),
  occupation: z.string().max(100, "Occupation is too long").optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required").max(100, "City is too long"),
  state: z.string().min(1, "State is required").max(100, "State is too long"),
  pincode: z.string().min(1, "Pincode is required").max(10, "Pincode is too long"),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Updating Parent
 */
export const updateParentSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(20).optional(),
  occupation: z.string().max(100).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  isActive: z.boolean().optional(),
});

export type CreateParentInput = z.infer<typeof createParentSchema>;
export type UpdateParentInput = z.infer<typeof updateParentSchema>;
