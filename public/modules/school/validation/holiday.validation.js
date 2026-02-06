"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateHolidaysSchema = exports.updateHolidaySchema = exports.createHolidaySchema = void 0;
const zod_1 = require("zod");
const client_1 = require("../../../generated/prisma/client");
// Create Holiday
exports.createHolidaySchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    name: zod_1.z.string().min(1, "Holiday name is required").max(200, "Name too long"),
    date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    type: zod_1.z.nativeEnum(client_1.HolidayType),
    description: zod_1.z.string().max(1000, "Description too long").optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Update Holiday
exports.updateHolidaySchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    description: zod_1.z.string().max(1000).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Bulk Create Holidays
exports.bulkCreateHolidaysSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    holidays: zod_1.z.array(zod_1.z.object({
        name: zod_1.z.string().min(1, "Holiday name is required").max(200, "Name too long"),
        date: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
        type: zod_1.z.nativeEnum(client_1.HolidayType),
        description: zod_1.z.string().max(1000, "Description too long").optional(),
    })).min(1, "At least one holiday is required"),
});
//# sourceMappingURL=holiday.validation.js.map