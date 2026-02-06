"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setCurrentYearSchema = exports.updateAcademicYearSchema = exports.createAcademicYearSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Academic Year Creation
 */
exports.createAcademicYearSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    name: zod_1.z.string().min(1, "Academic year name is required").max(100, "Name is too long"),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date format",
    }),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end date format",
    }),
    isCurrent: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
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
exports.updateAcademicYearSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Academic year name is required").max(100, "Name is too long").optional(),
    startDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid start date format",
    }).optional(),
    endDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid end date format",
    }).optional(),
    isCurrent: zod_1.z.boolean().optional(),
    isActive: zod_1.z.boolean().optional(),
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
exports.setCurrentYearSchema = zod_1.z.object({
    isCurrent: zod_1.z.boolean(),
});
//# sourceMappingURL=academicYear.validation.js.map