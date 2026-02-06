"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSectionSchema = exports.createSectionSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Section Creation
 */
exports.createSectionSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    classId: zod_1.z.string().uuid("Invalid class ID"),
    name: zod_1.z.string().min(1, "Section name is required").max(50, "Section name is too long"),
    capacity: zod_1.z.number().int("Capacity must be an integer").min(1, "Capacity must be at least 1").optional(),
    roomNumber: zod_1.z.string().max(50, "Room number is too long").optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Section Update
 */
exports.updateSectionSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Section name is required").max(50, "Section name is too long").optional(),
    capacity: zod_1.z.number().int("Capacity must be an integer").min(1, "Capacity must be at least 1").optional(),
    roomNumber: zod_1.z.string().max(50, "Room number is too long").optional().nullable(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=section.validation.js.map