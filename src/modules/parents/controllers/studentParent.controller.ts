import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  assignStudentParentSchema,
  updateStudentParentSchema,
} from "../validation/studentParent.validation";

/**
 * @route   POST /api/parents/assign
 * @desc    Assign a parent to a student
 * @access  Admin/School
 */
export const assignParentToStudent = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = assignStudentParentSchema.parse(req.body);

  // Check existence
  const student = await prisma.student.findUnique({ where: { id: validatedData.studentId } });
  if (!student) throw new ErrorResponse("Student not found", statusCode.Not_Found);

  const parent = await prisma.parent.findUnique({ where: { id: validatedData.parentId } });
  if (!parent) throw new ErrorResponse("Parent not found", statusCode.Not_Found);

  // Check same school
  if (student.schoolId !== parent.schoolId) {
    throw new ErrorResponse("Student and Parent must belong to the same school", statusCode.Bad_Request);
  }

  // Check duplicate
  const existingRelation = await prisma.studentParent.findUnique({
    where: {
      studentId_parentId: {
        studentId: validatedData.studentId,
        parentId: validatedData.parentId
      }
    }
  });

  if (existingRelation) {
    throw new ErrorResponse("Parent is already assigned to this student", statusCode.Conflict);
  }

  // If set as primary, unset other primaries for this student (Optional logic, usually one primary)
  if (validatedData.isPrimary) {
    // We might want to allow multiple primaries (e.g. both parents), but let's assume we don't enforce uniqueness strictness here unless requested.
    // However, it's good practice to maybe check. But for now, just create.
  }

  const relation = await prisma.studentParent.create({
    data: {
      studentId: validatedData.studentId,
      parentId: validatedData.parentId,
      relationship: validatedData.relationship,
      isPrimary: validatedData.isPrimary ?? false
    },
    include: {
      student: {
        select: { id: true, firstName: true, lastName: true, admissionNumber: true }
      },
      parent: {
        select: { id: true, firstName: true, lastName: true, email: true, phone: true }
      }
    }
  });

  return SuccessResponse(res, "Parent assigned to student successfully", relation, statusCode.Created);
});

/**
 * @route   GET /api/parents/student/:studentId
 * @desc    Get all parents for a student
 * @access  Admin/School
 */
export const getParentsByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const parents = await prisma.studentParent.findMany({
    where: { studentId: studentId as string },
    include: {
      parent: true
    }
  });

  return SuccessResponse(res, "Student parents retrieved successfully", parents);
});

/**
 * @route   PUT /api/parents/assign/:id
 * @desc    Update relationship details (e.g., isPrimary, relationship type)
 * @access  Admin/School
 */
export const updateStudentParentRelation = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateStudentParentSchema.parse(req.body);

  const existingRelation = await prisma.studentParent.findUnique({ where: { id: id as string } });
  if (!existingRelation) throw new ErrorResponse("Relationship not found", statusCode.Not_Found);

  const updatedRelation = await prisma.studentParent.update({
    where: { id: id as string },
    data: validatedData,
    include: {
      parent: true
    }
  });

  return SuccessResponse(res, "Relationship updated successfully", updatedRelation);
});

/**
 * @route   DELETE /api/parents/assign/:id
 * @desc    Remove parent from student (Unlink)
 * @access  Admin/School
 */
export const removeParentFromStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const relation = await prisma.studentParent.findUnique({ where: { id: id as string } });
  if (!relation) throw new ErrorResponse("Relationship not found", statusCode.Not_Found);

  await prisma.studentParent.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Parent removed from student successfully", null);
});
