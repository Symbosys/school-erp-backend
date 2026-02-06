"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteEnrollment = exports.updateEnrollment = exports.getEnrollmentById = exports.getEnrollmentsByStudent = exports.createEnrollment = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const enrollment_validation_1 = require("../validation/enrollment.validation");
/**
 * @route   POST /api/student/enrollment
 * @desc    Create a new enrollment (Enroll existing student to a class/year)
 * @access  Admin/School
 */
exports.createEnrollment = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = enrollment_validation_1.createEnrollmentSchema.parse(req.body);
    // 1. Fetch Student, Section, AcademicYear
    const student = await prisma_1.prisma.student.findUnique({ where: { id: validatedData.studentId } });
    if (!student)
        throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    const section = await prisma_1.prisma.section.findUnique({ where: { id: validatedData.sectionId } });
    if (!section)
        throw new response_util_1.ErrorResponse("Section not found", types_1.statusCode.Not_Found);
    const academicYear = await prisma_1.prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
    if (!academicYear)
        throw new response_util_1.ErrorResponse("Academic Year not found", types_1.statusCode.Not_Found);
    // 2. Validate School Consistency
    const schoolId = student.schoolId;
    if (section.schoolId !== schoolId || academicYear.schoolId !== schoolId) {
        throw new response_util_1.ErrorResponse("Student, Section, and Academic Year must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // 3. Check Duplicate Enrollment for same Academic Year
    const existingEnrollment = await prisma_1.prisma.studentEnrollment.findUnique({
        where: {
            studentId_academicYearId: {
                studentId: validatedData.studentId,
                academicYearId: validatedData.academicYearId
            }
        }
    });
    if (existingEnrollment) {
        throw new response_util_1.ErrorResponse("Student is already enrolled in this academic year", types_1.statusCode.Conflict);
    }
    // 4. Create Enrollment
    const enrollment = await prisma_1.prisma.studentEnrollment.create({
        data: {
            studentId: validatedData.studentId,
            academicYearId: validatedData.academicYearId,
            sectionId: validatedData.sectionId,
            enrollmentDate: new Date(validatedData.enrollmentDate),
            rollNumber: validatedData.rollNumber || null,
            remarks: validatedData.remarks || null,
            isPromoted: false
        },
        include: {
            section: {
                include: { class: true }
            },
            academicYear: true,
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    admissionNumber: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Student enrolled successfully", enrollment, types_1.statusCode.Created);
});
/**
 * @route   GET /api/student/enrollment/student/:studentId
 * @desc    Get all enrollments for a student (History)
 * @access  Admin/School
 */
exports.getEnrollmentsByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const enrollments = await prisma_1.prisma.studentEnrollment.findMany({
        where: { studentId: studentId },
        orderBy: { enrollmentDate: "desc" },
        include: {
            section: {
                include: { class: true }
            },
            academicYear: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Student enrollments retrieved successfully", enrollments);
});
/**
 * @route   GET /api/student/enrollment/:id
 * @desc    Get enrollment by ID
 * @access  Admin/School
 */
exports.getEnrollmentById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const enrollment = await prisma_1.prisma.studentEnrollment.findUnique({
        where: { id: id },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    admissionNumber: true,
                    profilePicture: true
                }
            },
            section: {
                include: { class: true }
            },
            academicYear: true
        }
    });
    if (!enrollment) {
        throw new response_util_1.ErrorResponse("Enrollment not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Enrollment retrieved successfully", enrollment);
});
/**
 * @route   PUT /api/student/enrollment/:id
 * @desc    Update enrollment details (e.g. change section, update roll number)
 * @access  Admin/School
 */
exports.updateEnrollment = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = enrollment_validation_1.updateEnrollmentSchema.parse(req.body);
    const existingEnrollment = await prisma_1.prisma.studentEnrollment.findUnique({
        where: { id: id }
    });
    if (!existingEnrollment) {
        throw new response_util_1.ErrorResponse("Enrollment not found", types_1.statusCode.Not_Found);
    }
    // If changing section, verify new section exists and belongs to same school
    if (validatedData.sectionId) {
        const section = await prisma_1.prisma.section.findUnique({
            where: { id: validatedData.sectionId },
            include: {
                school: { select: { id: true } }
            }
        });
        if (!section)
            throw new response_util_1.ErrorResponse("Section not found", types_1.statusCode.Not_Found);
        // We need to check if the section belongs to the same school as the student
        // Fetch student's schoolId via original enrollment
        const student = await prisma_1.prisma.student.findUnique({ where: { id: existingEnrollment.studentId } });
        if (student && student.schoolId !== section.schoolId) {
            throw new response_util_1.ErrorResponse("New section must belong to the same school", types_1.statusCode.Bad_Request);
        }
    }
    const updateData = {};
    if (validatedData.sectionId)
        updateData.sectionId = validatedData.sectionId;
    if (validatedData.enrollmentDate)
        updateData.enrollmentDate = new Date(validatedData.enrollmentDate);
    if (validatedData.rollNumber !== undefined)
        updateData.rollNumber = validatedData.rollNumber;
    if (validatedData.isPromoted !== undefined)
        updateData.isPromoted = validatedData.isPromoted;
    if (validatedData.remarks !== undefined)
        updateData.remarks = validatedData.remarks;
    const updatedEnrollment = await prisma_1.prisma.studentEnrollment.update({
        where: { id: id },
        data: updateData,
        include: {
            section: {
                include: { class: true }
            },
            academicYear: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Enrollment updated successfully", updatedEnrollment);
});
/**
 * @route   DELETE /api/student/enrollment/:id
 * @desc    Delete enrollment
 * @access  Admin
 */
exports.deleteEnrollment = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const enrollment = await prisma_1.prisma.studentEnrollment.findUnique({
        where: { id: id }
    });
    if (!enrollment) {
        throw new response_util_1.ErrorResponse("Enrollment not found", types_1.statusCode.Not_Found);
    }
    await prisma_1.prisma.studentEnrollment.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Enrollment deleted successfully", null);
});
//# sourceMappingURL=enrollment.controller.js.map