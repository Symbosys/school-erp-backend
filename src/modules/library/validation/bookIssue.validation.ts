import { z } from "zod";

/**
 * Zod Schema for Issuing Book
 */
export const issueBookSchema = z.object({
  bookCopyId: z.string().uuid("Invalid book copy ID"),
  studentId: z.string().uuid().optional().nullable(),
  teacherId: z.string().uuid().optional().nullable(),
  dueDate: z.string().min(1, "Due date is required"),
  remarks: z.string().optional(),
  issuedBy: z.string().max(100).optional(),
}).refine(
  (data) => data.studentId || data.teacherId,
  { message: "Either studentId or teacherId is required" }
);

/**
 * Zod Schema for Returning Book
 */
export const returnBookSchema = z.object({
  bookIssueId: z.string().uuid("Invalid book issue ID"),
  remarks: z.string().optional(),
});

/**
 * Zod Schema for Creating Fine
 */
export const createFineSchema = z.object({
  bookIssueId: z.string().uuid("Invalid book issue ID"),
  amount: z.number().positive("Amount must be positive"),
  reason: z.string().min(1).max(200),
});

/**
 * Zod Schema for Paying Fine
 */
export const payFineSchema = z.object({
  fineId: z.string().uuid("Invalid fine ID"),
  paidAmount: z.number().positive("Amount must be positive"),
});

export type IssueBookInput = z.infer<typeof issueBookSchema>;
export type ReturnBookInput = z.infer<typeof returnBookSchema>;
export type CreateFineInput = z.infer<typeof createFineSchema>;
export type PayFineInput = z.infer<typeof payFineSchema>;
