import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  enterMarksSchema,
  updateMarkSchema,
} from "../validation/marks.validation";

/**
 * @route   POST /api/exam/marks
 * @desc    Enter marks for multiple students in a subject
 * @access  Admin/School/Teacher
 */
export const enterMarks = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = enterMarksSchema.parse(req.body);

  // Validate exam subject
  const examSubject = await prisma.examSubject.findUnique({
    where: { id: validatedData.examSubjectId },
    include: { exam: true }
  });

  if (!examSubject) throw new ErrorResponse("Exam subject not found", statusCode.Not_Found);

  const results = [];

  for (const mark of validatedData.marks) {
    // Check if student exists
    const student = await prisma.student.findUnique({ where: { id: mark.studentId } });
    if (!student) continue;

    // Upsert mark (create or update)
    const studentMark = await prisma.studentMark.upsert({
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
  }

  return SuccessResponse(res, `Marks entered for ${results.length} students`, results, statusCode.Created);
});

/**
 * @route   GET /api/exam/marks/subject/:examSubjectId
 * @desc    Get all marks for a subject
 * @access  Admin/School/Teacher
 */
export const getMarksBySubject = asyncHandler(async (req: Request, res: Response) => {
  const { examSubjectId } = req.params;

  const examSubject = await prisma.examSubject.findUnique({
    where: { id: examSubjectId as string },
    include: { subject: true, exam: true }
  });

  if (!examSubject) throw new ErrorResponse("Exam subject not found", statusCode.Not_Found);

  const marks = await prisma.studentMark.findMany({
    where: { examSubjectId: examSubjectId as string },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } }
    },
    orderBy: { student: { firstName: "asc" } }
  });

  return SuccessResponse(res, "Marks retrieved successfully", {
    examSubject,
    marks
  });
});

/**
 * @route   GET /api/exam/marks/student/:studentId
 * @desc    Get all marks for a student across exams
 * @access  Admin/School/Parent/Student
 */
export const getMarksByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { examId } = req.query;

  const where: any = { studentId: studentId as string };
  if (examId) {
    where.examSubject = { examId: examId as string };
  }

  const marks = await prisma.studentMark.findMany({
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

  return SuccessResponse(res, "Student marks retrieved successfully", marks);
});

/**
 * @route   GET /api/exam/marks/exam/:examId
 * @desc    Get all marks for an exam (all subjects)
 * @access  Admin/School/Teacher
 */
export const getMarksByExam = asyncHandler(async (req: Request, res: Response) => {
  const { examId } = req.params;

  const exam = await prisma.exam.findUnique({
    where: { id: examId as string },
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

  if (!exam) throw new ErrorResponse("Exam not found", statusCode.Not_Found);

  return SuccessResponse(res, "Exam marks retrieved successfully", exam);
});

/**
 * @route   PUT /api/exam/marks/:id
 * @desc    Update single mark
 * @access  Admin/School/Teacher
 */
export const updateMark = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateMarkSchema.parse(req.body);

  const existing = await prisma.studentMark.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Mark not found", statusCode.Not_Found);

  const mark = await prisma.studentMark.update({
    where: { id: id as string },
    data: validatedData,
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      examSubject: { include: { subject: true } }
    }
  });

  return SuccessResponse(res, "Mark updated successfully", mark);
});

/**
 * @route   DELETE /api/exam/marks/:id
 * @desc    Delete mark
 * @access  Admin/School
 */
export const deleteMark = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const mark = await prisma.studentMark.findUnique({ where: { id: id as string } });
  if (!mark) throw new ErrorResponse("Mark not found", statusCode.Not_Found);

  await prisma.studentMark.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Mark deleted successfully", null);
});
