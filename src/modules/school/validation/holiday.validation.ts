import { z } from "zod";
import { HolidayType } from "../../../../generated/prisma/enums";

// Create Holiday
export const createHolidaySchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  name: z.string().min(1, "Holiday name is required").max(200, "Name too long"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  type: z.nativeEnum(HolidayType),
  description: z.string().max(1000, "Description too long").optional(),
  isActive: z.boolean().optional(),
});

// Update Holiday
export const updateHolidaySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

// Bulk Create Holidays
export const bulkCreateHolidaysSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  holidays: z.array(
    z.object({
      name: z.string().min(1, "Holiday name is required").max(200, "Name too long"),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
      type: z.nativeEnum(HolidayType),
      description: z.string().max(1000, "Description too long").optional(),
    })
  ).min(1, "At least one holiday is required"),
});
