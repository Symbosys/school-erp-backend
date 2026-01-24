import { z } from "zod";

/**
 * Zod Schema for Section Creation
 */
export const createSectionSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  classId: z.string().uuid("Invalid class ID"),
  name: z.string().min(1, "Section name is required").max(50, "Section name is too long"),
  capacity: z.number().int("Capacity must be an integer").min(1, "Capacity must be at least 1").optional(),
  roomNumber: z.string().max(50, "Room number is too long").optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Section Update
 */
export const updateSectionSchema = z.object({
  name: z.string().min(1, "Section name is required").max(50, "Section name is too long").optional(),
  capacity: z.number().int("Capacity must be an integer").min(1, "Capacity must be at least 1").optional(),
  roomNumber: z.string().max(50, "Room number is too long").optional().nullable(),
  isActive: z.boolean().optional(),
});

export type CreateSectionInput = z.infer<typeof createSectionSchema>;
export type UpdateSectionInput = z.infer<typeof updateSectionSchema>;
