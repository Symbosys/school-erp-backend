import { z } from "zod";

/**
 * Zod Schema for Applying for Leave
 * Handles FormData inputs
 */
export const applyLeaveSchema = z.object({
  schoolId: z.string().uuid("Invalid School ID"),
  startDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
  endDate: z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
  reason: z.string().min(1, "Reason is required"),
  type: z.enum(["SICK", "CASUAL", "EMERGENCY", "VACATION", "OTHER"]).default("OTHER"),
  
  // Optional attachment handled by Multer, but we validate metadata if needed
});

/**
 * Zod Schema for Updating Leave Status (Admin/Approver)
 */
export const updateLeaveStatusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
  rejectionReason: z.string().optional(),
  approvedBy: z.string().optional(), // ID of the approver
});

export type ApplyLeaveInput = z.infer<typeof applyLeaveSchema>;
export type UpdateLeaveStatusInput = z.infer<typeof updateLeaveStatusSchema>;
