"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResultById = exports.getResultsByStudent = exports.getResultsByExam = exports.generateResults = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const result_validation_1 = require("../validation/result.validation");
/**
 * Helper: Get grade from percentage based on school's grade scale
 */
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
/**
 * @route   POST /api/exam/result/generate
 * @desc    Generate results for all students in an exam
 * @access  Admin/School
 */
exports.generateResults = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = result_validation_1.generateResultsSchema.parse(req.body);
    const exam = await prisma_1.prisma.exam.findUnique({
        where: { id: validatedData.examId },
        include: {
            examSubjects: {
                include: { studentMarks: true }
            }
        }
    });
    if (!exam)
        throw new response_util_1.ErrorResponse("Exam not found", types_1.statusCode.Not_Found);
    // Get all students who have marks in this exam
    const studentIds = new Set();
    for (const subject of exam.examSubjects) {
        for (const mark of subject.studentMarks) {
            studentIds.add(mark.studentId);
        }
    }
    const results = [];
    const studentArray = Array.from(studentIds);
    for (const studentId of studentArray) {
        // Calculate total marks for this student
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
                // Check if student is absent
                if (mark.isAbsent) {
                    hasAbsent = true;
                }
                // Check if student failed this subject (marks < passing marks)
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
        const result = await prisma_1.prisma.studentResult.upsert({
            where: {
                examId_studentId: {
                    examId: validatedData.examId,
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
                examId: validatedData.examId,
                studentId,
                totalMarks,
                maxMarks,
                percentage: Math.round(percentage * 100) / 100,
                grade: gradeInfo?.grade,
                gradePoint: gradeInfo?.gradePoint,
                status
            }
        });
        results.push(result);
    }
    // Calculate ranks
    results.sort((a, b) => Number(b.percentage) - Number(a.percentage));
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result) {
            await prisma_1.prisma.studentResult.update({
                where: { id: result.id },
                data: { rank: i + 1 }
            });
            result.rank = i + 1;
        }
    }
    return (0, response_util_1.SuccessResponse)(res, `Results generated for ${results.length} students`, results, types_1.statusCode.Created);
});
/**
 * @route   GET /api/exam/result/exam/:examId
 * @desc    Get all results for an exam
 * @access  Admin/School/Teacher
 */
exports.getResultsByExam = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { examId } = req.params;
    const results = await prisma_1.prisma.studentResult.findMany({
        where: { examId: examId },
        include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }
        },
        orderBy: { rank: "asc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Results retrieved successfully", results);
});
/**
 * @route   GET /api/exam/result/student/:studentId
 * @desc    Get all results for a student
 * @access  Admin/School/Parent/Student
 */
exports.getResultsByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const { academicYearId } = req.query;
    const where = { studentId: studentId };
    if (academicYearId) {
        where.exam = { academicYearId: academicYearId };
    }
    const results = await prisma_1.prisma.studentResult.findMany({
        where,
        include: {
            exam: {
                include: { class: true, academicYear: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });
    // Fetch subject marks for each result
    const jsonResults = JSON.parse(JSON.stringify(results));
    const resultsWithMarks = await Promise.all(jsonResults.map(async (result) => {
        const subjectMarks = await prisma_1.prisma.studentMark.findMany({
            where: {
                studentId: result.studentId,
                examSubject: { examId: result.examId }
            },
            include: {
                examSubject: {
                    include: { subject: true }
                }
            }
        });
        return { ...result, subjectMarks };
    }));
    return (0, response_util_1.SuccessResponse)(res, "Student results retrieved successfully", resultsWithMarks);
});
/**
 * @route   GET /api/exam/result/:id
 * @desc    Get result by ID with full details
 * @access  Admin/School/Parent/Student
 */
exports.getResultById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const result = await prisma_1.prisma.studentResult.findUnique({
        where: { id: id },
        include: {
            student: true,
            exam: {
                include: {
                    class: true,
                    academicYear: true,
                    examSubjects: {
                        include: {
                            subject: true,
                            studentMarks: {
                                where: { studentId: { not: undefined } }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!result)
        throw new response_util_1.ErrorResponse("Result not found", types_1.statusCode.Not_Found);
    // Get subject-wise marks for this student
    const subjectMarks = await prisma_1.prisma.studentMark.findMany({
        where: {
            studentId: result.studentId,
            examSubject: { examId: result.examId }
        },
        include: {
            examSubject: { include: { subject: true } }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Result retrieved successfully", { ...result, subjectMarks });
});
//# sourceMappingURL=result.controller.js.map