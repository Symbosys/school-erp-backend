import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createGradeScaleSchema,
  updateGradeScaleSchema,
} from "../validation/gradeScale.validation";

/**
 * @route   POST /api/exam/grade-scale
 * @desc    Create grade scale entry
 * @access  Admin/School
 */
export const createGradeScale = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createGradeScaleSchema.parse(req.body);

  // Check school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Check duplicate
  const existing = await prisma.gradeScale.findUnique({
    where: {
      schoolId_name: {
        schoolId: validatedData.schoolId,
        name: validatedData.name
      }
    }
  });

  if (existing) {
    throw new ErrorResponse("Grade scale with this name already exists", statusCode.Conflict);
  }

  const gradeScale = await prisma.gradeScale.create({
    data: {
      ...validatedData,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(res, "Grade scale created successfully", gradeScale, statusCode.Created);
});

/**
 * @route   GET /api/exam/grade-scale/school/:schoolId
 * @desc    Get all grade scales for a school
 * @access  Admin/School
 */
export const getGradeScalesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (isActive !== undefined) where.isActive = isActive === "true";

  const gradeScales = await prisma.gradeScale.findMany({
    where,
    orderBy: { minPercentage: "desc" }
  });

  return SuccessResponse(res, "Grade scales retrieved successfully", gradeScales);
});

/**
 * @route   GET /api/exam/grade-scale/:id
 * @desc    Get grade scale by ID
 * @access  Admin/School
 */
export const getGradeScaleById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const gradeScale = await prisma.gradeScale.findUnique({
    where: { id: id as string }
  });

  if (!gradeScale) throw new ErrorResponse("Grade scale not found", statusCode.Not_Found);

  return SuccessResponse(res, "Grade scale retrieved successfully", gradeScale);
});

/**
 * @route   PUT /api/exam/grade-scale/:id
 * @desc    Update grade scale
 * @access  Admin/School
 */
export const updateGradeScale = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateGradeScaleSchema.parse(req.body);

  const existing = await prisma.gradeScale.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Grade scale not found", statusCode.Not_Found);

  const gradeScale = await prisma.gradeScale.update({
    where: { id: id as string },
    data: validatedData
  });

  return SuccessResponse(res, "Grade scale updated successfully", gradeScale);
});

/**
 * @route   DELETE /api/exam/grade-scale/:id
 * @desc    Delete grade scale
 * @access  Admin
 */
export const deleteGradeScale = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const gradeScale = await prisma.gradeScale.findUnique({ where: { id: id as string } });
  if (!gradeScale) throw new ErrorResponse("Grade scale not found", statusCode.Not_Found);

  await prisma.gradeScale.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Grade scale deleted successfully", null);
});
