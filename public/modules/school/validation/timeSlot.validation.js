"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateTimeSlotsSchema = exports.updateTimeSlotSchema = exports.createTimeSlotSchema = void 0;
const zod_1 = require("zod");
// Create TimeSlot
exports.createTimeSlotSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    name: zod_1.z.string().min(1, "Name is required").max(100, "Name too long"),
    startTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
    endTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
    slotOrder: zod_1.z.number().int().min(0).optional(),
    isBreak: zod_1.z.boolean().optional(),
});
// Update TimeSlot
exports.updateTimeSlotSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(100).optional(),
    startTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").optional(),
    endTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)").optional(),
    slotOrder: zod_1.z.number().int().min(0).optional(),
    isBreak: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Bulk Create TimeSlots
exports.bulkCreateTimeSlotsSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    timeSlots: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1, "Name is required").max(100, "Name too long"),
        startTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
        endTime: zod_1.z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:mm)"),
        slotOrder: zod_1.z.number().int().min(0).optional(),
        isBreak: zod_1.z.boolean().optional(),
    })).min(1, "At least one time slot is required"),
});
//# sourceMappingURL=timeSlot.validation.js.map