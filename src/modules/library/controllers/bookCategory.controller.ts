import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createBookCategorySchema,
  updateBookCategorySchema,
} from "../validation/bookCategory.validation";

/**
 * @route   POST /api/library/category
 * @desc    Create book category
 * @access  Admin/School
 */
export const createBookCategory = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createBookCategorySchema.parse(req.body);

  // Check school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Check duplicate
  const existing = await prisma.bookCategory.findUnique({
    where: {
      schoolId_name: {
        schoolId: validatedData.schoolId,
        name: validatedData.name
      }
    }
  });

  if (existing) {
    throw new ErrorResponse("Category with this name already exists", statusCode.Conflict);
  }

  const category = await prisma.bookCategory.create({
    data: {
      ...validatedData,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(res, "Book category created successfully", category, statusCode.Created);
});

/**
 * @route   GET /api/library/category/school/:schoolId
 * @desc    Get all book categories for a school
 * @access  Admin/School
 */
export const getBookCategoriesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (isActive !== undefined) where.isActive = isActive === "true";

  const categories = await prisma.bookCategory.findMany({
    where,
    include: { _count: { select: { books: true } } },
    orderBy: { name: "asc" }
  });

  return SuccessResponse(res, "Book categories retrieved successfully", categories);
});

/**
 * @route   GET /api/library/category/:id
 * @desc    Get book category by ID
 * @access  Admin/School
 */
export const getBookCategoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await prisma.bookCategory.findUnique({
    where: { id: id as string },
    include: { _count: { select: { books: true } } }
  });

  if (!category) throw new ErrorResponse("Book category not found", statusCode.Not_Found);

  return SuccessResponse(res, "Book category retrieved successfully", category);
});

/**
 * @route   PUT /api/library/category/:id
 * @desc    Update book category
 * @access  Admin/School
 */
export const updateBookCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateBookCategorySchema.parse(req.body);

  const existing = await prisma.bookCategory.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Book category not found", statusCode.Not_Found);

  const category = await prisma.bookCategory.update({
    where: { id: id as string },
    data: validatedData
  });

  return SuccessResponse(res, "Book category updated successfully", category);
});

/**
 * @route   DELETE /api/library/category/:id
 * @desc    Delete book category
 * @access  Admin
 */
export const deleteBookCategory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const category = await prisma.bookCategory.findUnique({
    where: { id: id as string },
    include: { _count: { select: { books: true } } }
  });

  if (!category) throw new ErrorResponse("Book category not found", statusCode.Not_Found);

  const bookCount = (category as any)._count?.books ?? 0;
  if (bookCount > 0) {
    throw new ErrorResponse("Cannot delete category with books", statusCode.Bad_Request);
  }

  await prisma.bookCategory.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Book category deleted successfully", null);
});
