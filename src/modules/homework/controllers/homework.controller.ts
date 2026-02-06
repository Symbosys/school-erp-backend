import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { HomeworkSubmissionStatus } from "../../../generated/prisma/client";
import {
  createHomeworkSchema,
  updateHomeworkSchema,
  submitHomeworkSchema,
  gradeSubmissionSchema,
} from "../validation/homework.validation";

// ==========================================
// HOMEWORK MANAGEMENT
// ==========================================

/**
 * @route   POST /api/homework
 * @desc    Create a new homework assignment
 * @access  Teacher/Admin
 */
export const createHomework = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createHomeworkSchema.parse(req.body);

  // Validate timetable entry exists and belongs to correct subject/teacher context
  const timetableEntry = await prisma.timetableEntry.findUnique({
    where: { id: validatedData.timetableEntryId },
    include: {
      subject: true,
      teacher: true,
    },
  });

  if (!timetableEntry) {
    throw new ErrorResponse("Timetable entry not found", statusCode.Not_Found);
  }

  // Create Homework
  const homework = await prisma.homework.create({
    data: {
      schoolId: validatedData.schoolId,
      sectionId: validatedData.sectionId,
      timetableEntryId: validatedData.timetableEntryId,
      assignedDate: new Date(validatedData.assignedDate),
      title: validatedData.title,
      description: validatedData.description,
      attachments: validatedData.attachments,
      dueDate: new Date(validatedData.dueDate),
      maxMarks: validatedData.maxMarks,
      assignedBy: validatedData.assignedBy,
      isActive: true,
    },
  });

  return SuccessResponse(res, "Homework assigned successfully", homework, statusCode.Created);
});

/**
 * @route   GET /api/homework/section/:sectionId
 * @desc    Get homework for a section (with filters)
 * @access  Student/Teacher/Admin
 */
export const getHomeworkBySection = asyncHandler(async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const { date, subjectId } = req.query;

  const where: any = {
    sectionId: sectionId as string,
    isActive: true,
  };

  if (date) {
    where.assignedDate = new Date(date as string);
  }

  if (subjectId) {
    where.timetableEntry = {
      subjectId: subjectId as string,
    };
  }

  const homework = await prisma.homework.findMany({
    where,
    include: {
      timetableEntry: {
        include: {
          subject: { select: { id: true, name: true } },
          timeSlot: { select: { id: true, name: true, startTime: true, endTime: true } },
        },
      },
      assignedByUser: {
        select: { id: true, firstName: true, lastName: true },
      },
      _count: {
        select: { submissions: true },
      },
    },
    orderBy: { assignedDate: "desc" },
  });

  return SuccessResponse(res, "Homework retrieved successfully", homework);
});

/**
 * @route   GET /api/homework/student/:studentId
 * @desc    Get homework for a student (includes submission status)
 * @access  Student
 */
export const getHomeworkForStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { date, status } = req.query;

  // 1. Get student's section
  const studentEnrollment = await prisma.studentEnrollment.findFirst({
    where: {
      studentId: studentId as string,
      academicYear: { isCurrent: true },
    },
    select: { sectionId: true },
  });

  if (!studentEnrollment) {
    throw new ErrorResponse("Student not enrolled in current academic year", statusCode.Not_Found);
  }

  // 2. Build filter
  const where: any = {
    sectionId: studentEnrollment.sectionId,
    isActive: true,
  };

  if (date) where.assignedDate = new Date(date as string);

  // 3. Fetch homework with this student's submission
  const homeworkList = await prisma.homework.findMany({
    where,
    include: {
      timetableEntry: {
        include: {
          subject: { select: { id: true, name: true } },
        },
      },
      assignedByUser: {
        select: { id: true, firstName: true, lastName: true },
      },
      submissions: {
        where: { studentId: studentId as string },
        take: 1,
      },
    },
    orderBy: { dueDate: "asc" },
  });

  // 4. Transform response to flattening submission status
  const result = homeworkList.map((hw: any) => {
    const submission = hw.submissions[0];
    let calculatedStatus: HomeworkSubmissionStatus = HomeworkSubmissionStatus.PENDING;

    if (submission) {
      calculatedStatus = submission.status;
    } else if (new Date() > new Date(hw.dueDate)) {
      calculatedStatus = HomeworkSubmissionStatus.LATE; // Not submitted and past due
    }

    // Client-side filtering for status if requested
    if (status && calculatedStatus !== status) return null;

    return {
      ...hw,
      mySubmission: submission || null,
      status: calculatedStatus,
    };
  }).filter(Boolean); // Remove nulls from status filter

  return SuccessResponse(res, "My homework retrieved successfully", result);
});

/**
 * @route   GET /api/homework/:id
 * @desc    Get homework details
 * @access  All
 */
export const getHomeworkById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const homework = await prisma.homework.findUnique({
    where: { id: id as string },
    include: {
      timetableEntry: {
        include: {
          subject: true,
          timeSlot: true,
        },
      },
      assignedByUser: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  });

  if (!homework) throw new ErrorResponse("Homework not found", statusCode.Not_Found);

  return SuccessResponse(res, "Homework details retrieved successfully", homework);
});

/**
 * @route   PUT /api/homework/:id
 * @desc    Update homework
 * @access  Teacher/Admin
 */
export const updateHomework = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateHomeworkSchema.parse(req.body);

  const homework = await prisma.homework.update({
    where: { id: id as string },
    data: {
      title: validatedData.title,
      description: validatedData.description,
      attachments: validatedData.attachments,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
      maxMarks: validatedData.maxMarks,
      isActive: validatedData.isActive,
    },
  });

  return SuccessResponse(res, "Homework updated successfully", homework);
});

/**
 * @route   DELETE /api/homework/:id
 * @desc    Delete homework
 * @access  Teacher/Admin
 */
export const deleteHomework = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.homework.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Homework deleted successfully", null);
});

// ==========================================
// SUBMISSION MANAGEMENT
// ==========================================

/**
 * @route   POST /api/homework/:id/submit
 * @desc    Submit homework (Student)
 * @access  Student
 */
export const submitHomework = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // homeworkId
  const validatedData = submitHomeworkSchema.parse(req.body);

  const homework = await prisma.homework.findUnique({ where: { id: id as string } });
  if (!homework) throw new ErrorResponse("Homework not found", statusCode.Not_Found);

  // Check if past due date
  // const isLate = new Date() > new Date(homework.dueDate);
  // Optional: Auto-mark as LATE if configured

  const submission = await prisma.homeworkSubmission.upsert({
    where: {
      homeworkId_studentId: {
        homeworkId: id as string,
        studentId: validatedData.studentId,
      },
    },
    update: {
      content: validatedData.content,
      attachments: validatedData.attachments,
      submittedAt: new Date(),
      status: HomeworkSubmissionStatus.SUBMITTED,
    },
    create: {
      homeworkId: id as string,
      studentId: validatedData.studentId,
      content: validatedData.content,
      attachments: validatedData.attachments,
      submittedAt: new Date(),
      status: HomeworkSubmissionStatus.SUBMITTED,
    },
  });

  return SuccessResponse(res, "Homework submitted successfully", submission);
});

/**
 * @route   GET /api/homework/:id/submissions
 * @desc    Get all submissions for a homework
 * @access  Teacher
 */
export const getSubmissions = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const submissions = await prisma.homeworkSubmission.findMany({
    where: { homeworkId: id as string },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          profilePicture: true,
        },
      },
    },
    orderBy: { submittedAt: "desc" },
  });

  return SuccessResponse(res, "Submissions retrieved successfully", submissions);
});

/**
 * @route   PUT /api/homework/submission/:id/grade
 * @desc    Grade a submission
 * @access  Teacher
 */
export const gradeSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params; // submissionId
  const validatedData = gradeSubmissionSchema.parse(req.body);

  const submission = await prisma.homeworkSubmission.update({
    where: { id: id as string },
    data: {
      marks: validatedData.marks,
      feedback: validatedData.feedback,
      gradedBy: validatedData.gradedBy,
      gradedAt: new Date(),
      status: validatedData.status || HomeworkSubmissionStatus.GRADED,
    },
  });

  return SuccessResponse(res, "Homework graded successfully", submission);
});

/**
 * @route   DELETE /api/homework/submission/:id
 * @desc    Delete a submission
 * @access  Teacher/Admin
 */
export const deleteSubmission = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.homeworkSubmission.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Submission removed successfully", null);
});


