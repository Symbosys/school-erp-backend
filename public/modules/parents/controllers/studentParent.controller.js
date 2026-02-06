"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeParentFromStudent = exports.updateStudentParentRelation = exports.getParentsByStudent = exports.assignParentToStudent = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const studentParent_validation_1 = require("../validation/studentParent.validation");
/**
 * @route   POST /api/parents/assign
 * @desc    Assign a parent to a student
 * @access  Admin/School
 */
exports.assignParentToStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = studentParent_validation_1.assignStudentParentSchema.parse(req.body);
    // Check existence
    const student = await prisma_1.prisma.student.findUnique({ where: { id: validatedData.studentId } });
    if (!student)
        throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    const parent = await prisma_1.prisma.parent.findUnique({ where: { id: validatedData.parentId } });
    if (!parent)
        throw new response_util_1.ErrorResponse("Parent not found", types_1.statusCode.Not_Found);
    // Check same school
    if (student.schoolId !== parent.schoolId) {
        throw new response_util_1.ErrorResponse("Student and Parent must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // Check duplicate
    const existingRelation = await prisma_1.prisma.studentParent.findUnique({
        where: {
            studentId_parentId: {
                studentId: validatedData.studentId,
                parentId: validatedData.parentId
            }
        }
    });
    if (existingRelation) {
        throw new response_util_1.ErrorResponse("Parent is already assigned to this student", types_1.statusCode.Conflict);
    }
    // If set as primary, unset other primaries for this student (Optional logic, usually one primary)
    if (validatedData.isPrimary) {
        // We might want to allow multiple primaries (e.g. both parents), but let's assume we don't enforce uniqueness strictness here unless requested.
        // However, it's good practice to maybe check. But for now, just create.
    }
    const relation = await prisma_1.prisma.studentParent.create({
        data: {
            studentId: validatedData.studentId,
            parentId: validatedData.parentId,
            relationship: validatedData.relationship,
            isPrimary: validatedData.isPrimary ?? false
        },
        include: {
            student: {
                select: { id: true, firstName: true, lastName: true, admissionNumber: true }
            },
            parent: {
                select: { id: true, firstName: true, lastName: true, email: true, phone: true }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Parent assigned to student successfully", relation, types_1.statusCode.Created);
});
/**
 * @route   GET /api/parents/student/:studentId
 * @desc    Get all parents for a student
 * @access  Admin/School
 */
exports.getParentsByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const parents = await prisma_1.prisma.studentParent.findMany({
        where: { studentId: studentId },
        include: {
            parent: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Student parents retrieved successfully", parents);
});
/**
 * @route   PUT /api/parents/assign/:id
 * @desc    Update relationship details (e.g., isPrimary, relationship type)
 * @access  Admin/School
 */
exports.updateStudentParentRelation = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = studentParent_validation_1.updateStudentParentSchema.parse(req.body);
    const existingRelation = await prisma_1.prisma.studentParent.findUnique({ where: { id: id } });
    if (!existingRelation)
        throw new response_util_1.ErrorResponse("Relationship not found", types_1.statusCode.Not_Found);
    const updatedRelation = await prisma_1.prisma.studentParent.update({
        where: { id: id },
        data: validatedData,
        include: {
            parent: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Relationship updated successfully", updatedRelation);
});
/**
 * @route   DELETE /api/parents/assign/:id
 * @desc    Remove parent from student (Unlink)
 * @access  Admin/School
 */
exports.removeParentFromStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const relation = await prisma_1.prisma.studentParent.findUnique({ where: { id: id } });
    if (!relation)
        throw new response_util_1.ErrorResponse("Relationship not found", types_1.statusCode.Not_Found);
    await prisma_1.prisma.studentParent.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Parent removed from student successfully", null);
});
//# sourceMappingURL=studentParent.controller.js.map