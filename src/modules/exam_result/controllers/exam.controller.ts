import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createExamSchema,
  updateExamSchema,
  addExamSubjectSchema,
} from "../validation/exam.validation";

/**
 * @route   POST /api/exam
 * @desc    Create new exam with subjects
 * @access  Admin/School
 */
export const createExam = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createExamSchema.parse(req.body);

  // Validate school, academic year, and class
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  const academicYear = await prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
  if (!academicYear) throw new ErrorResponse("Academic year not found", statusCode.Not_Found);

  const classEntity = await prisma.class.findUnique({ where: { id: validatedData.classId } });
  if (!classEntity) throw new ErrorResponse("Class not found", statusCode.Not_Found);

  // Check same school
  if (academicYear.schoolId !== validatedData.schoolId || classEntity.schoolId !== validatedData.schoolId) {
    throw new ErrorResponse("Academic year and class must belong to the same school", statusCode.Bad_Request);
  }

  // Check duplicate
  const existing = await prisma.exam.findUnique({
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
    throw new ErrorResponse("Exam with this name already exists for this class", statusCode.Conflict);
  }

  // Create exam with subjects
  const exam = await prisma.exam.create({
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

  return SuccessResponse(res, "Exam created successfully", exam, statusCode.Created);
});

/**
 * @route   GET /api/exam/school/:schoolId
 * @desc    Get all exams for a school
 * @access  Admin/School
 */
export const getExamsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { academicYearId, classId, examType, isActive } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (academicYearId) where.academicYearId = academicYearId as string;
  if (classId) where.classId = classId as string;
  if (examType) where.examType = examType as string;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const exams = await prisma.exam.findMany({
    where,
    include: {
      class: true,
      academicYear: true,
      _count: { select: { examSubjects: true, studentResults: true } }
    },
    orderBy: [{ startDate: "desc" }]
  });

  return SuccessResponse(res, "Exams retrieved successfully", exams);
});

/**
 * @route   GET /api/exam/:id
 * @desc    Get exam by ID with all details
 * @access  Admin/School/Teacher
 */
export const getExamById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const exam = await prisma.exam.findUnique({
    where: { id: id as string },
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

  if (!exam) throw new ErrorResponse("Exam not found", statusCode.Not_Found);

  return SuccessResponse(res, "Exam retrieved successfully", exam);
});

/**
 * @route   PUT /api/exam/:id
 * @desc    Update exam
 * @access  Admin/School
 */
export const updateExam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateExamSchema.parse(req.body);

  const existing = await prisma.exam.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Exam not found", statusCode.Not_Found);

  const updateData: any = { ...validatedData };
  if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
  if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);

  const exam = await prisma.exam.update({
    where: { id: id as string },
    data: updateData,
    include: {
      class: true,
      academicYear: true,
      examSubjects: { include: { subject: true } }
    }
  });

  return SuccessResponse(res, "Exam updated successfully", exam);
});

/**
 * @route   DELETE /api/exam/:id
 * @desc    Delete exam
 * @access  Admin
 */
export const deleteExam = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const exam = await prisma.exam.findUnique({
    where: { id: id as string },
    include: { _count: { select: { studentResults: true } } }
  });

  if (!exam) throw new ErrorResponse("Exam not found", statusCode.Not_Found);

  const resultCount = (exam as any)._count?.studentResults ?? 0;
  if (resultCount > 0) {
    throw new ErrorResponse("Cannot delete exam with published results", statusCode.Bad_Request);
  }

  await prisma.exam.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Exam deleted successfully", null);
});

/**
 * @route   POST /api/exam/subject
 * @desc    Add subject to exam
 * @access  Admin/School
 */
export const addExamSubject = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = addExamSubjectSchema.parse(req.body);

  const exam = await prisma.exam.findUnique({ where: { id: validatedData.examId } });
  if (!exam) throw new ErrorResponse("Exam not found", statusCode.Not_Found);

  const subject = await prisma.subject.findUnique({ where: { id: validatedData.subjectId } });
  if (!subject) throw new ErrorResponse("Subject not found", statusCode.Not_Found);

  const examSubject = await prisma.examSubject.create({
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

  return SuccessResponse(res, "Subject added to exam successfully", examSubject, statusCode.Created);
});

/**
 * @route   DELETE /api/exam/subject/:id
 * @desc    Remove subject from exam
 * @access  Admin/School
 */
export const removeExamSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const examSubject = await prisma.examSubject.findUnique({
    where: { id: id as string },
    include: { _count: { select: { studentMarks: true } } }
  });

  if (!examSubject) throw new ErrorResponse("Exam subject not found", statusCode.Not_Found);

  const markCount = (examSubject as any)._count?.studentMarks ?? 0;
  if (markCount > 0) {
    throw new ErrorResponse("Cannot delete subject with entered marks", statusCode.Bad_Request);
  }

  await prisma.examSubject.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Subject removed from exam successfully", null);
});
