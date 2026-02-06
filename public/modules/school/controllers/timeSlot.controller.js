"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateTimeSlots = exports.deleteTimeSlot = exports.updateTimeSlot = exports.getTimeSlotById = exports.getTimeSlotsBySchool = exports.createTimeSlot = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const timeSlot_validation_1 = require("../validation/timeSlot.validation");
/**
 * @route   POST /api/school/time-slot
 * @desc    Create a new time slot for a school
 * @access  Admin/School
 */
exports.createTimeSlot = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = timeSlot_validation_1.createTimeSlotSchema.parse(req.body);
    // Validate school exists
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    // Validate start time is before end time
    if (validatedData.startTime >= validatedData.endTime) {
        throw new response_util_1.ErrorResponse("Start time must be before end time", types_1.statusCode.Bad_Request);
    }
    // Check for duplicate name
    const existing = await prisma_1.prisma.timeSlot.findUnique({
        where: {
            schoolId_name: {
                schoolId: validatedData.schoolId,
                name: validatedData.name,
            },
        },
    });
    if (existing) {
        throw new response_util_1.ErrorResponse(`Time slot "${validatedData.name}" already exists`, types_1.statusCode.Conflict);
    }
    // Create time slot
    const timeSlot = await prisma_1.prisma.timeSlot.create({
        data: {
            schoolId: validatedData.schoolId,
            name: validatedData.name,
            startTime: validatedData.startTime,
            endTime: validatedData.endTime,
            slotOrder: validatedData.slotOrder ?? 0,
            isBreak: validatedData.isBreak ?? false,
            isActive: true,
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Time slot created successfully", timeSlot, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/time-slot/school/:schoolId
 * @desc    Get all time slots for a school
 * @access  Admin/School
 */
exports.getTimeSlotsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive, isBreak } = req.query;
    const where = { schoolId: schoolId };
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    if (isBreak !== undefined)
        where.isBreak = isBreak === "true";
    const timeSlots = await prisma_1.prisma.timeSlot.findMany({
        where,
        orderBy: { slotOrder: "asc" },
    });
    return (0, response_util_1.SuccessResponse)(res, "Time slots retrieved successfully", timeSlots);
});
/**
 * @route   GET /api/school/time-slot/:id
 * @desc    Get time slot by ID
 * @access  Admin/School
 */
exports.getTimeSlotById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const timeSlot = await prisma_1.prisma.timeSlot.findUnique({
        where: { id: id },
    });
    if (!timeSlot)
        throw new response_util_1.ErrorResponse("Time slot not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Time slot retrieved successfully", timeSlot);
});
/**
 * @route   PUT /api/school/time-slot/:id
 * @desc    Update time slot
 * @access  Admin/School
 */
exports.updateTimeSlot = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = timeSlot_validation_1.updateTimeSlotSchema.parse(req.body);
    const existingSlot = await prisma_1.prisma.timeSlot.findUnique({ where: { id: id } });
    if (!existingSlot)
        throw new response_util_1.ErrorResponse("Time slot not found", types_1.statusCode.Not_Found);
    // Validate time logic if both are being updated
    const startTime = validatedData.startTime ?? existingSlot.startTime;
    const endTime = validatedData.endTime ?? existingSlot.endTime;
    if (startTime >= endTime) {
        throw new response_util_1.ErrorResponse("Start time must be before end time", types_1.statusCode.Bad_Request);
    }
    // Check for duplicate name if name is being changed
    if (validatedData.name && validatedData.name !== existingSlot.name) {
        const duplicate = await prisma_1.prisma.timeSlot.findUnique({
            where: {
                schoolId_name: {
                    schoolId: existingSlot.schoolId,
                    name: validatedData.name,
                },
            },
        });
        if (duplicate) {
            throw new response_util_1.ErrorResponse(`Time slot "${validatedData.name}" already exists`, types_1.statusCode.Conflict);
        }
    }
    const timeSlot = await prisma_1.prisma.timeSlot.update({
        where: { id: id },
        data: validatedData,
    });
    return (0, response_util_1.SuccessResponse)(res, "Time slot updated successfully", timeSlot);
});
/**
 * @route   DELETE /api/school/time-slot/:id
 * @desc    Delete time slot
 * @access  Admin
 */
exports.deleteTimeSlot = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const timeSlot = await prisma_1.prisma.timeSlot.findUnique({ where: { id: id } });
    if (!timeSlot)
        throw new response_util_1.ErrorResponse("Time slot not found", types_1.statusCode.Not_Found);
    // Check if time slot is used in any timetable entries
    const usedInEntries = await prisma_1.prisma.timetableEntry.count({
        where: { timeSlotId: id },
    });
    if (usedInEntries > 0) {
        throw new response_util_1.ErrorResponse(`Cannot delete time slot. It is used in ${usedInEntries} timetable entries.`, types_1.statusCode.Conflict);
    }
    await prisma_1.prisma.timeSlot.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Time slot deleted successfully", null);
});
/**
 * @route   POST /api/school/time-slot/bulk
 * @desc    Bulk create time slots for a school
 * @access  Admin/School
 */
exports.bulkCreateTimeSlots = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = timeSlot_validation_1.bulkCreateTimeSlotsSchema.parse(req.body);
    // Validate school exists
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    // Validate all time slots
    const errors = [];
    const names = new Set();
    for (const slot of validatedData.timeSlots) {
        if (slot.startTime >= slot.endTime) {
            errors.push(`${slot.name}: Start time must be before end time`);
        }
        if (names.has(slot.name)) {
            errors.push(`Duplicate name in request: ${slot.name}`);
        }
        names.add(slot.name);
    }
    if (errors.length > 0) {
        throw new response_util_1.ErrorResponse(`Validation errors: ${errors.join(", ")}`, types_1.statusCode.Bad_Request);
    }
    // Check for existing names
    const existingSlots = await prisma_1.prisma.timeSlot.findMany({
        where: {
            schoolId: validatedData.schoolId,
            name: { in: Array.from(names) },
        },
    });
    if (existingSlots.length > 0) {
        const existingNames = existingSlots.map((s) => s.name).join(", ");
        throw new response_util_1.ErrorResponse(`Time slots already exist: ${existingNames}`, types_1.statusCode.Conflict);
    }
    // Create all time slots
    const createData = validatedData.timeSlots.map((slot, index) => ({
        schoolId: validatedData.schoolId,
        name: slot.name,
        startTime: slot.startTime,
        endTime: slot.endTime,
        slotOrder: slot.slotOrder ?? index + 1,
        isBreak: slot.isBreak ?? false,
        isActive: true,
    }));
    await prisma_1.prisma.timeSlot.createMany({ data: createData });
    return (0, response_util_1.SuccessResponse)(res, `${createData.length} time slots created successfully`, { count: createData.length }, types_1.statusCode.Created);
});
//# sourceMappingURL=timeSlot.controller.js.map