import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  assignTeacherSubjectSchema,
  updateTeacherSubjectSchema,
} from "../validation/teacherSubject.validation";

/**
 * @route   POST /api/teacher/subject
 * @desc    Assign a subject to a teacher
 * @access  Admin/School
 */
export const assignSubjectToTeacher = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = assignTeacherSubjectSchema.parse(req.body);

  // Check if teacher exists
  const teacher = await prisma.teacher.findUnique({
    where: { id: validatedData.teacherId }
  });

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", statusCode.Not_Found);
  }

  // Check if subject exists
  const subject = await prisma.subject.findUnique({
    where: { id: validatedData.subjectId }
  });

  if (!subject) {
    throw new ErrorResponse("Subject not found", statusCode.Not_Found);
  }

  // Verify same school
  if (teacher.schoolId !== subject.schoolId) {
    throw new ErrorResponse("Teacher and Subject must belong to the same school", statusCode.Bad_Request);
  }

  // Check if assignment already exists
  const existingAssignment = await prisma.teacherSubject.findUnique({
    where: {
      teacherId_subjectId: {
        teacherId: validatedData.teacherId,
        subjectId: validatedData.subjectId
      }
    }
  });

  if (existingAssignment) {
    throw new ErrorResponse("This subject is already assigned to this teacher", statusCode.Conflict);
  }

  const teacherSubject = await prisma.teacherSubject.create({
    data: {
      teacherId: validatedData.teacherId,
      subjectId: validatedData.subjectId,
      isPrimary: validatedData.isPrimary ?? false
    },
    include: {
      subject: true,
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true
        }
      }
    }
  });

  return SuccessResponse(
    res,
    "Subject assigned to teacher successfully",
    teacherSubject,
    statusCode.Created
  );
});

/**
 * @route   GET /api/teacher/subject/teacher/:teacherId
 * @desc    Get all subjects assigned to a teacher
 * @access  Admin/School
 */
export const getSubjectsByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;

  const teacherSubjects = await prisma.teacherSubject.findMany({
    where: { teacherId: teacherId as string },
    include: {
      subject: true
    }
  });

  return SuccessResponse(res, "Teacher subjects retrieved successfully", teacherSubjects);
});

/**
 * @route   GET /api/teacher/subject/subject/:subjectId
 * @desc    Get all teachers assigned to a subject
 * @access  Admin/School
 */
export const getTeachersBySubject = asyncHandler(async (req: Request, res: Response) => {
  const { subjectId } = req.params;

  const subjectTeachers = await prisma.teacherSubject.findMany({
    where: { subjectId: subjectId as string },
    include: {
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true,
          email: true,
          phone: true,
          profilePicture: true
        }
      }
    }
  });

  return SuccessResponse(res, "Subject teachers retrieved successfully", subjectTeachers);
});

/**
 * @route   PUT /api/teacher/subject/:id
 * @desc    Update teacher subject assignment (e.g. set as primary)
 * @access  Admin/School
 */
export const updateTeacherSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTeacherSubjectSchema.parse(req.body);

  const existingAssignment = await prisma.teacherSubject.findUnique({
    where: { id: id as string }
  });

  if (!existingAssignment) {
    throw new ErrorResponse("Assignment not found", statusCode.Not_Found);
  }

  const updatedAssignment = await prisma.teacherSubject.update({
    where: { id: id as string },
    data: {
      isPrimary: validatedData.isPrimary
    },
    include: {
      subject: true
    }
  });

  return SuccessResponse(res, "Assignment updated successfully", updatedAssignment);
});

/**
 * @route   DELETE /api/teacher/subject/:id
 * @desc    Remove subject from teacher
 * @access  Admin/School
 */
export const removeSubjectFromTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const assignment = await prisma.teacherSubject.findUnique({
    where: { id: id as string }
  });

  if (!assignment) {
    throw new ErrorResponse("Assignment not found", statusCode.Not_Found);
  }

  await prisma.teacherSubject.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Subject removed from teacher successfully", null);
});
