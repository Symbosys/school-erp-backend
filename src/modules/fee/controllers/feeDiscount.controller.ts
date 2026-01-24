import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createFeeDiscountSchema,
  updateFeeDiscountSchema,
} from "../validation/feeDiscount.validation";

/**
 * @route   POST /api/fee/discount
 * @desc    Create fee discount for a student
 * @access  Admin/School
 */
export const createFeeDiscount = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createFeeDiscountSchema.parse(req.body);

  // Validate student and academic year
  const student = await prisma.student.findUnique({ where: { id: validatedData.studentId } });
  if (!student) throw new ErrorResponse("Student not found", statusCode.Not_Found);

  const academicYear = await prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
  if (!academicYear) throw new ErrorResponse("Academic year not found", statusCode.Not_Found);

  // Validate fee category if provided
  if (validatedData.feeCategoryId) {
    const category = await prisma.feeCategory.findUnique({ where: { id: validatedData.feeCategoryId } });
    if (!category) throw new ErrorResponse("Fee category not found", statusCode.Not_Found);

    if (category.schoolId !== student.schoolId) {
      throw new ErrorResponse("Fee category must belong to the same school", statusCode.Bad_Request);
    }
  }

  const discount = await prisma.feeDiscount.create({
    data: {
      studentId: validatedData.studentId,
      academicYearId: validatedData.academicYearId,
      feeCategoryId: validatedData.feeCategoryId || null,
      discountType: validatedData.discountType,
      discountValue: validatedData.discountValue,
      reason: validatedData.reason,
      approvedBy: validatedData.approvedBy,
      isActive: validatedData.isActive ?? true
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      feeCategory: true,
      academicYear: true
    }
  });

  return SuccessResponse(res, "Fee discount created successfully", discount, statusCode.Created);
});

/**
 * @route   GET /api/fee/discount/student/:studentId
 * @desc    Get all discounts for a student
 * @access  Admin/School
 */
export const getDiscountsByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { academicYearId } = req.query;

  const where: any = { studentId: studentId as string };
  if (academicYearId) where.academicYearId = academicYearId as string;

  const discounts = await prisma.feeDiscount.findMany({
    where,
    include: {
      feeCategory: true,
      academicYear: true
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Discounts retrieved successfully", discounts);
});

/**
 * @route   GET /api/fee/discount/school/:schoolId
 * @desc    Get all discounts for a school
 * @access  Admin/School
 */
export const getDiscountsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { academicYearId } = req.query;

  const where: any = {
    student: { schoolId: schoolId as string }
  };
  if (academicYearId) where.academicYearId = academicYearId as string;

  const discounts = await prisma.feeDiscount.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      feeCategory: true,
      academicYear: true
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Discounts retrieved successfully", discounts);
});

/**
 * @route   GET /api/fee/discount/:id
 * @desc    Get discount by ID
 * @access  Admin/School
 */
export const getFeeDiscountById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const discount = await prisma.feeDiscount.findUnique({
    where: { id: id as string },
    include: {
      student: true,
      feeCategory: true,
      academicYear: true
    }
  });

  if (!discount) throw new ErrorResponse("Discount not found", statusCode.Not_Found);

  return SuccessResponse(res, "Discount retrieved successfully", discount);
});

/**
 * @route   PUT /api/fee/discount/:id
 * @desc    Update fee discount
 * @access  Admin/School
 */
export const updateFeeDiscount = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateFeeDiscountSchema.parse(req.body);

  const existing = await prisma.feeDiscount.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Discount not found", statusCode.Not_Found);

  const discount = await prisma.feeDiscount.update({
    where: { id: id as string },
    data: validatedData,
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      feeCategory: true
    }
  });

  return SuccessResponse(res, "Discount updated successfully", discount);
});

/**
 * @route   DELETE /api/fee/discount/:id
 * @desc    Delete fee discount
 * @access  Admin
 */
export const deleteFeeDiscount = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const discount = await prisma.feeDiscount.findUnique({ where: { id: id as string } });
  if (!discount) throw new ErrorResponse("Discount not found", statusCode.Not_Found);

  await prisma.feeDiscount.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Discount deleted successfully", null);
});
