"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLeaveStatusSchema = exports.applyLeaveSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Applying for Leave
 * Handles FormData inputs
 */
exports.applyLeaveSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid School ID"),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid start date"),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), "Invalid end date"),
    reason: zod_1.z.string().min(1, "Reason is required"),
    type: zod_1.z.enum(["SICK", "CASUAL", "EMERGENCY", "VACATION", "OTHER"]).default("OTHER"),
    // Optional attachment handled by Multer, but we validate metadata if needed
});
/**
 * Zod Schema for Updating Leave Status (Admin/Approver)
 */
exports.updateLeaveStatusSchema = zod_1.z.object({
    status: zod_1.z.enum(["PENDING", "APPROVED", "REJECTED", "CANCELLED"]),
    rejectionReason: zod_1.z.string().optional(),
    approvedBy: zod_1.z.string().optional(), // ID of the approver
});
//# sourceMappingURL=leave.validation.js.map