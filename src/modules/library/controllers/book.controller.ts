import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createBookSchema,
  updateBookSchema,
  addBookCopySchema,
} from "../validation/book.validation";

/**
 * @route   POST /api/library/book
 * @desc    Create book with optional copies
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

  const totalCopies = validatedData.copies?.length || validatedData.totalCopies || 1;

  // Create book with copies
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
      totalCopies,
      availableCopies: totalCopies,
      isActive: validatedData.isActive ?? true,
      copies: validatedData.copies?.length ? {
        create: validatedData.copies.map(copy => ({
          copyNumber: copy.copyNumber,
          condition: copy.condition ?? "GOOD",
          location: copy.location,
          status: "AVAILABLE"
        }))
      } : undefined
    },
    include: {
      category: true,
      copies: true
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
  const { categoryId, search, isActive } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (categoryId) where.categoryId = categoryId as string;
  if (isActive !== undefined) where.isActive = isActive === "true";
  if (search) {
    where.OR = [
      { title: { contains: search as string } },
      { author: { contains: search as string } },
      { isbn: { contains: search as string } }
    ];
  }

  const books = await prisma.book.findMany({
    where,
    include: {
      category: true,
      _count: { select: { copies: true } }
    },
    orderBy: { title: "asc" }
  });

  return SuccessResponse(res, "Books retrieved successfully", books);
});

/**
 * @route   GET /api/library/book/:id
 * @desc    Get book by ID with copies
 * @access  Admin/School
 */
export const getBookById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const book = await prisma.book.findUnique({
    where: { id: id as string },
    include: {
      category: true,
      copies: {
        include: { _count: { select: { issues: true } } }
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
    include: {
      copies: { where: { status: "ISSUED" } }
    }
  });

  if (!book) throw new ErrorResponse("Book not found", statusCode.Not_Found);

  if (book.copies.length > 0) {
    throw new ErrorResponse("Cannot delete book with issued copies", statusCode.Bad_Request);
  }

  await prisma.book.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Book deleted successfully", null);
});

/**
 * @route   POST /api/library/book/copy
 * @desc    Add copy to book
 * @access  Admin/School
 */
export const addBookCopy = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = addBookCopySchema.parse(req.body);

  const book = await prisma.book.findUnique({ where: { id: validatedData.bookId } });
  if (!book) throw new ErrorResponse("Book not found", statusCode.Not_Found);

  // Check duplicate copy number
  const existingCopy = await prisma.bookCopy.findUnique({
    where: {
      bookId_copyNumber: {
        bookId: validatedData.bookId,
        copyNumber: validatedData.copyNumber
      }
    }
  });

  if (existingCopy) {
    throw new ErrorResponse("Copy number already exists for this book", statusCode.Conflict);
  }

  const copy = await prisma.bookCopy.create({
    data: {
      bookId: validatedData.bookId,
      copyNumber: validatedData.copyNumber,
      condition: validatedData.condition ?? "GOOD",
      location: validatedData.location,
      status: "AVAILABLE"
    }
  });

  // Update book counts
  await prisma.book.update({
    where: { id: validatedData.bookId },
    data: {
      totalCopies: { increment: 1 },
      availableCopies: { increment: 1 }
    }
  });

  return SuccessResponse(res, "Book copy added successfully", copy, statusCode.Created);
});

/**
 * @route   DELETE /api/library/book/copy/:id
 * @desc    Remove book copy
 * @access  Admin/School
 */
export const removeBookCopy = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const copy = await prisma.bookCopy.findUnique({
    where: { id: id as string }
  });

  if (!copy) throw new ErrorResponse("Book copy not found", statusCode.Not_Found);

  if (copy.status === "ISSUED") {
    throw new ErrorResponse("Cannot delete issued copy", statusCode.Bad_Request);
  }

  await prisma.bookCopy.delete({ where: { id: id as string } });

  // Update book counts
  const decrement = copy.status === "AVAILABLE" ? 1 : 0;
  await prisma.book.update({
    where: { id: copy.bookId },
    data: {
      totalCopies: { decrement: 1 },
      availableCopies: { decrement }
    }
  });

  return SuccessResponse(res, "Book copy removed successfully", null);
});
