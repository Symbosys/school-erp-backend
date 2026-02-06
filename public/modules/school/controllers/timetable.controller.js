"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTimetableEntry = exports.updateTimetableEntry = exports.addTimetableEntry = exports.deleteTimetable = exports.updateTimetable = exports.getTeacherTimetable = exports.getTimetableById = exports.getSectionTimetable = exports.getClassTimetable = exports.createSectionOverride = exports.createTimetable = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const timetable_validation_1 = require("../validation/timetable.validation");
/**
 * @route   POST /api/school/timetable
 * @desc    Create a class-level timetable (Default for all sections)
 * @access  Admin/School
 */
exports.createTimetable = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = timetable_validation_1.createTimetableSchema.parse(req.body);
    // Validate Class-Level Uniqueness
    const existingTimetable = await prisma_1.prisma.timetable.findFirst({
        where: {
            classId: validatedData.classId,
            academicYearId: validatedData.academicYearId,
            sectionId: null, // Ensure it's a class-level timetable
        },
    });
    if (existingTimetable) {
        throw new response_util_1.ErrorResponse("A default timetable already exists for this class and academic year", types_1.statusCode.Conflict);
    }
    // Create Timetable with Entries
    const timetable = await prisma_1.prisma.timetable.create({
        data: {
            schoolId: validatedData.schoolId,
            academicYearId: validatedData.academicYearId,
            classId: validatedData.classId,
            sectionId: null, // Explicitly null for class default
            name: validatedData.name,
            effectiveFrom: new Date(validatedData.effectiveFrom),
            effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : null,
            entries: validatedData.entries
                ? {
                    create: validatedData.entries.map((entry) => ({
                        timeSlotId: entry.timeSlotId,
                        dayOfWeek: entry.dayOfWeek,
                        subjectId: entry.subjectId,
                        teacherId: entry.teacherId,
                        roomNumber: entry.roomNumber,
                    })),
                }
                : undefined,
        },
        include: {
            entries: true,
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Class timetable created successfully", timetable, types_1.statusCode.Created);
});
/**
 * @route   POST /api/school/timetable/override
 * @desc    Create a section-specific override timetable
 * @access  Admin/School
 */
exports.createSectionOverride = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = timetable_validation_1.createSectionOverrideSchema.parse(req.body);
    // Validate Section Override Uniqueness
    const existingOverride = await prisma_1.prisma.timetable.findUnique({
        where: {
            classId_academicYearId_sectionId: {
                classId: validatedData.classId,
                academicYearId: validatedData.academicYearId,
                sectionId: validatedData.sectionId,
            },
        },
    });
    if (existingOverride) {
        throw new response_util_1.ErrorResponse("An override timetable already exists for this section and academic year", types_1.statusCode.Conflict);
    }
    // Create Override Timetable
    const timetable = await prisma_1.prisma.timetable.create({
        data: {
            schoolId: validatedData.schoolId,
            academicYearId: validatedData.academicYearId,
            classId: validatedData.classId,
            sectionId: validatedData.sectionId,
            name: validatedData.name,
            effectiveFrom: new Date(validatedData.effectiveFrom),
            effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : null,
            entries: validatedData.entries
                ? {
                    create: validatedData.entries.map((entry) => ({
                        timeSlotId: entry.timeSlotId,
                        dayOfWeek: entry.dayOfWeek,
                        subjectId: entry.subjectId,
                        teacherId: entry.teacherId,
                        roomNumber: entry.roomNumber,
                    })),
                }
                : undefined,
        },
        include: {
            entries: true,
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Section override timetable created successfully", timetable, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/timetable/class/:classId
 * @desc    Get class-level default timetable
 * @access  Admin/School
 */
exports.getClassTimetable = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { classId } = req.params;
    const { academicYearId } = req.query;
    if (!academicYearId)
        throw new response_util_1.ErrorResponse("Academic Year ID is required", types_1.statusCode.Bad_Request);
    const timetable = await prisma_1.prisma.timetable.findFirst({
        where: {
            classId: classId,
            academicYearId: academicYearId,
            sectionId: null,
        },
        include: {
            entries: {
                include: {
                    timeSlot: true,
                    subject: { select: { id: true, name: true, code: true } },
                    teacher: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ dayOfWeek: "asc" }, { timeSlot: { slotOrder: "asc" } }],
            },
        },
    });
    if (!timetable)
        throw new response_util_1.ErrorResponse("No default timetable found for this class", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Class timetable retrieved successfully", timetable);
});
/**
 * @route   GET /api/school/timetable/section/:sectionId
 * @desc    Get timetable for a section (Returns override if exists, else class default)
 * @access  Admin/School
 */
exports.getSectionTimetable = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { sectionId } = req.params;
    const { academicYearId } = req.query;
    if (!academicYearId)
        throw new response_util_1.ErrorResponse("Academic Year ID is required", types_1.statusCode.Bad_Request);
    const section = await prisma_1.prisma.section.findUnique({
        where: { id: sectionId },
        select: { classId: true },
    });
    if (!section)
        throw new response_util_1.ErrorResponse("Section not found", types_1.statusCode.Not_Found);
    // Try to find section-specific override FIRST
    let timetable = await prisma_1.prisma.timetable.findUnique({
        where: {
            classId_academicYearId_sectionId: {
                classId: section.classId,
                academicYearId: academicYearId,
                sectionId: sectionId,
            },
        },
        include: {
            entries: {
                include: {
                    timeSlot: true,
                    subject: { select: { id: true, name: true, code: true } },
                    teacher: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ dayOfWeek: "asc" }, { timeSlot: { slotOrder: "asc" } }],
            },
        },
    });
    let isOverride = true;
    // If no override, fetch class default
    if (!timetable) {
        timetable = await prisma_1.prisma.timetable.findFirst({
            where: {
                classId: section.classId,
                academicYearId: academicYearId,
                sectionId: null,
            },
            include: {
                entries: {
                    include: {
                        timeSlot: true,
                        subject: { select: { id: true, name: true, code: true } },
                        teacher: { select: { id: true, firstName: true, lastName: true } },
                    },
                    orderBy: [{ dayOfWeek: "asc" }, { timeSlot: { slotOrder: "asc" } }],
                },
            },
        });
        isOverride = false;
    }
    if (!timetable)
        throw new response_util_1.ErrorResponse("No timetable found for this section (neither override nor default)", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Timetable retrieved successfully", { ...timetable, isOverride });
});
/**
 * @route   GET /api/school/timetable/:id
 * @desc    Get timetable details by ID
 * @access  Admin/School
 */
exports.getTimetableById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const timetable = await prisma_1.prisma.timetable.findUnique({
        where: { id: id },
        include: {
            entries: {
                include: {
                    timeSlot: true,
                    subject: { select: { id: true, name: true, code: true } },
                    teacher: { select: { id: true, firstName: true, lastName: true } },
                },
                orderBy: [{ dayOfWeek: "asc" }, { timeSlot: { slotOrder: "asc" } }],
            },
        },
    });
    if (!timetable)
        throw new response_util_1.ErrorResponse("Timetable not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Timetable retrieved successfully", timetable);
});
/**
 * @route   GET /api/school/timetable/teacher/:teacherId
 * @desc    Get timetable entries for a specific teacher
 * @query   academicYearId (required)
 * @access  Teacher/Admin
 */
exports.getTeacherTimetable = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { teacherId } = req.params;
    const { academicYearId } = req.query;
    if (!academicYearId)
        throw new response_util_1.ErrorResponse("Academic Year ID is required", types_1.statusCode.Bad_Request);
    const entries = await prisma_1.prisma.timetableEntry.findMany({
        where: {
            teacherId: teacherId,
            timetable: {
                academicYearId: academicYearId,
                isActive: true,
            },
        },
        include: {
            timeSlot: true,
            subject: { select: { id: true, name: true, code: true } },
            timetable: {
                include: {
                    class: { select: { id: true, name: true } },
                    section: { select: { id: true, name: true } },
                },
            },
        },
        orderBy: [
            { dayOfWeek: "asc" },
            { timeSlot: { slotOrder: "asc" } },
        ],
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher timetable retrieved successfully", entries);
});
/**
 * @route   PUT /api/school/timetable/:id
 * @desc    Update timetable metadata
 * @access  Admin/School
 */
exports.updateTimetable = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = timetable_validation_1.updateTimetableSchema.parse(req.body);
    const timetable = await prisma_1.prisma.timetable.update({
        where: { id: id },
        data: {
            name: validatedData.name,
            effectiveFrom: validatedData.effectiveFrom ? new Date(validatedData.effectiveFrom) : undefined,
            effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : undefined,
            isActive: validatedData.isActive,
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Timetable updated successfully", timetable);
});
/**
 * @route   DELETE /api/school/timetable/:id
 * @desc    Delete timetable
 * @access  Admin
 */
exports.deleteTimetable = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.timetable.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Timetable deleted successfully", null);
});
// ==========================================
// TIMETABLE ENTRY APIs
// ==========================================
/**
 * @route   POST /api/school/timetable/entry
 * @desc    Add a single entry to a timetable
 * @access  Admin/School
 */
exports.addTimetableEntry = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = timetable_validation_1.addTimetableEntrySchema.parse(req.body);
    // Check for conflicts
    const existingEntry = await prisma_1.prisma.timetableEntry.findUnique({
        where: {
            timetableId_timeSlotId_dayOfWeek: {
                timetableId: validatedData.timetableId,
                timeSlotId: validatedData.timeSlotId,
                dayOfWeek: validatedData.dayOfWeek,
            },
        },
    });
    if (existingEntry) {
        throw new response_util_1.ErrorResponse("An entry already exists for this slot and day", types_1.statusCode.Conflict);
    }
    const entry = await prisma_1.prisma.timetableEntry.create({
        data: validatedData,
    });
    return (0, response_util_1.SuccessResponse)(res, "Timetable entry added successfully", entry, types_1.statusCode.Created);
});
/**
 * @route   PUT /api/school/timetable/entry/:id
 * @desc    Update timetable entry
 * @access  Admin/School
 */
exports.updateTimetableEntry = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = timetable_validation_1.updateTimetableEntrySchema.parse(req.body);
    const entry = await prisma_1.prisma.timetableEntry.update({
        where: { id: id },
        data: validatedData,
    });
    return (0, response_util_1.SuccessResponse)(res, "Timetable entry updated successfully", entry);
});
/**
 * @route   DELETE /api/school/timetable/entry/:id
 * @desc    Delete timetable entry
 * @access  Admin/School
 */
exports.deleteTimetableEntry = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.timetableEntry.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Timetable entry deleted successfully", null);
});
//# sourceMappingURL=timetable.controller.js.map