import { z } from "zod";
import { DayOfWeek } from "../../../../generated/prisma/enums";

// Timetable Entry Schema (used within timetable creation)
const timetableEntrySchema = z.object({
  timeSlotId: z.string().uuid("Invalid time slot ID"),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  subjectId: z.string().uuid("Invalid subject ID").nullable().optional(),
  teacherId: z.string().uuid("Invalid teacher ID").nullable().optional(),
  roomNumber: z.string().max(50).nullable().optional(),
});

// Create Timetable (Class-level default)
export const createTimetableSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  classId: z.string().uuid("Invalid class ID"),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  entries: z.array(timetableEntrySchema).optional(),
});

// Create Section Override Timetable
export const createSectionOverrideSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  classId: z.string().uuid("Invalid class ID"),
  sectionId: z.string().uuid("Invalid section ID"),
  name: z.string().min(1, "Name is required").max(200, "Name too long"),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  entries: z.array(timetableEntrySchema).optional(),
});

// Update Timetable
export const updateTimetableSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").nullable().optional(),
  isActive: z.boolean().optional(),
});

// Add Timetable Entry
export const addTimetableEntrySchema = z.object({
  timetableId: z.string().uuid("Invalid timetable ID"),
  timeSlotId: z.string().uuid("Invalid time slot ID"),
  dayOfWeek: z.nativeEnum(DayOfWeek),
  subjectId: z.string().uuid("Invalid subject ID").nullable().optional(),
  teacherId: z.string().uuid("Invalid teacher ID").nullable().optional(),
  roomNumber: z.string().max(50).nullable().optional(),
});

// Update Timetable Entry
export const updateTimetableEntrySchema = z.object({
  subjectId: z.string().uuid("Invalid subject ID").nullable().optional(),
  teacherId: z.string().uuid("Invalid teacher ID").nullable().optional(),
  roomNumber: z.string().max(50).nullable().optional(),
});

// Bulk Add Timetable Entries
export const bulkAddEntriesSchema = z.object({
  timetableId: z.string().uuid("Invalid timetable ID"),
  entries: z.array(timetableEntrySchema).min(1, "At least one entry is required"),
});
