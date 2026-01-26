import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { generateResultsSchema } from "../validation/result.validation";

/**
 * Helper: Get grade from percentage based on school's grade scale
 */
const getGradeFromPercentage = async (schoolId: string, percentage: number) => {
  const gradeScale = await prisma.gradeScale.findFirst({
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
export const generateResults = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = generateResultsSchema.parse(req.body);

  const exam = await prisma.exam.findUnique({
    where: { id: validatedData.examId },
    include: {
      examSubjects: {
        include: { studentMarks: true }
      }
    }
  });

  if (!exam) throw new ErrorResponse("Exam not found", statusCode.Not_Found);

  // Get all students who have marks in this exam
  const studentIds = new Set<string>();
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

    if (subjectCount === 0) continue;

    const percentage = (totalMarks / maxMarks) * 100;
    const passingPercentage = Number(exam.passingPercentage);

    // Student fails if: failed any subject OR absent OR overall percentage below passing
    let status: "PASS" | "FAIL" = "PASS";
    if (hasAbsent || hasFailedSubject || percentage < passingPercentage) {
      status = "FAIL";
    }

    // Get grade
    const gradeInfo = await getGradeFromPercentage(exam.schoolId, percentage);

    // Upsert result
    const result = await prisma.studentResult.upsert({
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
      await prisma.studentResult.update({
        where: { id: result.id },
        data: { rank: i + 1 }
      });
      result.rank = i + 1;
    }
  }


  return SuccessResponse(res, `Results generated for ${results.length} students`, results, statusCode.Created);
});

/**
 * @route   GET /api/exam/result/exam/:examId
 * @desc    Get all results for an exam
 * @access  Admin/School/Teacher
 */
export const getResultsByExam = asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params;

  const results = await prisma.studentResult.findMany({
    where: { examId: examId as string },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }
    },
    orderBy: { rank: "asc" }
  });

  return SuccessResponse(res, "Results retrieved successfully", results);
});

/**
 * @route   GET /api/exam/result/student/:studentId
 * @desc    Get all results for a student
 * @access  Admin/School/Parent/Student
 */
export const getResultsByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { academicYearId } = req.query;

  const where: any = { studentId: studentId as string };
  if (academicYearId) {
    where.exam = { academicYearId: academicYearId as string };
  }

  const results = await prisma.studentResult.findMany({
    where,
    include: {
      exam: {
        include: { class: true, academicYear: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Student results retrieved successfully", results);
});

/**
 * @route   GET /api/exam/result/:id
 * @desc    Get result by ID with full details
 * @access  Admin/School/Parent/Student
 */
export const getResultById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const result = await prisma.studentResult.findUnique({
    where: { id: id as string },
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

  if (!result) throw new ErrorResponse("Result not found", statusCode.Not_Found);

  // Get subject-wise marks for this student
  const subjectMarks = await prisma.studentMark.findMany({
    where: {
      studentId: result.studentId,
      examSubject: { examId: result.examId }
    },
    include: {
      examSubject: { include: { subject: true } }
    }
  });

  return SuccessResponse(res, "Result retrieved successfully", { ...result, subjectMarks });
});
