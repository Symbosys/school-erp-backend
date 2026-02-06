"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeTeacherFromClass = exports.getAssignmentsByTeacher = exports.assignTeacherToClass = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const teacherClass_validation_1 = require("../validation/teacherClass.validation");
/**
 * @route   POST /api/teacher/class-assignment
 * @desc    Assign a teacher to a class/section (Class Teacher or Subject Teacher)
 * @access  Admin/School
 */
exports.assignTeacherToClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = teacherClass_validation_1.assignTeacherClassSchema.parse(req.body);
    // 1. Fetch all related entities to validate existence and school consistency
    const teacher = await prisma_1.prisma.teacher.findUnique({ where: { id: validatedData.teacherId } });
    if (!teacher)
        throw new response_util_1.ErrorResponse("Teacher not found", types_1.statusCode.Not_Found);
    const section = await prisma_1.prisma.section.findUnique({ where: { id: validatedData.sectionId } });
    if (!section)
        throw new response_util_1.ErrorResponse("Section not found", types_1.statusCode.Not_Found);
    const academicYear = await prisma_1.prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
    if (!academicYear)
        throw new response_util_1.ErrorResponse("Academic Year not found", types_1.statusCode.Not_Found);
    let subject = null;
    if (validatedData.subjectId) {
        subject = await prisma_1.prisma.subject.findUnique({ where: { id: validatedData.subjectId } });
        if (!subject)
            throw new response_util_1.ErrorResponse("Subject not found", types_1.statusCode.Not_Found);
    }
    // 2. Validate School Consistency
    const schoolId = teacher.schoolId;
    if (section.schoolId !== schoolId || academicYear.schoolId !== schoolId) {
        throw new response_util_1.ErrorResponse("All entities must belong to the same school", types_1.statusCode.Bad_Request);
    }
    if (subject && subject.schoolId !== schoolId) {
        throw new response_util_1.ErrorResponse("Subject must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // 3. Unique Class Teacher Validation
    // If trying to set as Class Teacher, check if one already exists for this section & year
    if (validatedData.isClassTeacher) {
        const existingClassTeacher = await prisma_1.prisma.teacherClassAssignment.findFirst({
            where: {
                sectionId: validatedData.sectionId,
                academicYearId: validatedData.academicYearId,
                isClassTeacher: true
            }
        });
        if (existingClassTeacher) {
            throw new response_util_1.ErrorResponse("This section already has a class teacher for the selected academic year", types_1.statusCode.Conflict);
        }
    }
    // 4. Duplicate Assignment Check
    const existingAssignment = await prisma_1.prisma.teacherClassAssignment.findFirst({
        where: {
            teacherId: validatedData.teacherId,
            sectionId: validatedData.sectionId,
            academicYearId: validatedData.academicYearId,
            subjectId: validatedData.subjectId || null // Explicitly handle undefined -> null
        }
    });
    if (existingAssignment) {
        throw new response_util_1.ErrorResponse("This assignment already exists for this teacher, section, and subject", types_1.statusCode.Conflict);
    }
    // 5. Create Assignment
    const assignment = await prisma_1.prisma.teacherClassAssignment.create({
        data: {
            teacherId: validatedData.teacherId,
            sectionId: validatedData.sectionId,
            academicYearId: validatedData.academicYearId,
            subjectId: validatedData.subjectId || null,
            isClassTeacher: validatedData.isClassTeacher ?? false
        },
        include: {
            teacher: {
                select: { id: true, firstName: true, lastName: true, employeeId: true }
            },
            section: {
                include: {
                    class: { select: { id: true, name: true, grade: true } }
                }
            },
            academicYear: { select: { id: true, name: true } },
            // cannot include subject if it's null in DB, but prisma handles relations well usually.
            // However, we can't conditionally include easily in the result type without casting. 
            // We'll trust Prisma to return null for the relation if ID is null.
        } // simple cast to avoid complex conditional type checking for now
    });
    // Re-fetch to get subject if it exists (Prisma include works fine even if null)
    // Or just rely on separate queries if needed, but include is better.
    // Actually, let's refine the include to be safe.
    const result = await prisma_1.prisma.teacherClassAssignment.findUnique({
        where: { id: assignment.id },
        include: {
            teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
            section: { include: { class: { select: { id: true, name: true, grade: true } } } },
            academicYear: { select: { id: true, name: true } }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher assigned to class successfully", result, types_1.statusCode.Created);
});
/**
 * @route   GET /api/teacher/class-assignment/teacher/:teacherId
 * @desc    Get all class assignments for a teacher
 * @access  Admin/School
 */
exports.getAssignmentsByTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { teacherId } = req.params;
    const { academicYearId } = req.query;
    const where = { teacherId: teacherId };
    if (academicYearId) {
        where.academicYearId = academicYearId;
    }
    const result = await prisma_1.prisma.teacherClassAssignment.findMany({
        where,
        include: {
            section: {
                include: {
                    class: { select: { id: true, name: true, grade: true } }
                }
            },
            academicYear: { select: { id: true, name: true } }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher assignments retrieved successfully", result);
});
/**
 * @route   DELETE /api/teacher/class-assignment/:id
 * @desc    Remove teacher from class assignment
 * @access  Admin/School
 */
exports.removeTeacherFromClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const assignment = await prisma_1.prisma.teacherClassAssignment.findUnique({
        where: { id: id }
    });
    if (!assignment) {
        throw new response_util_1.ErrorResponse("Assignment not found", types_1.statusCode.Not_Found);
    }
    await prisma_1.prisma.teacherClassAssignment.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher removed from class successfully", null);
});
//# sourceMappingURL=teacherClass.controller.js.map