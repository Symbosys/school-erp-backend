"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePTMSchema = exports.createPTMSchema = void 0;
const zod_1 = require("zod");
// Base schema for shape definition
const basePTMSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().min(3).max(200),
    description: zod_1.z.string().min(10),
    meetingDate: zod_1.z.string().refine((date) => !isNaN(Date.parse(date)), {
        message: "Invalid date format",
    }),
    startTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    endTime: zod_1.z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Invalid time format (HH:MM)"),
    location: zod_1.z.string().optional(),
    targetType: zod_1.z.enum(["CLASS", "SECTION", "INDIVIDUAL"]),
    // Target IDs based on type
    classId: zod_1.z.string().uuid().optional(),
    sectionId: zod_1.z.string().uuid().optional(),
    studentIds: zod_1.z.array(zod_1.z.string().uuid()).optional(), // For INDIVIDUAL type
});
// Create Schema with Refinement for conditional validation
exports.createPTMSchema = basePTMSchema.refine((data) => {
    if (data.targetType === "CLASS" && !data.classId)
        return false;
    if (data.targetType === "SECTION" && !data.sectionId)
        return false;
    if (data.targetType === "INDIVIDUAL" && (!data.studentIds || data.studentIds.length === 0))
        return false;
    return true;
}, {
    message: "Missing required ID for selected target type",
    path: ["targetType"],
});
// Update Schema: Partial of base (without refinement)
// Note: We don't apply the target-type refinement on update for simplicity 
// as partial updates might not include targetType or targetIds simultaneously.
// If targetType is updated, the controller logic should handle validation or re-apply specific checks.
exports.updatePTMSchema = basePTMSchema.partial();
//# sourceMappingURL=ptm.validation.js.map