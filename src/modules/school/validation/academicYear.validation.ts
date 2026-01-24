import { z } from "zod";

/**
 * Zod Schema for Academic Year Creation
 */
export const createAcademicYearSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Academic year name is required").max(100, "Name is too long"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date format",
  }),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date format",
  }),
  isCurrent: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  const start = new Date(data.startDate);
  const end = new Date(data.endDate);
  return start < end;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

/**
 * Zod Schema for Academic Year Update
 */
export const updateAcademicYearSchema = z.object({
  name: z.string().min(1, "Academic year name is required").max(100, "Name is too long").optional(),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid start date format",
  }).optional(),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid end date format",
  }).optional(),
  isCurrent: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start < end;
  }
  return true;
}, {
  message: "End date must be after start date",
  path: ["endDate"],
});

/**
 * Zod Schema for Setting Current Year
 */
export const setCurrentYearSchema = z.object({
  isCurrent: z.boolean(),
});

export type CreateAcademicYearInput = z.infer<typeof createAcademicYearSchema>;
export type UpdateAcademicYearInput = z.infer<typeof updateAcademicYearSchema>;
export type SetCurrentYearInput = z.infer<typeof setCurrentYearSchema>;
