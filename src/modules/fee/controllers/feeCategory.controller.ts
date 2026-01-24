import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createFeeCategorySchema,
  updateFeeCategorySchema,
} from "../validation/feeCategory.validation";

/**
 * @route   POST /api/fee/category
 * @desc    Create new fee category
 * @access  Admin/School
 */
export const createFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createFeeCategorySchema.parse(req.body);

  // Check school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Check duplicate name
  const existing = await prisma.feeCategory.findUnique({
    where: {
      schoolId_name: {
        schoolId: validatedData.schoolId,
        name: validatedData.name
      }
    }
  });

  if (existing) {
    throw new ErrorResponse("Fee category with this name already exists", statusCode.Conflict);
  }

  const category = await prisma.feeCategory.create({
    data: {
      ...validatedData,
      isRecurring: validatedData.isRecurring ?? true,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(res, "Fee category created successfully", category, statusCode.Created);
});

/**
 * @route   GET /api/fee/category/school/:schoolId
 * @desc    Get all fee categories for a school
 * @access  Admin/School
 */
export const getFeeCategoriesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const categories = await prisma.feeCategory.findMany({
    where,
    orderBy: { name: "asc" }
  });

  return SuccessResponse(res, "Fee categories retrieved successfully", categories);
});

/**
 * @route   GET /api/fee/category/:id
 * @desc    Get fee category by ID
 * @access  Admin/School
 */
export const getFeeCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await prisma.feeCategory.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: { feeStructureItems: true }
      }
    }
  });

  if (!category) throw new ErrorResponse("Fee category not found", statusCode.Not_Found);

  return SuccessResponse(res, "Fee category retrieved successfully", category);
});

/**
 * @route   PUT /api/fee/category/:id
 * @desc    Update fee category
 * @access  Admin/School
 */
export const updateFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateFeeCategorySchema.parse(req.body);

  const existing = await prisma.feeCategory.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Fee category not found", statusCode.Not_Found);

  const category = await prisma.feeCategory.update({
    where: { id: id as string },
    data: validatedData
  });

  return SuccessResponse(res, "Fee category updated successfully", category);
});

/**
 * @route   DELETE /api/fee/category/:id
 * @desc    Delete fee category
 * @access  Admin
 */
export const deleteFeeCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await prisma.feeCategory.findUnique({
    where: { id: id as string },
    include: {
      _count: { select: { feeStructureItems: true } }
    }
  });

  if (!category) throw new ErrorResponse("Fee category not found", statusCode.Not_Found);

  const itemCount = (category as any)._count?.feeStructureItems ?? 0;
  if (itemCount > 0) {
    throw new ErrorResponse("Cannot delete category used in fee structures", statusCode.Bad_Request);
  }

  await prisma.feeCategory.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Fee category deleted successfully", null);
});
