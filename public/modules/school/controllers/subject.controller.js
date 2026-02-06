"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeSubjectFromClass = exports.updateClassSubject = exports.getSubjectsByClass = exports.assignSubjectToClass = exports.deleteSubject = exports.updateSubject = exports.getSubjectById = exports.getSubjectsBySchool = exports.createSubject = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const subject_validation_1 = require("../validation/subject.validation");
/**
 * @route   POST /api/school/subject
 * @desc    Create a new subject
 * @access  Admin/School
 */
exports.createSubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = subject_validation_1.createSubjectSchema.parse(req.body);
    // Check if school exists
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: validatedData.schoolId }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Check if subject with same code already exists for this school
    const existingSubject = await prisma_1.prisma.subject.findFirst({
        where: {
            schoolId: validatedData.schoolId,
            code: validatedData.code
        }
    });
    if (existingSubject) {
        throw new response_util_1.ErrorResponse(`Subject with code ${validatedData.code} already exists for this school`, types_1.statusCode.Conflict);
    }
    // Create subject
    const subject = await prisma_1.prisma.subject.create({
        data: {
            schoolId: validatedData.schoolId,
            name: validatedData.name,
            code: validatedData.code,
            description: validatedData.description || null,
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject created successfully", subject, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/subject/school/:schoolId
 * @desc    Get all subjects for a school
 * @access  Admin/School
 */
exports.getSubjectsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive } = req.query;
    const where = { schoolId: schoolId };
    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }
    const subjects = await prisma_1.prisma.subject.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
            _count: {
                select: {
                    classSubjects: true,
                    teacherSubjects: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subjects retrieved successfully", subjects);
});
/**
 * @route   GET /api/school/subject/:id
 * @desc    Get subject by ID
 * @access  Admin/School
 */
exports.getSubjectById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const subject = await prisma_1.prisma.subject.findUnique({
        where: { id: id },
        include: {
            school: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            classSubjects: {
                include: {
                    class: {
                        select: {
                            id: true,
                            name: true,
                            grade: true
                        }
                    }
                }
            },
            _count: {
                select: {
                    classSubjects: true,
                    teacherSubjects: true
                }
            }
        }
    });
    if (!subject) {
        throw new response_util_1.ErrorResponse("Subject not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Subject retrieved successfully", subject);
});
/**
 * @route   PUT /api/school/subject/:id
 * @desc    Update subject
 * @access  Admin/School
 */
exports.updateSubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = subject_validation_1.updateSubjectSchema.parse(req.body);
    const existingSubject = await prisma_1.prisma.subject.findUnique({
        where: { id: id }
    });
    if (!existingSubject) {
        throw new response_util_1.ErrorResponse("Subject not found", types_1.statusCode.Not_Found);
    }
    const updateData = {};
    if (validatedData.name)
        updateData.name = validatedData.name;
    if (validatedData.description !== undefined)
        updateData.description = validatedData.description;
    if (validatedData.isActive !== undefined)
        updateData.isActive = validatedData.isActive;
    const updatedSubject = await prisma_1.prisma.subject.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject updated successfully", updatedSubject);
});
/**
 * @route   DELETE /api/school/subject/:id
 * @desc    Delete subject
 * @access  Admin
 */
exports.deleteSubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const subject = await prisma_1.prisma.subject.findUnique({
        where: { id: id },
        include: {
            _count: {
                select: {
                    classSubjects: true,
                    teacherSubjects: true
                }
            }
        }
    });
    if (!subject) {
        throw new response_util_1.ErrorResponse("Subject not found", types_1.statusCode.Not_Found);
    }
    // Check if subject has assignments
    const hasAssignments = subject._count.classSubjects > 0 ||
        subject._count.teacherSubjects > 0;
    if (hasAssignments) {
        throw new response_util_1.ErrorResponse("Cannot delete subject with existing class or teacher assignments", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.subject.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject deleted successfully", null);
});
/**
 * @route   POST /api/school/subject/assign-to-class
 * @desc    Assign subject to a class
 * @access  Admin/School
 */
exports.assignSubjectToClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = subject_validation_1.assignSubjectToClassSchema.parse(req.body);
    // Check if class exists
    const classData = await prisma_1.prisma.class.findUnique({
        where: { id: validatedData.classId }
    });
    if (!classData) {
        throw new response_util_1.ErrorResponse("Class not found", types_1.statusCode.Not_Found);
    }
    // Check if subject exists
    const subject = await prisma_1.prisma.subject.findUnique({
        where: { id: validatedData.subjectId }
    });
    if (!subject) {
        throw new response_util_1.ErrorResponse("Subject not found", types_1.statusCode.Not_Found);
    }
    // Verify subject belongs to the same school as class
    if (subject.schoolId !== classData.schoolId) {
        throw new response_util_1.ErrorResponse("Subject and class must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // Check if assignment already exists
    const existingAssignment = await prisma_1.prisma.classSubject.findFirst({
        where: {
            classId: validatedData.classId,
            subjectId: validatedData.subjectId
        }
    });
    if (existingAssignment) {
        throw new response_util_1.ErrorResponse("This subject is already assigned to this class", types_1.statusCode.Conflict);
    }
    // Create assignment
    const classSubject = await prisma_1.prisma.classSubject.create({
        data: {
            classId: validatedData.classId,
            subjectId: validatedData.subjectId,
            isCompulsory: validatedData.isCompulsory ?? true
        },
        include: {
            class: {
                select: {
                    id: true,
                    name: true,
                    grade: true
                }
            },
            subject: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject assigned to class successfully", classSubject, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/subject/class/:classId
 * @desc    Get all subjects for a class
 * @access  Admin/School
 */
exports.getSubjectsByClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { classId } = req.params;
    const classSubjects = await prisma_1.prisma.classSubject.findMany({
        where: { classId: classId },
        include: {
            subject: true,
            class: {
                select: {
                    id: true,
                    name: true,
                    grade: true
                }
            }
        },
        orderBy: {
            subject: {
                name: "asc"
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Class subjects retrieved successfully", classSubjects);
});
/**
 * @route   PUT /api/school/subject/class-subject/:id
 * @desc    Update class subject assignment
 * @access  Admin/School
 */
exports.updateClassSubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = subject_validation_1.updateClassSubjectSchema.parse(req.body);
    const existingAssignment = await prisma_1.prisma.classSubject.findUnique({
        where: { id: id }
    });
    if (!existingAssignment) {
        throw new response_util_1.ErrorResponse("Class subject assignment not found", types_1.statusCode.Not_Found);
    }
    const updatedAssignment = await prisma_1.prisma.classSubject.update({
        where: { id: id },
        data: {
            isCompulsory: validatedData.isCompulsory
        },
        include: {
            class: {
                select: {
                    id: true,
                    name: true,
                    grade: true
                }
            },
            subject: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Class subject assignment updated successfully", updatedAssignment);
});
/**
 * @route   DELETE /api/school/subject/class-subject/:id
 * @desc    Remove subject from class
 * @access  Admin
 */
exports.removeSubjectFromClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const classSubject = await prisma_1.prisma.classSubject.findUnique({
        where: { id: id }
    });
    if (!classSubject) {
        throw new response_util_1.ErrorResponse("Class subject assignment not found", types_1.statusCode.Not_Found);
    }
    await prisma_1.prisma.classSubject.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject removed from class successfully", null);
});
//# sourceMappingURL=subject.controller.js.map