"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeExamSubject = exports.addExamSubject = exports.deleteExam = exports.updateExam = exports.getExamById = exports.getExamsBySchool = exports.createExam = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const exam_validation_1 = require("../validation/exam.validation");
/**
 * @route   POST /api/exam
 * @desc    Create new exam with subjects
 * @access  Admin/School
 */
exports.createExam = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = exam_validation_1.createExamSchema.parse(req.body);
    // Validate school, academic year, and class
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    const academicYear = await prisma_1.prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
    if (!academicYear)
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    const classEntity = await prisma_1.prisma.class.findUnique({ where: { id: validatedData.classId } });
    if (!classEntity)
        throw new response_util_1.ErrorResponse("Class not found", types_1.statusCode.Not_Found);
    // Check same school
    if (academicYear.schoolId !== validatedData.schoolId || classEntity.schoolId !== validatedData.schoolId) {
        throw new response_util_1.ErrorResponse("Academic year and class must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // Check duplicate
    const existing = await prisma_1.prisma.exam.findUnique({
        where: {
            schoolId_academicYearId_classId_name: {
                schoolId: validatedData.schoolId,
                academicYearId: validatedData.academicYearId,
                classId: validatedData.classId,
                name: validatedData.name
            }
        }
    });
    if (existing) {
        throw new response_util_1.ErrorResponse("Exam with this name already exists for this class", types_1.statusCode.Conflict);
    }
    // Create exam with subjects
    const exam = await prisma_1.prisma.exam.create({
        data: {
            schoolId: validatedData.schoolId,
            academicYearId: validatedData.academicYearId,
            classId: validatedData.classId,
            name: validatedData.name,
            examType: validatedData.examType,
            startDate: new Date(validatedData.startDate),
            endDate: new Date(validatedData.endDate),
            maxMarks: validatedData.maxMarks ?? 100,
            passingPercentage: validatedData.passingPercentage ?? 33,
            description: validatedData.description,
            isActive: validatedData.isActive ?? true,
            examSubjects: {
                create: validatedData.subjects.map(subject => ({
                    subjectId: subject.subjectId,
                    examDate: subject.examDate ? new Date(subject.examDate) : null,
                    startTime: subject.startTime,
                    endTime: subject.endTime,
                    maxMarks: subject.maxMarks ?? 100,
                    passingMarks: subject.passingMarks ?? 33,
                    isOptional: subject.isOptional ?? false
                }))
            }
        },
        include: {
            class: true,
            academicYear: true,
            examSubjects: { include: { subject: true } }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Exam created successfully", exam, types_1.statusCode.Created);
});
/**
 * @route   GET /api/exam/school/:schoolId
 * @desc    Get all exams for a school
 * @access  Admin/School
 */
exports.getExamsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { academicYearId, classId, examType, isActive } = req.query;
    const where = { schoolId: schoolId };
    if (academicYearId)
        where.academicYearId = academicYearId;
    if (classId)
        where.classId = classId;
    if (examType)
        where.examType = examType;
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    const exams = await prisma_1.prisma.exam.findMany({
        where,
        include: {
            class: true,
            academicYear: true,
            examSubjects: {
                include: {
                    subject: true
                }
            },
            _count: { select: { examSubjects: true, studentResults: true } }
        },
        orderBy: [{ startDate: "desc" }]
    });
    return (0, response_util_1.SuccessResponse)(res, "Exams retrieved successfully", exams);
});
/**
 * @route   GET /api/exam/:id
 * @desc    Get exam by ID with all details
 * @access  Admin/School/Teacher
 */
exports.getExamById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const exam = await prisma_1.prisma.exam.findUnique({
        where: { id: id },
        include: {
            class: true,
            academicYear: true,
            examSubjects: {
                include: {
                    subject: true,
                    _count: { select: { studentMarks: true } }
                }
            },
            _count: { select: { studentResults: true } }
        }
    });
    if (!exam)
        throw new response_util_1.ErrorResponse("Exam not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Exam retrieved successfully", exam);
});
/**
 * @route   PUT /api/exam/:id
 * @desc    Update exam
 * @access  Admin/School
 */
exports.updateExam = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = exam_validation_1.updateExamSchema.parse(req.body);
    const existing = await prisma_1.prisma.exam.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Exam not found", types_1.statusCode.Not_Found);
    const updateData = { ...validatedData };
    if (validatedData.startDate)
        updateData.startDate = new Date(validatedData.startDate);
    if (validatedData.endDate)
        updateData.endDate = new Date(validatedData.endDate);
    // If subjects are provided, handle synchronization
    if (validatedData.subjects) {
        // 1. Delete subjects not in the new list
        const subjectIds = validatedData.subjects.map(s => s.subjectId);
        // Check if we can delete removed subjects (optional safety check, or let DB constraints handle it)
        await prisma_1.prisma.examSubject.deleteMany({
            where: {
                examId: id,
                subjectId: { notIn: subjectIds }
            }
        });
        // 2. Upsert subjects
        for (const subject of validatedData.subjects) {
            await prisma_1.prisma.examSubject.upsert({
                where: {
                    examId_subjectId: {
                        examId: id,
                        subjectId: subject.subjectId
                    }
                },
                create: {
                    examId: id,
                    subjectId: subject.subjectId,
                    examDate: subject.examDate ? new Date(subject.examDate) : null,
                    startTime: subject.startTime,
                    endTime: subject.endTime,
                    maxMarks: subject.maxMarks ?? 100,
                    passingMarks: subject.passingMarks ?? 33,
                    isOptional: subject.isOptional ?? false
                },
                update: {
                    examDate: subject.examDate ? new Date(subject.examDate) : null,
                    startTime: subject.startTime,
                    endTime: subject.endTime,
                    maxMarks: subject.maxMarks ?? 100,
                    passingMarks: subject.passingMarks ?? 33,
                    isOptional: subject.isOptional ?? false
                }
            });
        }
    }
    // Remove subjects from updateData to avoid Prisma error (since it's not a direct field)
    delete updateData.subjects;
    const exam = await prisma_1.prisma.exam.update({
        where: { id: id },
        data: updateData,
        include: {
            class: true,
            academicYear: true,
            examSubjects: { include: { subject: true } }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Exam updated successfully", exam);
});
/**
 * @route   DELETE /api/exam/:id
 * @desc    Delete exam
 * @access  Admin
 */
exports.deleteExam = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const exam = await prisma_1.prisma.exam.findUnique({
        where: { id: id },
        include: { _count: { select: { studentResults: true } } }
    });
    if (!exam)
        throw new response_util_1.ErrorResponse("Exam not found", types_1.statusCode.Not_Found);
    const resultCount = exam._count?.studentResults ?? 0;
    if (resultCount > 0) {
        throw new response_util_1.ErrorResponse("Cannot delete exam with published results", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.exam.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Exam deleted successfully", null);
});
/**
 * @route   POST /api/exam/subject
 * @desc    Add subject to exam
 * @access  Admin/School
 */
exports.addExamSubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = exam_validation_1.addExamSubjectSchema.parse(req.body);
    const exam = await prisma_1.prisma.exam.findUnique({ where: { id: validatedData.examId } });
    if (!exam)
        throw new response_util_1.ErrorResponse("Exam not found", types_1.statusCode.Not_Found);
    const subject = await prisma_1.prisma.subject.findUnique({ where: { id: validatedData.subjectId } });
    if (!subject)
        throw new response_util_1.ErrorResponse("Subject not found", types_1.statusCode.Not_Found);
    // Check unique constraint
    const existingSubject = await prisma_1.prisma.examSubject.findUnique({
        where: {
            examId_subjectId: {
                examId: validatedData.examId,
                subjectId: validatedData.subjectId
            }
        }
    });
    if (existingSubject) {
        throw new response_util_1.ErrorResponse("This subject is already added to the exam", types_1.statusCode.Conflict);
    }
    const examSubject = await prisma_1.prisma.examSubject.create({
        data: {
            examId: validatedData.examId,
            subjectId: validatedData.subjectId,
            examDate: validatedData.examDate ? new Date(validatedData.examDate) : null,
            startTime: validatedData.startTime,
            endTime: validatedData.endTime,
            maxMarks: validatedData.maxMarks ?? 100,
            passingMarks: validatedData.passingMarks ?? 33,
            isOptional: validatedData.isOptional ?? false
        },
        include: { subject: true }
    });
    return (0, response_util_1.SuccessResponse)(res, "Subject added to exam successfully", examSubject, types_1.statusCode.Created);
});
/**
 * @route   DELETE /api/exam/subject/:id
 * @desc    Remove subject from exam
 * @access  Admin/School
 */
exports.removeExamSubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const examSubject = await prisma_1.prisma.examSubject.findUnique({
        where: { id: id },
        include: { _count: { select: { studentMarks: true } } }
    });
    if (!examSubject)
        throw new response_util_1.ErrorResponse("Exam subject not found", types_1.statusCode.Not_Found);
    const markCount = examSubject._count?.studentMarks ?? 0;
    if (markCount > 0) {
        throw new response_util_1.ErrorResponse("Cannot delete subject with entered marks", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.examSubject.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Subject removed from exam successfully", null);
});
//# sourceMappingURL=exam.controller.js.map