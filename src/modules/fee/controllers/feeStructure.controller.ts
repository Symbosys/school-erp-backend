import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createFeeStructureSchema,
  updateFeeStructureSchema,
  addFeeStructureItemSchema,
} from "../validation/feeStructure.validation";

/**
 * @route   POST /api/fee/structure
 * @desc    Create new fee structure with items
 * @access  Admin/School
 */
export const createFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createFeeStructureSchema.parse(req.body);

  // Validate school, class, and academic year exist
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  const classEntity = await prisma.class.findUnique({ where: { id: validatedData.classId } });
  if (!classEntity) throw new ErrorResponse("Class not found", statusCode.Not_Found);

  const academicYear = await prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
  if (!academicYear) throw new ErrorResponse("Academic year not found", statusCode.Not_Found);

  // Check same school
  if (classEntity.schoolId !== validatedData.schoolId || academicYear.schoolId !== validatedData.schoolId) {
    throw new ErrorResponse("Class and Academic Year must belong to the same school", statusCode.Bad_Request);
  }

  // Check duplicate
  const existing = await prisma.feeStructure.findUnique({
    where: {
      classId_academicYearId: {
        classId: validatedData.classId,
        academicYearId: validatedData.academicYearId
      }
    }
  });

  if (existing) {
    throw new ErrorResponse("Fee structure already exists for this class and academic year", statusCode.Conflict);
  }

  // Create structure with items in transaction
  const structure = await prisma.feeStructure.create({
    data: {
      schoolId: validatedData.schoolId,
      classId: validatedData.classId,
      academicYearId: validatedData.academicYearId,
      name: validatedData.name,
      totalAmount: validatedData.totalAmount,
      dueDay: validatedData.dueDay ?? 10,
      lateFeePercentage: validatedData.lateFeePercentage ?? 0,
      lateFeeFixedAmount: validatedData.lateFeeFixedAmount ?? 0,
      gracePeriodDays: validatedData.gracePeriodDays ?? 5,
      isActive: validatedData.isActive ?? true,
      items: {
        create: validatedData.items.map(item => ({
          feeCategoryId: item.feeCategoryId,
          amount: item.amount,
          frequency: item.frequency ?? "MONTHLY"
        }))
      }
    },
    include: {
      items: {
        include: { feeCategory: true }
      },
      class: true,
      academicYear: true
    }
  });

  return SuccessResponse(res, "Fee structure created successfully", structure, statusCode.Created);
});

/**
 * @route   GET /api/fee/structure/school/:schoolId
 * @desc    Get all fee structures for a school
 * @access  Admin/School
 */
export const getFeeStructuresBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { academicYearId, classId, isActive } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (academicYearId) where.academicYearId = academicYearId as string;
  if (classId) where.classId = classId as string;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const structures = await prisma.feeStructure.findMany({
    where,
    include: {
      class: true,
      academicYear: true,
      _count: { select: { items: true, studentFees: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Fee structures retrieved successfully", structures);
});

/**
 * @route   GET /api/fee/structure/:id
 * @desc    Get fee structure by ID with all items
 * @access  Admin/School
 */
export const getFeeStructureById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const structure = await prisma.feeStructure.findUnique({
    where: { id: id as string },
    include: {
      items: {
        include: { feeCategory: true }
      },
      class: true,
      academicYear: true,
      _count: { select: { studentFees: true } }
    }
  });

  if (!structure) throw new ErrorResponse("Fee structure not found", statusCode.Not_Found);

  return SuccessResponse(res, "Fee structure retrieved successfully", structure);
});

/**
 * @route   PUT /api/fee/structure/:id
 * @desc    Update fee structure
 * @access  Admin/School
 */
export const updateFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateFeeStructureSchema.parse(req.body);

  const existing = await prisma.feeStructure.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Fee structure not found", statusCode.Not_Found);

  const structure = await prisma.feeStructure.update({
    where: { id: id as string },
    data: validatedData,
    include: {
      items: { include: { feeCategory: true } },
      class: true,
      academicYear: true
    }
  });

  return SuccessResponse(res, "Fee structure updated successfully", structure);
});

/**
 * @route   DELETE /api/fee/structure/:id
 * @desc    Delete fee structure
 * @access  Admin
 */
export const deleteFeeStructure = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const structure = await prisma.feeStructure.findUnique({
    where: { id: id as string },
    include: { _count: { select: { studentFees: true } } }
  });

  if (!structure) throw new ErrorResponse("Fee structure not found", statusCode.Not_Found);

  const feeCount = (structure as any)._count?.studentFees ?? 0;
  if (feeCount > 0) {
    throw new ErrorResponse("Cannot delete structure assigned to students", statusCode.Bad_Request);
  }

  await prisma.feeStructure.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Fee structure deleted successfully", null);
});

/**
 * @route   POST /api/fee/structure/item
 * @desc    Add item to fee structure
 * @access  Admin/School
 */
export const addFeeStructureItem = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = addFeeStructureItemSchema.parse(req.body);

  const structure = await prisma.feeStructure.findUnique({ where: { id: validatedData.feeStructureId } });
  if (!structure) throw new ErrorResponse("Fee structure not found", statusCode.Not_Found);

  const category = await prisma.feeCategory.findUnique({ where: { id: validatedData.feeCategoryId } });
  if (!category) throw new ErrorResponse("Fee category not found", statusCode.Not_Found);

  // Check same school
  if (structure.schoolId !== category.schoolId) {
    throw new ErrorResponse("Category must belong to the same school", statusCode.Bad_Request);
  }

  const item = await prisma.feeStructureItem.create({
    data: {
      feeStructureId: validatedData.feeStructureId,
      feeCategoryId: validatedData.feeCategoryId,
      amount: validatedData.amount,
      frequency: validatedData.frequency ?? "MONTHLY"
    },
    include: { feeCategory: true }
  });

  return SuccessResponse(res, "Fee item added successfully", item, statusCode.Created);
});

/**
 * @route   DELETE /api/fee/structure/item/:id
 * @desc    Remove item from fee structure
 * @access  Admin/School
 */
export const removeFeeStructureItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await prisma.feeStructureItem.findUnique({ where: { id: id as string } });
  if (!item) throw new ErrorResponse("Fee item not found", statusCode.Not_Found);

  await prisma.feeStructureItem.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Fee item removed successfully", null);
});
