import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createSectionSchema,
  updateSectionSchema,
} from "../validation/section.validation";

/**
 * @route   POST /api/school/section
 * @desc    Create a new section
 * @access  Admin/School
 */
export const createSection = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createSectionSchema.parse(req.body);

  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id: validatedData.schoolId as string }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Check if class exists
  const classData = await prisma.class.findUnique({
    where: { id: validatedData.classId as string }
  });

  if (!classData) {
    throw new ErrorResponse("Class not found", statusCode.Not_Found);
  }

  // Verify class belongs to the school
  if (classData.schoolId !== validatedData.schoolId) {
    throw new ErrorResponse("Class does not belong to this school", statusCode.Bad_Request);
  }

  // Check if section with same name already exists for this class
  const existingSection = await prisma.section.findFirst({
    where: {
      classId: validatedData.classId,
      name: validatedData.name
    }
  });

  if (existingSection) {
    throw new ErrorResponse(
      `Section ${validatedData.name} already exists for this class`,
      statusCode.Conflict
    );
  }

  // Create section
  const section = await prisma.section.create({
    data: {
      schoolId: validatedData.schoolId,
      classId: validatedData.classId,
      name: validatedData.name,
      capacity: validatedData.capacity || 40,
      roomNumber: validatedData.roomNumber || null,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(
    res,
    "Section created successfully",
    section,
    statusCode.Created
  );
});

/**
 * @route   GET /api/school/section/class/:classId
 * @desc    Get all sections for a class
 * @access  Admin/School
 */
export const getSectionsByClass = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { isActive } = req.query;

  const where: any = { classId: classId as string };

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const sections = await prisma.section.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          grade: true
        }
      },
      _count: {
        select: {
          enrollments: true,
          teacherAssignments: true
        }
      }
    }
  });

  return SuccessResponse(res, "Sections retrieved successfully", sections);
});

/**
 * @route   GET /api/school/section/school/:schoolId
 * @desc    Get all sections for a school
 * @access  Admin/School
 */
export const getSectionsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive } = req.query;

  const where: any = { schoolId: schoolId as string };

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const sections = await prisma.section.findMany({
    where,
    orderBy: [
      { class: { grade: "asc" } },
      { name: "asc" }
    ],
    include: {
      class: {
        select: {
          id: true,
          name: true,
          grade: true
        }
      },
      _count: {
        select: {
          enrollments: true,
          teacherAssignments: true
        }
      }
    }
  });

  return SuccessResponse(res, "Sections retrieved successfully", sections);
});

/**
 * @route   GET /api/school/section/:id
 * @desc    Get section by ID
 * @access  Admin/School
 */
export const getSectionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const section = await prisma.section.findUnique({
    where: { id: id as string },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      class: {
        select: {
          id: true,
          name: true,
          grade: true
        }
      },
      _count: {
        select: {
          enrollments: true,
          teacherAssignments: true
        }
      }
    }
  });

  if (!section) {
    throw new ErrorResponse("Section not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Section retrieved successfully", section);
});

/**
 * @route   PUT /api/school/section/:id
 * @desc    Update section
 * @access  Admin/School
 */
export const updateSection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateSectionSchema.parse(req.body);

  const existingSection = await prisma.section.findUnique({
    where: { id: id as string }
  });

  if (!existingSection) {
    throw new ErrorResponse("Section not found", statusCode.Not_Found);
  }

  // If updating name, check for duplicates in the same class
  if (validatedData.name && validatedData.name !== existingSection.name) {
    const duplicateSection = await prisma.section.findFirst({
      where: {
        classId: existingSection.classId,
        name: validatedData.name,
        id: { not: id as string }
      }
    });

    if (duplicateSection) {
      throw new ErrorResponse(
        `Section ${validatedData.name} already exists for this class`,
        statusCode.Conflict
      );
    }
  }

  const updateData: any = {};
  if (validatedData.name) updateData.name = validatedData.name;
  if (validatedData.capacity !== undefined) updateData.capacity = validatedData.capacity;
  if (validatedData.roomNumber !== undefined) updateData.roomNumber = validatedData.roomNumber;
  if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

  const updatedSection = await prisma.section.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Section updated successfully", updatedSection);
});

/**
 * @route   DELETE /api/school/section/:id
 * @desc    Delete section
 * @access  Admin
 */
export const deleteSection = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const section = await prisma.section.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: {
          enrollments: true,
          teacherAssignments: true
        }
      }
    }
  });

  if (!section) {
    throw new ErrorResponse("Section not found", statusCode.Not_Found);
  }

  // Check if section has enrollments or assignments
  const hasData = 
    section._count.enrollments > 0 ||
    section._count.teacherAssignments > 0;

  if (hasData) {
    throw new ErrorResponse(
      "Cannot delete section with existing enrollments or teacher assignments",
      statusCode.Bad_Request
    );
  }

  await prisma.section.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Section deleted successfully", null);
});
