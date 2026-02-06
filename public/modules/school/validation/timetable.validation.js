"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkAddEntriesSchema = exports.updateTimetableEntrySchema = exports.addTimetableEntrySchema = exports.updateTimetableSchema = exports.createSectionOverrideSchema = exports.createTimetableSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("../../../generated/prisma/client");
// Timetable Entry Schema (used within timetable creation)
const timetableEntrySchema = zod_1.z.object({
    timeSlotId: zod_1.z.string().uuid("Invalid time slot ID"),
    dayOfWeek: zod_1.z.nativeEnum(client_1.DayOfWeek),
    subjectId: zod_1.z.string().uuid("Invalid subject ID").nullable().optional(),
    teacherId: zod_1.z.string().uuid("Invalid teacher ID").nullable().optional(),
    roomNumber: zod_1.z.string().max(50).nullable().optional(),
});
// Create Timetable (Class-level default)
exports.createTimetableSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    classId: zod_1.z.string().uuid("Invalid class ID"),
    name: zod_1.z.string().min(1, "Name is required").max(200, "Name too long"),
    effectiveFrom: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    effectiveTo: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    entries: zod_1.z.array(timetableEntrySchema).optional(),
});
// Create Section Override Timetable
exports.createSectionOverrideSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    classId: zod_1.z.string().uuid("Invalid class ID"),
    sectionId: zod_1.z.string().uuid("Invalid section ID"),
    name: zod_1.z.string().min(1, "Name is required").max(200, "Name too long"),
    effectiveFrom: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    effectiveTo: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    entries: zod_1.z.array(timetableEntrySchema).optional(),
});
// Update Timetable
exports.updateTimetableSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).max(200).optional(),
    effectiveFrom: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
    effectiveTo: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").nullable().optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Add Timetable Entry
exports.addTimetableEntrySchema = zod_1.z.object({
    timetableId: zod_1.z.string().uuid("Invalid timetable ID"),
    timeSlotId: zod_1.z.string().uuid("Invalid time slot ID"),
    dayOfWeek: zod_1.z.nativeEnum(client_1.DayOfWeek),
    subjectId: zod_1.z.string().uuid("Invalid subject ID").nullable().optional(),
    teacherId: zod_1.z.string().uuid("Invalid teacher ID").nullable().optional(),
    roomNumber: zod_1.z.string().max(50).nullable().optional(),
});
// Update Timetable Entry
exports.updateTimetableEntrySchema = zod_1.z.object({
    subjectId: zod_1.z.string().uuid("Invalid subject ID").nullable().optional(),
    teacherId: zod_1.z.string().uuid("Invalid teacher ID").nullable().optional(),
    roomNumber: zod_1.z.string().max(50).nullable().optional(),
});
// Bulk Add Timetable Entries
exports.bulkAddEntriesSchema = zod_1.z.object({
    timetableId: zod_1.z.string().uuid("Invalid timetable ID"),
    entries: zod_1.z.array(timetableEntrySchema).min(1, "At least one entry is required"),
});
//# sourceMappingURL=timetable.validation.js.map