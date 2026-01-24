import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createAcademicYearSchema,
  updateAcademicYearSchema,
  setCurrentYearSchema,
} from "../validation/academicYear.validation";

/**
 * @route   POST /api/school/academic-year
 * @desc    Create a new academic year for a school
 * @access  Admin/School
 */
export const createAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createAcademicYearSchema.parse(req.body);

  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id: validatedData.schoolId as string }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Check if academic year with same name exists for this school
  const existingYear = await prisma.academicYear.findFirst({
    where: {
      schoolId: validatedData.schoolId,
      name: validatedData.name
    }
  });

  if (existingYear) {
    throw new ErrorResponse(
      "Academic year with this name already exists for this school",
      statusCode.Conflict
    );
  }

  // If setting as current, unset other current years for this school
  if (validatedData.isCurrent) {
    await prisma.academicYear.updateMany({
      where: {
        schoolId: validatedData.schoolId,
        isCurrent: true
      },
      data: { isCurrent: false }
    });
  }

  // Create academic year
  const academicYear = await prisma.academicYear.create({
    data: {
      schoolId: validatedData.schoolId,
      name: validatedData.name,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      isCurrent: validatedData.isCurrent ?? false,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(
    res,
    "Academic year created successfully",
    academicYear,
    statusCode.Created
  );
});

/**
 * @route   GET /api/school/academic-year/school/:schoolId
 * @desc    Get all academic years for a school
 * @access  Admin/School
 */
export const getAcademicYearsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive, isCurrent } = req.query;

  const where: any = { schoolId: schoolId as string };

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  if (isCurrent !== undefined) {
    where.isCurrent = isCurrent === "true";
  }

  const academicYears = await prisma.academicYear.findMany({
    where,
    orderBy: { startDate: "desc" },
    include: {
      _count: {
        select: {
          enrollments: true,
          studentAttendances: true,
          teacherAssignments: true
        }
      }
    }
  });

  return SuccessResponse(res, "Academic years retrieved successfully", academicYears);
});

/**
 * @route   GET /api/school/academic-year/:id
 * @desc    Get academic year by ID
 * @access  Admin/School
 */
export const getAcademicYearById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const academicYear = await prisma.academicYear.findUnique({
    where: { id: id as string },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      _count: {
        select: {
          enrollments: true,
          studentAttendances: true,
          teacherAssignments: true
        }
      }
    }
  });

  if (!academicYear) {
    throw new ErrorResponse("Academic year not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Academic year retrieved successfully", academicYear);
});

/**
 * @route   GET /api/school/academic-year/current/:schoolId
 * @desc    Get current academic year for a school
 * @access  Admin/School
 */
export const getCurrentAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  const academicYear = await prisma.academicYear.findFirst({
    where: {
      schoolId: schoolId as string,
      isCurrent: true
    },
    include: {
      _count: {
        select: {
          enrollments: true,
          studentAttendances: true,
          teacherAssignments: true
        }
      }
    }
  });

  if (!academicYear) {
    throw new ErrorResponse("No current academic year found for this school", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Current academic year retrieved successfully", academicYear);
});

/**
 * @route   PUT /api/school/academic-year/:id
 * @desc    Update academic year
 * @access  Admin/School
 */
export const updateAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateAcademicYearSchema.parse(req.body);

  const existingYear = await prisma.academicYear.findUnique({
    where: { id: id as string }
  });

  if (!existingYear) {
    throw new ErrorResponse("Academic year not found", statusCode.Not_Found);
  }

  // If updating isCurrent to true, unset other current years for this school
  if (validatedData.isCurrent === true) {
    await prisma.academicYear.updateMany({
      where: {
        schoolId: existingYear.schoolId,
        isCurrent: true,
        id: { not: id as string }
      },
      data: { isCurrent: false }
    });
  }

  const updateData: any = {};
  if (validatedData.name) updateData.name = validatedData.name;
  if (validatedData.startDate) updateData.startDate = new Date(validatedData.startDate);
  if (validatedData.endDate) updateData.endDate = new Date(validatedData.endDate);
  if (validatedData.isCurrent !== undefined) updateData.isCurrent = validatedData.isCurrent;
  if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

  const updatedYear = await prisma.academicYear.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Academic year updated successfully", updatedYear);
});

/**
 * @route   PATCH /api/school/academic-year/:id/set-current
 * @desc    Set academic year as current
 * @access  Admin/School
 */
export const setCurrentAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = setCurrentYearSchema.parse(req.body);

  const academicYear = await prisma.academicYear.findUnique({
    where: { id: id as string }
  });

  if (!academicYear) {
    throw new ErrorResponse("Academic year not found", statusCode.Not_Found);
  }

  // If setting as current, unset other current years for this school
  if (validatedData.isCurrent) {
    await prisma.academicYear.updateMany({
      where: {
        schoolId: academicYear.schoolId,
        isCurrent: true,
        id: { not: id as string }
      },
      data: { isCurrent: false }
    });
  }

  const updatedYear = await prisma.academicYear.update({
    where: { id: id as string },
    data: { isCurrent: validatedData.isCurrent }
  });

  return SuccessResponse(
    res,
    `Academic year ${validatedData.isCurrent ? "set as" : "removed from"} current`,
    updatedYear
  );
});

/**
 * @route   DELETE /api/school/academic-year/:id
 * @desc    Delete academic year
 * @access  Admin
 */
export const deleteAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const academicYear = await prisma.academicYear.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: {
          enrollments: true,
          studentAttendances: true,
          teacherAssignments: true
        }
      }
    }
  });

  if (!academicYear) {
    throw new ErrorResponse("Academic year not found", statusCode.Not_Found);
  }

  // Check if academic year has any data
  const hasData = 
    academicYear._count.enrollments > 0 ||
    academicYear._count.studentAttendances > 0 ||
    academicYear._count.teacherAssignments > 0;

  if (hasData) {
    throw new ErrorResponse(
      "Cannot delete academic year with existing enrollments, attendance, or assignments",
      statusCode.Bad_Request
    );
  }

  await prisma.academicYear.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Academic year deleted successfully", null);
});
