import { z } from "zod";

const BookConditionEnum = z.enum(["NEW", "GOOD", "FAIR", "DAMAGED"]);

/**
 * Zod Schema for Book Copy
 */
const bookCopySchema = z.object({
  copyNumber: z.string().min(1).max(50),
  condition: BookConditionEnum.optional(),
  location: z.string().max(100).optional(),
});

/**
 * Zod Schema for Creating Book
 */
export const createBookSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  categoryId: z.string().uuid("Invalid category ID"),
  title: z.string().min(1, "Title is required").max(200),
  author: z.string().min(1, "Author is required").max(200),
  isbn: z.string().max(20).optional(),
  publisher: z.string().max(100).optional(),
  publishYear: z.number().min(1800).max(2100).optional(),
  description: z.string().optional(),
  totalCopies: z.number().min(1).optional(),
  isActive: z.boolean().optional(),
  copies: z.array(bookCopySchema).optional(),
});

/**
 * Zod Schema for Updating Book
 */
export const updateBookSchema = z.object({
  categoryId: z.string().uuid().optional(),
  title: z.string().max(200).optional(),
  author: z.string().max(200).optional(),
  isbn: z.string().max(20).optional(),
  publisher: z.string().max(100).optional(),
  publishYear: z.number().min(1800).max(2100).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Adding Book Copy
 */
export const addBookCopySchema = z.object({
  bookId: z.string().uuid("Invalid book ID"),
  copyNumber: z.string().min(1).max(50),
  condition: BookConditionEnum.optional(),
  location: z.string().max(100).optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type AddBookCopyInput = z.infer<typeof addBookCopySchema>;
