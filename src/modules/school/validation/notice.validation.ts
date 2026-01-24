import { z } from "zod";

/**
 * Zod Schema for Creating Notice
 * Handles FormData inputs where booleans/JSON might be strings
 */
export const createNoticeSchema = z.object({
  schoolId: z.string().uuid("Invalid School ID"),
  title: z.string().min(1, "Title is required").max(255, "Title is too long"),
  content: z.string().min(1, "Content is required"),
  type: z.enum(["GENERAL", "EVENT", "HOLIDAY", "EXAM", "EMERGENCY"]).default("GENERAL"),
  priority: z.enum(["NORMAL", "HIGH", "URGENT"]).default("NORMAL"),
  
  // Preprocess to handle string "true"/"false" from FormData
  forStudents: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  forParents: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  forTeachers: z.preprocess((val) => val === 'true' || val === true, z.boolean().default(false)),
  
  // Handle stringified JSON for targetClassIds
  targetClassIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return [];
      }
    }
    return val;
  }, z.array(z.string()).optional()),
  
  postedBy: z.string().optional(),
});

/**
 * Zod Schema for Updating Notice
 */
export const updateNoticeSchema = z.object({
  title: z.string().max(255).optional(),
  content: z.string().optional(),
  type: z.enum(["GENERAL", "EVENT", "HOLIDAY", "EXAM", "EMERGENCY"]).optional(),
  priority: z.enum(["NORMAL", "HIGH", "URGENT"]).optional(),
  forStudents: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  forParents: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  forTeachers: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
  targetClassIds: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch {
        return undefined;
      }
    }
    return val;
  }, z.array(z.string()).optional()),
  isActive: z.preprocess((val) => val === 'true' || val === true, z.boolean().optional()),
});

export type CreateNoticeInput = z.infer<typeof createNoticeSchema>;
export type UpdateNoticeInput = z.infer<typeof updateNoticeSchema>;
