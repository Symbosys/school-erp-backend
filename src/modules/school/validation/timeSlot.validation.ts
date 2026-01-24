import { z } from "zod";

// Create TimeSlot
export const createTimeSlotSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
  slotOrder: z.number().int().min(0).optional(),
  isBreak: z.boolean().optional(),
});

// Update TimeSlot
export const updateTimeSlotSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").optional(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").optional(),
  slotOrder: z.number().int().min(0).optional(),
  isBreak: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

// Bulk Create TimeSlots
export const bulkCreateTimeSlotsSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  timeSlots: z.array(
    z.object({
      name: z.string().min(1, "Name is required").max(100, "Name too long"),
      startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
      endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
      slotOrder: z.number().int().min(0).optional(),
      isBreak: z.boolean().optional(),
    })
  ).min(1, "At least one time slot is required"),
});
