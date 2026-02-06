"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkCreateHolidays = exports.deleteHoliday = exports.updateHoliday = exports.getHolidayById = exports.checkHoliday = exports.getCurrentYearHolidays = exports.getHolidaysByAcademicYear = exports.createHoliday = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const holiday_validation_1 = require("../validation/holiday.validation");
/**
 * @route   POST /api/school/holiday
 * @desc    Create a new holiday for an academic year
 * @access  Admin/School
 */
exports.createHoliday = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = holiday_validation_1.createHolidaySchema.parse(req.body);
    // Validate school exists
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    // Validate academic year exists and belongs to school
    const academicYear = await prisma_1.prisma.academicYear.findUnique({
        where: { id: validatedData.academicYearId },
    });
    if (!academicYear)
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    if (academicYear.schoolId !== validatedData.schoolId) {
        throw new response_util_1.ErrorResponse("Academic year does not belong to this school", types_1.statusCode.Bad_Request);
    }
    // Validate date falls within academic year range
    const holidayDate = new Date(validatedData.date);
    const startDate = new Date(academicYear.startDate);
    const endDate = new Date(academicYear.endDate);
    if (holidayDate < startDate || holidayDate > endDate) {
        throw new response_util_1.ErrorResponse(`Holiday date must be within academic year range (${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]})`, types_1.statusCode.Bad_Request);
    }
    // Check for duplicate holiday on same date
    const existingHoliday = await prisma_1.prisma.holiday.findUnique({
        where: {
            schoolId_academicYearId_date: {
                schoolId: validatedData.schoolId,
                academicYearId: validatedData.academicYearId,
                date: holidayDate,
            },
        },
    });
    if (existingHoliday) {
        throw new response_util_1.ErrorResponse(`A holiday already exists on ${validatedData.date} for this academic year`, types_1.statusCode.Conflict);
    }
    // Create holiday
    const holiday = await prisma_1.prisma.holiday.create({
        data: {
            ...validatedData,
            date: holidayDate,
            isActive: validatedData.isActive ?? true,
        },
        include: {
            academicYear: {
                select: { id: true, name: true },
            },
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Holiday created successfully", holiday, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/holiday/academic-year/:academicYearId
 * @desc    Get all holidays for a specific academic year
 * @access  Admin/School
 */
exports.getHolidaysByAcademicYear = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { academicYearId } = req.params;
    const { type, month, startDate, endDate, isActive } = req.query;
    const where = { academicYearId: academicYearId };
    if (type)
        where.type = type;
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    // Date range filters
    if (month && !startDate && !endDate) {
        const year = new Date().getFullYear();
        const monthNum = parseInt(month);
        where.date = {
            gte: new Date(year, monthNum - 1, 1),
            lte: new Date(year, monthNum, 0),
        };
    }
    else if (startDate || endDate) {
        where.date = {};
        if (startDate)
            where.date.gte = new Date(startDate);
        if (endDate)
            where.date.lte = new Date(endDate);
    }
    const holidays = await prisma_1.prisma.holiday.findMany({
        where,
        include: {
            academicYear: {
                select: { id: true, name: true },
            },
        },
        orderBy: { date: "asc" },
    });
    return (0, response_util_1.SuccessResponse)(res, "Holidays retrieved successfully", holidays);
});
/**
 * @route   GET /api/school/holiday/school/:schoolId/current
 * @desc    Get current academic year holidays for a school
 * @access  Admin/School
 */
exports.getCurrentYearHolidays = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    // Get current academic year
    const currentAcademicYear = await prisma_1.prisma.academicYear.findFirst({
        where: {
            schoolId: schoolId,
            isCurrent: true,
        },
    });
    if (!currentAcademicYear) {
        throw new response_util_1.ErrorResponse("No current academic year found for this school", types_1.statusCode.Not_Found);
    }
    const holidays = await prisma_1.prisma.holiday.findMany({
        where: {
            academicYearId: currentAcademicYear.id,
            isActive: true,
        },
        include: {
            academicYear: {
                select: { id: true, name: true },
            },
        },
        orderBy: { date: "asc" },
    });
    return (0, response_util_1.SuccessResponse)(res, "Current year holidays retrieved successfully", {
        academicYear: currentAcademicYear,
        holidays,
    });
});
/**
 * @route   GET /api/school/holiday/check/:academicYearId/:date
 * @desc    Check if a specific date is a holiday
 * @access  Admin/School
 */
exports.checkHoliday = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { academicYearId, date } = req.params;
    const holidayDate = new Date(date);
    const holiday = await prisma_1.prisma.holiday.findFirst({
        where: {
            academicYearId: academicYearId,
            date: holidayDate,
            isActive: true,
        },
        include: {
            academicYear: {
                select: { id: true, name: true },
            },
        },
    });
    return (0, response_util_1.SuccessResponse)(res, holiday ? "Date is a holiday" : "Date is not a holiday", {
        isHoliday: !!holiday,
        holiday: holiday || null,
    });
});
/**
 * @route   GET /api/school/holiday/:id
 * @desc    Get holiday by ID
 * @access  Admin/School
 */
exports.getHolidayById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const holiday = await prisma_1.prisma.holiday.findUnique({
        where: { id: id },
        include: {
            academicYear: {
                select: { id: true, name: true },
            },
        },
    });
    if (!holiday)
        throw new response_util_1.ErrorResponse("Holiday not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Holiday retrieved successfully", holiday);
});
/**
 * @route   PUT /api/school/holiday/:id
 * @desc    Update holiday
 * @access  Admin/School
 */
exports.updateHoliday = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = holiday_validation_1.updateHolidaySchema.parse(req.body);
    const existingHoliday = await prisma_1.prisma.holiday.findUnique({ where: { id: id } });
    if (!existingHoliday)
        throw new response_util_1.ErrorResponse("Holiday not found", types_1.statusCode.Not_Found);
    const holiday = await prisma_1.prisma.holiday.update({
        where: { id: id },
        data: validatedData,
        include: {
            academicYear: {
                select: { id: true, name: true },
            },
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Holiday updated successfully", holiday);
});
/**
 * @route   DELETE /api/school/holiday/:id
 * @desc    Delete holiday
 * @access  Admin
 */
exports.deleteHoliday = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const holiday = await prisma_1.prisma.holiday.findUnique({ where: { id: id } });
    if (!holiday)
        throw new response_util_1.ErrorResponse("Holiday not found", types_1.statusCode.Not_Found);
    await prisma_1.prisma.holiday.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Holiday deleted successfully", null);
});
/**
 * @route   POST /api/school/holiday/bulk
 * @desc    Bulk create holidays for an academic year
 * @access  Admin/School
 */
exports.bulkCreateHolidays = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = holiday_validation_1.bulkCreateHolidaysSchema.parse(req.body);
    // Validate school exists
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    // Validate academic year exists and belongs to school
    const academicYear = await prisma_1.prisma.academicYear.findUnique({
        where: { id: validatedData.academicYearId },
    });
    if (!academicYear)
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    if (academicYear.schoolId !== validatedData.schoolId) {
        throw new response_util_1.ErrorResponse("Academic year does not belong to this school", types_1.statusCode.Bad_Request);
    }
    const startDate = new Date(academicYear.startDate);
    const endDate = new Date(academicYear.endDate);
    // Validate all dates and check for duplicates
    const holidayDates = [];
    const errors = [];
    for (const holiday of validatedData.holidays) {
        const holidayDate = new Date(holiday.date);
        // Check if date is within academic year range
        if (holidayDate < startDate || holidayDate > endDate) {
            errors.push(`${holiday.name} (${holiday.date}) is outside academic year range`);
            continue;
        }
        // Check for duplicate dates in request
        if (holidayDates.some((d) => d.getTime() === holidayDate.getTime())) {
            errors.push(`Duplicate date in request: ${holiday.date}`);
            continue;
        }
        holidayDates.push(holidayDate);
    }
    if (errors.length > 0) {
        throw new response_util_1.ErrorResponse(`Validation errors: ${errors.join(", ")}`, types_1.statusCode.Bad_Request);
    }
    // Check for existing holidays
    const existingHolidays = await prisma_1.prisma.holiday.findMany({
        where: {
            schoolId: validatedData.schoolId,
            academicYearId: validatedData.academicYearId,
            date: {
                in: holidayDates,
            },
        },
    });
    if (existingHolidays.length > 0) {
        const existingDates = existingHolidays.map((h) => h.date.toISOString().split("T")[0]).join(", ");
        throw new response_util_1.ErrorResponse(`Holidays already exist for the following dates: ${existingDates}`, types_1.statusCode.Conflict);
    }
    // Create all holidays
    const createData = validatedData.holidays.map((holiday, index) => ({
        schoolId: validatedData.schoolId,
        academicYearId: validatedData.academicYearId,
        name: holiday.name,
        date: holidayDates[index],
        type: holiday.type,
        description: holiday.description || null,
        isActive: true,
    }));
    await prisma_1.prisma.holiday.createMany({
        data: createData,
    });
    return (0, response_util_1.SuccessResponse)(res, `${createData.length} holidays created successfully`, { count: createData.length }, types_1.statusCode.Created);
});
//# sourceMappingURL=holiday.controller.js.map