"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteAcademicYear = exports.setCurrentAcademicYear = exports.updateAcademicYear = exports.getCurrentAcademicYear = exports.getAcademicYearById = exports.getAcademicYearsBySchool = exports.createAcademicYear = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const academicYear_validation_1 = require("../validation/academicYear.validation");
/**
 * @route   POST /api/school/academic-year
 * @desc    Create a new academic year for a school
 * @access  Admin/School
 */
exports.createAcademicYear = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = academicYear_validation_1.createAcademicYearSchema.parse(req.body);
    // Check if school exists
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: validatedData.schoolId }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Check if academic year with same name exists for this school
    const existingYear = await prisma_1.prisma.academicYear.findFirst({
        where: {
            schoolId: validatedData.schoolId,
            name: validatedData.name
        }
    });
    if (existingYear) {
        throw new response_util_1.ErrorResponse("Academic year with this name already exists for this school", types_1.statusCode.Conflict);
    }
    // If setting as current, unset other current years for this school
    if (validatedData.isCurrent) {
        await prisma_1.prisma.academicYear.updateMany({
            where: {
                schoolId: validatedData.schoolId,
                isCurrent: true
            },
            data: { isCurrent: false }
        });
    }
    // Create academic year
    const academicYear = await prisma_1.prisma.academicYear.create({
        data: {
            schoolId: validatedData.schoolId,
            name: validatedData.name,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
            isCurrent: validatedData.isCurrent ?? false,
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Academic year created successfully", academicYear, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/academic-year/school/:schoolId
 * @desc    Get all academic years for a school
 * @access  Admin/School
 */
exports.getAcademicYearsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive, isCurrent } = req.query;
    const where = { schoolId: schoolId };
    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }
    if (isCurrent !== undefined) {
        where.isCurrent = isCurrent === "true";
    }
    const academicYears = await prisma_1.prisma.academicYear.findMany({
        where,
        orderBy: { startDate: "desc" },
        include: {
            _count: {
                select: {
                    enrollments: true,
                    studentAttendances: true,
                    teacherAssignments: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Academic years retrieved successfully", academicYears);
});
/**
 * @route   GET /api/school/academic-year/:id
 * @desc    Get academic year by ID
 * @access  Admin/School
 */
exports.getAcademicYearById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const academicYear = await prisma_1.prisma.academicYear.findUnique({
        where: { id: id },
        include: {
            school: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            _count: {
                select: {
                    enrollments: true,
                    studentAttendances: true,
                    teacherAssignments: true
                }
            }
        }
    });
    if (!academicYear) {
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Academic year retrieved successfully", academicYear);
});
/**
 * @route   GET /api/school/academic-year/current/:schoolId
 * @desc    Get current academic year for a school
 * @access  Admin/School
 */
exports.getCurrentAcademicYear = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const academicYear = await prisma_1.prisma.academicYear.findFirst({
        where: {
            schoolId: schoolId,
            isCurrent: true
        },
        include: {
            _count: {
                select: {
                    enrollments: true,
                    studentAttendances: true,
                    teacherAssignments: true
                }
            }
        }
    });
    if (!academicYear) {
        throw new response_util_1.ErrorResponse("No current academic year found for this school", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Current academic year retrieved successfully", academicYear);
});
/**
 * @route   PUT /api/school/academic-year/:id
 * @desc    Update academic year
 * @access  Admin/School
 */
exports.updateAcademicYear = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = academicYear_validation_1.updateAcademicYearSchema.parse(req.body);
    const existingYear = await prisma_1.prisma.academicYear.findUnique({
        where: { id: id }
    });
    if (!existingYear) {
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    }
    // If updating isCurrent to true, unset other current years for this school
    if (validatedData.isCurrent === true) {
        await prisma_1.prisma.academicYear.updateMany({
            where: {
                schoolId: existingYear.schoolId,
                isCurrent: true,
                id: { not: id }
            },
            data: { isCurrent: false }
        });
    }
    const updateData = {};
    if (validatedData.name)
        updateData.name = validatedData.name;
    if (validatedData.startDate)
        updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate)
        updateData.endDate = new Date(validatedData.endDate);
    if (validatedData.isCurrent !== undefined)
        updateData.isCurrent = validatedData.isCurrent;
    if (validatedData.isActive !== undefined)
        updateData.isActive = validatedData.isActive;
    const updatedYear = await prisma_1.prisma.academicYear.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Academic year updated successfully", updatedYear);
});
/**
 * @route   PATCH /api/school/academic-year/:id/set-current
 * @desc    Set academic year as current
 * @access  Admin/School
 */
exports.setCurrentAcademicYear = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = academicYear_validation_1.setCurrentYearSchema.parse(req.body);
    const academicYear = await prisma_1.prisma.academicYear.findUnique({
        where: { id: id }
    });
    if (!academicYear) {
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    }
    // If setting as current, unset other current years for this school
    if (validatedData.isCurrent) {
        await prisma_1.prisma.academicYear.updateMany({
            where: {
                schoolId: academicYear.schoolId,
                isCurrent: true,
                id: { not: id }
            },
            data: { isCurrent: false }
        });
    }
    const updatedYear = await prisma_1.prisma.academicYear.update({
        where: { id: id },
        data: { isCurrent: validatedData.isCurrent }
    });
    return (0, response_util_1.SuccessResponse)(res, `Academic year ${validatedData.isCurrent ? "set as" : "removed from"} current`, updatedYear);
});
/**
 * @route   DELETE /api/school/academic-year/:id
 * @desc    Delete academic year
 * @access  Admin
 */
exports.deleteAcademicYear = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const academicYear = await prisma_1.prisma.academicYear.findUnique({
        where: { id: id },
        include: {
            _count: {
                select: {
                    enrollments: true,
                    studentAttendances: true,
                    teacherAssignments: true
                }
            }
        }
    });
    if (!academicYear) {
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    }
    // Check if academic year has any data
    const hasData = academicYear._count.enrollments > 0 ||
        academicYear._count.studentAttendances > 0 ||
        academicYear._count.teacherAssignments > 0;
    if (hasData) {
        throw new response_util_1.ErrorResponse("Cannot delete academic year with existing enrollments, attendance, or assignments", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.academicYear.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Academic year deleted successfully", null);
});
//# sourceMappingURL=academicYear.controller.js.map