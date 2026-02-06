"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSubjectFromTeacher = exports.updateTeacherSubject = exports.getTeachersBySubject = exports.getSubjectsByTeacher = exports.assignSubjectToTeacher = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const teacherSubject_validation_1 = require("../validation/teacherSubject.validation");
/**
 * @route   POST /api/teacher/subject
 * @desc    Assign a subject to a teacher
 * @access  Admin/School
 */
exports.assignSubjectToTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = teacherSubject_validation_1.assignTeacherSubjectSchema.parse(req.body);
    // Check if teacher exists
    const teacher = await prisma_1.prisma.teacher.findUnique({
        where: { id: validatedData.teacherId }
    });
    if (!teacher) {
        throw new response_util_1.ErrorResponse("Teacher not found", types_1.statusCode.Not_Found);
    }
    // Check if subject exists
    const subject = await prisma_1.prisma.subject.findUnique({
        where: { id: validatedData.subjectId }
    });
    if (!subject) {
        throw new response_util_1.ErrorResponse("Subject not found", types_1.statusCode.Not_Found);
    }
    // Verify same school
    if (teacher.schoolId !== subject.schoolId) {
        throw new response_util_1.ErrorResponse("Teacher and Subject must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // Check if assignment already exists
    const existingAssignment = await prisma_1.prisma.teacherSubject.findUnique({
        where: {
            teacherId_subjectId: {
                teacherId: validatedData.teacherId,
                subjectId: validatedData.subjectId
            }
        }
    });
    if (existingAssignment) {
        throw new response_util_1.ErrorResponse("This subject is already assigned to this teacher", types_1.statusCode.Conflict);
    }
    const teacherSubject = await prisma_1.prisma.teacherSubject.create({
        data: {
            teacherId: validatedData.teacherId,
            subjectId: validatedData.subjectId,
            isPrimary: validatedData.isPrimary ?? false
        },
        include: {
            subject: true,
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    employeeId: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject assigned to teacher successfully", teacherSubject, types_1.statusCode.Created);
});
/**
 * @route   GET /api/teacher/subject/teacher/:teacherId
 * @desc    Get all subjects assigned to a teacher
 * @access  Admin/School
 */
exports.getSubjectsByTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { teacherId } = req.params;
    const teacherSubjects = await prisma_1.prisma.teacherSubject.findMany({
        where: { teacherId: teacherId },
        include: {
            subject: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher subjects retrieved successfully", teacherSubjects);
});
/**
 * @route   GET /api/teacher/subject/subject/:subjectId
 * @desc    Get all teachers assigned to a subject
 * @access  Admin/School
 */
exports.getTeachersBySubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { subjectId } = req.params;
    const subjectTeachers = await prisma_1.prisma.teacherSubject.findMany({
        where: { subjectId: subjectId },
        include: {
            teacher: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    employeeId: true,
                    email: true,
                    phone: true,
                    profilePicture: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject teachers retrieved successfully", subjectTeachers);
});
/**
 * @route   PUT /api/teacher/subject/:id
 * @desc    Update teacher subject assignment (e.g. set as primary)
 * @access  Admin/School
 */
exports.updateTeacherSubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = teacherSubject_validation_1.updateTeacherSubjectSchema.parse(req.body);
    const existingAssignment = await prisma_1.prisma.teacherSubject.findUnique({
        where: { id: id }
    });
    if (!existingAssignment) {
        throw new response_util_1.ErrorResponse("Assignment not found", types_1.statusCode.Not_Found);
    }
    const updatedAssignment = await prisma_1.prisma.teacherSubject.update({
        where: { id: id },
        data: {
            isPrimary: validatedData.isPrimary
        },
        include: {
            subject: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Assignment updated successfully", updatedAssignment);
});
/**
 * @route   DELETE /api/teacher/subject/:id
 * @desc    Remove subject from teacher
 * @access  Admin/School
 */
exports.removeSubjectFromTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const assignment = await prisma_1.prisma.teacherSubject.findUnique({
        where: { id: id }
    });
    if (!assignment) {
        throw new response_util_1.ErrorResponse("Assignment not found", types_1.statusCode.Not_Found);
    }
    await prisma_1.prisma.teacherSubject.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject removed from teacher successfully", null);
});
//# sourceMappingURL=teacherSubject.controller.js.map