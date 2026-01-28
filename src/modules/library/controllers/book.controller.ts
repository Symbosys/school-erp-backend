import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createBookSchema,
  updateBookSchema,
} from "../validation/book.validation";

/**
 * @route   POST /api/library/book
 * @desc    Create book
 * @access  Admin/School
 */
export const createBook = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createBookSchema.parse(req.body);

  // Check school and category
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  const category = await prisma.bookCategory.findUnique({ where: { id: validatedData.categoryId } });
  if (!category) throw new ErrorResponse("Category not found", statusCode.Not_Found);

  if (category.schoolId !== validatedData.schoolId) {
    throw new ErrorResponse("Category must belong to the same school", statusCode.Bad_Request);
  }

  // Create book
  const book = await prisma.book.create({
    data: {
      schoolId: validatedData.schoolId,
      categoryId: validatedData.categoryId,
      title: validatedData.title,
      author: validatedData.author,
      isbn: validatedData.isbn,
      publisher: validatedData.publisher,
      publishYear: validatedData.publishYear,
      description: validatedData.description,
      totalCopies: validatedData.totalCopies || 1,
      availableCopies: validatedData.availableCopies || validatedData.totalCopies || 1,
      stocks: validatedData.stocks || 0,
      isActive: validatedData.isActive ?? true,
    },
    include: {
      category: true,
    }
  });

  return SuccessResponse(res, "Book created successfully", book, statusCode.Created);
});

/**
 * @route   GET /api/library/book/school/:schoolId
 * @desc    Get all books for a school
 * @access  Admin/School
 */
export const getBooksBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { categoryId, search, isActive, page = 1, limit = 10 } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (categoryId) where.categoryId = categoryId as string;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const skip = (Number(page) - 1) * Number(limit);

  if (search) {
    where.OR = [
      { title: { contains: search as string } },
      { author: { contains: search as string } },
      { isbn: { contains: search as string } }
    ];
  }

  const [books, totalBooks] = await Promise.all([
    prisma.book.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: { title: "asc" },
      skip,
      take: Number(limit),
    }),
    prisma.book.count({ where })
  ]);

  return SuccessResponse(res, "Books retrieved successfully", {
    books,
    pagination: {
      total: totalBooks,
      currentPage: Number(page),
      totalPages: Math.ceil(totalBooks / Number(limit)),
      limit: Number(limit),
      count: books.length
    }
  });
});

/**
 * @route   GET /api/library/book/:id
 * @desc    Get book by ID
 * @access  Admin/School
 */
export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const book = await prisma.book.findUnique({
    where: { id: id as string },
    include: {
      category: true,
      fines: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } }
        }
      },
      borrowedBooks: {
        include: {
          student: { select: { id: true, firstName: true, lastName: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } }
        },
        orderBy: { borrowDate: "desc" }
      }
    }
  });

  if (!book) throw new ErrorResponse("Book not found", statusCode.Not_Found);

  return SuccessResponse(res, "Book retrieved successfully", book);
});

/**
 * @route   PUT /api/library/book/:id
 * @desc    Update book
 * @access  Admin/School
 */
export const updateBook = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateBookSchema.parse(req.body);

  const existing = await prisma.book.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Book not found", statusCode.Not_Found);

  const book = await prisma.book.update({
    where: { id: id as string },
    data: validatedData,
    include: { category: true }
  });

  return SuccessResponse(res, "Book updated successfully", book);
});

/**
 * @route   DELETE /api/library/book/:id
 * @desc    Delete book
 * @access  Admin
 */
export const deleteBook = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const book = await prisma.book.findUnique({
    where: { id: id as string },
  });

  if (!book) throw new ErrorResponse("Book not found", statusCode.Not_Found);

  await prisma.book.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Book deleted successfully", null);
});
