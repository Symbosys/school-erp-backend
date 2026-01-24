import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createClassSchema,
  updateClassSchema,
} from "../validation/class.validation";

/**
 * @route   POST /api/school/class
 * @desc    Create a new class
 * @access  Admin/School
 */
export const createClass = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createClassSchema.parse(req.body);

  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id: validatedData.schoolId as string }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Check if class with same grade already exists for this school
  const existingClass = await prisma.class.findFirst({
    where: {
      schoolId: validatedData.schoolId,
      grade: validatedData.grade
    }
  });

  if (existingClass) {
    throw new ErrorResponse(
      `Class with grade ${validatedData.grade} already exists for this school`,
      statusCode.Conflict
    );
  }

  // Create class
  const newClass = await prisma.class.create({
    data: {
      schoolId: validatedData.schoolId,
      name: validatedData.name,
      grade: validatedData.grade,
      description: validatedData.description || null,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(
    res,
    "Class created successfully",
    newClass,
    statusCode.Created
  );
});

/**
 * @route   GET /api/school/class/school/:schoolId
 * @desc    Get all classes for a school
 * @access  Admin/School
 */
export const getClassesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive } = req.query;

  const where: any = { schoolId: schoolId as string };

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const classes = await prisma.class.findMany({
    where,
    orderBy: { grade: "asc" },
    include: {
      _count: {
        select: {
          sections: true,
          subjects: true
        }
      }
    }
  });

  return SuccessResponse(res, "Classes retrieved successfully", classes);
});

/**
 * @route   GET /api/school/class/:id
 * @desc    Get class by ID
 * @access  Admin/School
 */
export const getClassById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const classData = await prisma.class.findUnique({
    where: { id: id as string },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      sections: {
        where: { isActive: true },
        orderBy: { name: "asc" }
      },
      _count: {
        select: {
          sections: true,
          subjects: true
        }
      }
    }
  });

  if (!classData) {
    throw new ErrorResponse("Class not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Class retrieved successfully", classData);
});

/**
 * @route   PUT /api/school/class/:id
 * @desc    Update class
 * @access  Admin/School
 */
export const updateClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateClassSchema.parse(req.body);

  const existingClass = await prisma.class.findUnique({
    where: { id: id as string }
  });

  if (!existingClass) {
    throw new ErrorResponse("Class not found", statusCode.Not_Found);
  }

  const updateData: any = {};
  if (validatedData.name) updateData.name = validatedData.name;
  if (validatedData.description !== undefined) updateData.description = validatedData.description || null;
  if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

  const updatedClass = await prisma.class.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Class updated successfully", updatedClass);
});

/**
 * @route   DELETE /api/school/class/:id
 * @desc    Delete class
 * @access  Admin
 */
export const deleteClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const classData = await prisma.class.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: {
          sections: true
        }
      }
    }
  });

  if (!classData) {
    throw new ErrorResponse("Class not found", statusCode.Not_Found);
  }

  // Check if class has sections
  if (classData._count.sections > 0) {
    throw new ErrorResponse(
      "Cannot delete class with existing sections",
      statusCode.Bad_Request
    );
  }

  await prisma.class.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Class deleted successfully", null);
});
