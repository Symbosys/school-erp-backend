"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMark = exports.updateMark = exports.getMarksByExam = exports.getMarksByStudent = exports.getMarksBySubject = exports.enterMarks = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const marks_validation_1 = require("../validation/marks.validation");
/**
 * @route   POST /api/exam/marks
 * @desc    Enter marks for multiple students in a subject (auto-generates results)
 * @access  Admin/School/Teacher
 */
exports.enterMarks = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = marks_validation_1.enterMarksSchema.parse(req.body);
    // Validate exam subject
    const examSubject = await prisma_1.prisma.examSubject.findUnique({
        where: { id: validatedData.examSubjectId },
        include: { exam: true }
    });
    if (!examSubject)
        throw new response_util_1.ErrorResponse("Exam subject not found", types_1.statusCode.Not_Found);
    const results = [];
    const affectedStudentIds = new Set();
    for (const mark of validatedData.marks) {
        // Check if student exists
        const student = await prisma_1.prisma.student.findUnique({ where: { id: mark.studentId } });
        if (!student)
            continue;
        // Upsert mark (create or update)
        const studentMark = await prisma_1.prisma.studentMark.upsert({
            where: {
                examSubjectId_studentId: {
                    examSubjectId: validatedData.examSubjectId,
                    studentId: mark.studentId
                }
            },
            update: {
                marksObtained: mark.isAbsent ? 0 : mark.marksObtained,
                isAbsent: mark.isAbsent ?? false,
                remarks: mark.remarks,
                enteredBy: validatedData.enteredBy
            },
            create: {
                examSubjectId: validatedData.examSubjectId,
                studentId: mark.studentId,
                marksObtained: mark.isAbsent ? 0 : mark.marksObtained,
                isAbsent: mark.isAbsent ?? false,
                remarks: mark.remarks,
                enteredBy: validatedData.enteredBy
            }
        });
        results.push(studentMark);
        affectedStudentIds.add(mark.studentId);
    }
    // ===== AUTO-GENERATE RESULTS FOR AFFECTED STUDENTS =====
    const examId = examSubject.examId;
    // Get full exam with all subjects and marks
    const exam = await prisma_1.prisma.exam.findUnique({
        where: { id: examId },
        include: {
            examSubjects: {
                include: { studentMarks: true }
            }
        }
    });
    if (exam) {
        // Helper: Get grade from percentage
        const getGradeFromPercentage = async (schoolId, percentage) => {
            const gradeScale = await prisma_1.prisma.gradeScale.findFirst({
                where: {
                    schoolId,
                    isActive: true,
                    minPercentage: { lte: percentage },
                    maxPercentage: { gte: percentage }
                }
            });
            return gradeScale ? { grade: gradeScale.name, gradePoint: gradeScale.gradePoint } : null;
        };
        // Generate result for each affected student
        for (const studentId of affectedStudentIds) {
            let totalMarks = 0;
            let maxMarks = 0;
            let subjectCount = 0;
            let hasFailedSubject = false;
            let hasAbsent = false;
            for (const subject of exam.examSubjects) {
                const mark = subject.studentMarks.find(m => m.studentId === studentId);
                if (mark) {
                    totalMarks += Number(mark.marksObtained);
                    maxMarks += subject.maxMarks;
                    subjectCount++;
                    if (mark.isAbsent) {
                        hasAbsent = true;
                    }
                    if (Number(mark.marksObtained) < Number(subject.passingMarks)) {
                        hasFailedSubject = true;
                    }
                }
            }
            if (subjectCount === 0)
                continue;
            const percentage = (totalMarks / maxMarks) * 100;
            const passingPercentage = Number(exam.passingPercentage);
            // Student fails if: failed any subject OR absent OR overall percentage below passing
            let status = "PASS";
            if (hasAbsent || hasFailedSubject || percentage < passingPercentage) {
                status = "FAIL";
            }
            // Get grade
            const gradeInfo = await getGradeFromPercentage(exam.schoolId, percentage);
            // Upsert result
            await prisma_1.prisma.studentResult.upsert({
                where: {
                    examId_studentId: {
                        examId: examId,
                        studentId
                    }
                },
                update: {
                    totalMarks,
                    maxMarks,
                    percentage: Math.round(percentage * 100) / 100,
                    grade: gradeInfo?.grade,
                    gradePoint: gradeInfo?.gradePoint,
                    status
                },
                create: {
                    examId: examId,
                    studentId,
                    totalMarks,
                    maxMarks,
                    percentage: Math.round(percentage * 100) / 100,
                    grade: gradeInfo?.grade,
                    gradePoint: gradeInfo?.gradePoint,
                    status
                }
            });
        }
        // Recalculate ranks for all students in this exam
        const allResults = await prisma_1.prisma.studentResult.findMany({
            where: { examId },
            orderBy: { percentage: "desc" }
        });
        for (let i = 0; i < allResults.length; i++) {
            const result = allResults[i];
            if (result) {
                await prisma_1.prisma.studentResult.update({
                    where: { id: result.id },
                    data: { rank: i + 1 }
                });
            }
        }
    }
    // ===== END AUTO-GENERATE RESULTS =====
    return (0, response_util_1.SuccessResponse)(res, `Marks entered for ${results.length} students (results auto-generated)`, results, types_1.statusCode.Created);
});
/**
 * @route   GET /api/exam/marks/subject/:examSubjectId
 * @desc    Get all marks for a subject
 * @access  Admin/School/Teacher
 */
exports.getMarksBySubject = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { examSubjectId } = req.params;
    const examSubject = await prisma_1.prisma.examSubject.findUnique({
        where: { id: examSubjectId },
        include: { subject: true, exam: true }
    });
    if (!examSubject)
        throw new response_util_1.ErrorResponse("Exam subject not found", types_1.statusCode.Not_Found);
    const marks = await prisma_1.prisma.studentMark.findMany({
        where: { examSubjectId: examSubjectId },
        include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }
        },
        orderBy: { student: { firstName: "asc" } }
    });
    return (0, response_util_1.SuccessResponse)(res, "Marks retrieved successfully", {
        examSubject,
        marks
    });
});
/**
 * @route   GET /api/exam/marks/student/:studentId
 * @desc    Get all marks for a student across exams
 * @access  Admin/School/Parent/Student
 */
exports.getMarksByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const { examId } = req.query;
    const where = { studentId: studentId };
    if (examId) {
        where.examSubject = { examId: examId };
    }
    const marks = await prisma_1.prisma.studentMark.findMany({
        where,
        include: {
            examSubject: {
                include: {
                    subject: true,
                    exam: { select: { id: true, name: true, examType: true } }
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Student marks retrieved successfully", marks);
});
/**
 * @route   GET /api/exam/marks/exam/:examId
 * @desc    Get all marks for an exam (all subjects)
 * @access  Admin/School/Teacher
 */
exports.getMarksByExam = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { examId } = req.params;
    const exam = await prisma_1.prisma.exam.findUnique({
        where: { id: examId },
        include: {
            class: true,
            examSubjects: {
                include: {
                    subject: true,
                    studentMarks: {
                        include: {
                            student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }
                        }
                    }
                }
            }
        }
    });
    if (!exam)
        throw new response_util_1.ErrorResponse("Exam not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Exam marks retrieved successfully", exam);
});
/**
 * @route   PUT /api/exam/marks/:id
 * @desc    Update single mark
 * @access  Admin/School/Teacher
 */
exports.updateMark = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = marks_validation_1.updateMarkSchema.parse(req.body);
    const existing = await prisma_1.prisma.studentMark.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Mark not found", types_1.statusCode.Not_Found);
    const mark = await prisma_1.prisma.studentMark.update({
        where: { id: id },
        data: validatedData,
        include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            examSubject: { include: { subject: true } }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Mark updated successfully", mark);
});
/**
 * @route   DELETE /api/exam/marks/:id
 * @desc    Delete mark
 * @access  Admin/School
 */
exports.deleteMark = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const mark = await prisma_1.prisma.studentMark.findUnique({ where: { id: id } });
    if (!mark)
        throw new response_util_1.ErrorResponse("Mark not found", types_1.statusCode.Not_Found);
    await prisma_1.prisma.studentMark.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Mark deleted successfully", null);
});
//# sourceMappingURL=marks.controller.js.map