import { z } from "zod";

// Base schema for shape definition
const basePTMSchema = z.object({
  schoolId: z.string().uuid().optional(),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  meetingDate: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: "Invalid date format",
  }),
  startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
  location: z.string().optional(),
  
  targetType: z.enum(["CLASS", "SECTION", "INDIVIDUAL"]),
  
  // Target IDs based on type
  classId: z.string().uuid().optional(),
  sectionId: z.string().uuid().optional(),
  studentIds: z.array(z.string().uuid()).optional(), // For INDIVIDUAL type
});

// Create Schema with Refinement for conditional validation
export const createPTMSchema = basePTMSchema.refine((data) => {
  if (data.targetType === "CLASS" && !data.classId) return false;
  if (data.targetType === "SECTION" && !data.sectionId) return false;
  if (data.targetType === "INDIVIDUAL" && (!data.studentIds || data.studentIds.length === 0)) return false;
  return true;
}, {
  message: "Missing required ID for selected target type",
  path: ["targetType"],
});

// Update Schema: Partial of base (without refinement)
// Note: We don't apply the target-type refinement on update for simplicity 
// as partial updates might not include targetType or targetIds simultaneously.
// If targetType is updated, the controller logic should handle validation or re-apply specific checks.
export const updatePTMSchema = basePTMSchema.partial();
