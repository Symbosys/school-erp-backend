import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  issueBookSchema,
  returnBookSchema,
  createFineSchema,
  payFineSchema,
} from "../validation/bookIssue.validation";

/**
 * @route   POST /api/library/issue
 * @desc    Issue book to student/teacher
 * @access  Admin/School/Librarian
 */
export const issueBook = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = issueBookSchema.parse(req.body);

  // Check book copy exists and is available
  const bookCopy = await prisma.bookCopy.findUnique({
    where: { id: validatedData.bookCopyId },
    include: { book: true }
  });

  if (!bookCopy) throw new ErrorResponse("Book copy not found", statusCode.Not_Found);

  if (bookCopy.status !== "AVAILABLE") {
    throw new ErrorResponse("Book copy is not available", statusCode.Bad_Request);
  }

  // Validate borrower
  if (validatedData.studentId) {
    const student = await prisma.student.findUnique({ where: { id: validatedData.studentId } });
    if (!student) throw new ErrorResponse("Student not found", statusCode.Not_Found);
  }

  if (validatedData.teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: validatedData.teacherId } });
    if (!teacher) throw new ErrorResponse("Teacher not found", statusCode.Not_Found);
  }

  // Create issue record
  const bookIssue = await prisma.bookIssue.create({
    data: {
      bookCopyId: validatedData.bookCopyId,
      studentId: validatedData.studentId,
      teacherId: validatedData.teacherId,
      dueDate: new Date(validatedData.dueDate),
      remarks: validatedData.remarks,
      issuedBy: validatedData.issuedBy,
      status: "ISSUED"
    },
    include: {
      bookCopy: { include: { book: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } }
    }
  });

  // Update book copy status
  await prisma.bookCopy.update({
    where: { id: validatedData.bookCopyId },
    data: { status: "ISSUED" }
  });

  // Update available copies count
  await prisma.book.update({
    where: { id: bookCopy.bookId },
    data: { availableCopies: { decrement: 1 } }
  });

  return SuccessResponse(res, "Book issued successfully", bookIssue, statusCode.Created);
});

/**
 * @route   POST /api/library/return
 * @desc    Return book
 * @access  Admin/School/Librarian
 */
export const returnBook = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = returnBookSchema.parse(req.body);

  const bookIssue = await prisma.bookIssue.findUnique({
    where: { id: validatedData.bookIssueId },
    include: { bookCopy: true }
  });

  if (!bookIssue) throw new ErrorResponse("Book issue record not found", statusCode.Not_Found);

  if (bookIssue.status === "RETURNED") {
    throw new ErrorResponse("Book already returned", statusCode.Bad_Request);
  }

  const returnDate = new Date();

  // Check if overdue and calculate fine
  let fine = null;
  if (returnDate > bookIssue.dueDate) {
    const overdueDays = Math.ceil((returnDate.getTime() - bookIssue.dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const finePerDay = 2; // ₹2 per day
    const fineAmount = overdueDays * finePerDay;

    fine = await prisma.libraryFine.create({
      data: {
        bookIssueId: validatedData.bookIssueId,
        amount: fineAmount,
        reason: `Late return - ${overdueDays} days overdue`
      }
    });
  }

  // Update issue record
  const updatedIssue = await prisma.bookIssue.update({
    where: { id: validatedData.bookIssueId },
    data: {
      returnDate,
      status: "RETURNED",
      remarks: validatedData.remarks
    },
    include: {
      bookCopy: { include: { book: true } },
      fines: true
    }
  });

  // Update book copy status
  await prisma.bookCopy.update({
    where: { id: bookIssue.bookCopyId },
    data: { status: "AVAILABLE" }
  });

  // Update available copies count
  await prisma.book.update({
    where: { id: bookIssue.bookCopy.bookId },
    data: { availableCopies: { increment: 1 } }
  });

  return SuccessResponse(res, "Book returned successfully", { ...updatedIssue, newFine: fine });
});

/**
 * @route   GET /api/library/issue/school/:schoolId
 * @desc    Get all book issues for a school
 * @access  Admin/School/Librarian
 */
export const getIssuesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { status } = req.query;

  const where: any = {
    bookCopy: { book: { schoolId: schoolId as string } }
  };
  if (status) where.status = status as string;

  const issues = await prisma.bookIssue.findMany({
    where,
    include: {
      bookCopy: { include: { book: { select: { title: true, author: true } } } },
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      fines: true
    },
    orderBy: { issueDate: "desc" }
  });

  return SuccessResponse(res, "Book issues retrieved successfully", issues);
});

/**
 * @route   GET /api/library/issue/student/:studentId
 * @desc    Get student's book issues
 * @access  Admin/School/Student/Parent
 */
export const getIssuesByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const issues = await prisma.bookIssue.findMany({
    where: { studentId: studentId as string },
    include: {
      bookCopy: { include: { book: true } },
      fines: true
    },
    orderBy: { issueDate: "desc" }
  });

  return SuccessResponse(res, "Student book issues retrieved successfully", issues);
});

/**
 * @route   GET /api/library/issue/teacher/:teacherId
 * @desc    Get teacher's book issues
 * @access  Admin/School/Teacher
 */
export const getIssuesByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;

  const issues = await prisma.bookIssue.findMany({
    where: { teacherId: teacherId as string },
    include: {
      bookCopy: { include: { book: true } },
      fines: true
    },
    orderBy: { issueDate: "desc" }
  });

  return SuccessResponse(res, "Teacher book issues retrieved successfully", issues);
});

/**
 * @route   GET /api/library/issue/overdue/:schoolId
 * @desc    Get overdue books
 * @access  Admin/School/Librarian
 */
export const getOverdueBooks = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  const today = new Date();

  const overdueIssues = await prisma.bookIssue.findMany({
    where: {
      bookCopy: { book: { schoolId: schoolId as string } },
      status: "ISSUED",
      dueDate: { lt: today }
    },
    include: {
      bookCopy: { include: { book: true } },
      student: { select: { id: true, firstName: true, lastName: true } },
      teacher: { select: { id: true, firstName: true, lastName: true } }
    },
    orderBy: { dueDate: "asc" }
  });

  // Update status to OVERDUE
  for (const issue of overdueIssues) {
    if (issue.status !== "OVERDUE") {
      await prisma.bookIssue.update({
        where: { id: issue.id },
        data: { status: "OVERDUE" }
      });
    }
  }

  return SuccessResponse(res, "Overdue books retrieved successfully", overdueIssues);
});

/**
 * @route   POST /api/library/fine
 * @desc    Create manual fine
 * @access  Admin/School/Librarian
 */
export const createFine = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createFineSchema.parse(req.body);

  const bookIssue = await prisma.bookIssue.findUnique({ where: { id: validatedData.bookIssueId } });
  if (!bookIssue) throw new ErrorResponse("Book issue not found", statusCode.Not_Found);

  const fine = await prisma.libraryFine.create({
    data: {
      bookIssueId: validatedData.bookIssueId,
      amount: validatedData.amount,
      reason: validatedData.reason
    }
  });

  return SuccessResponse(res, "Fine created successfully", fine, statusCode.Created);
});

/**
 * @route   POST /api/library/fine/pay
 * @desc    Pay fine
 * @access  Admin/School/Librarian
 */
export const payFine = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = payFineSchema.parse(req.body);

  const fine = await prisma.libraryFine.findUnique({ where: { id: validatedData.fineId } });
  if (!fine) throw new ErrorResponse("Fine not found", statusCode.Not_Found);

  if (fine.isPaid) {
    throw new ErrorResponse("Fine already paid", statusCode.Bad_Request);
  }

  const updatedFine = await prisma.libraryFine.update({
    where: { id: validatedData.fineId },
    data: {
      isPaid: true,
      paidDate: new Date(),
      paidAmount: validatedData.paidAmount
    }
  });

  return SuccessResponse(res, "Fine paid successfully", updatedFine);
});

/**
 * @route   GET /api/library/fine/unpaid/:schoolId
 * @desc    Get unpaid fines
 * @access  Admin/School/Librarian
 */
export const getUnpaidFines = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  const fines = await prisma.libraryFine.findMany({
    where: {
      isPaid: false,
      bookIssue: { bookCopy: { book: { schoolId: schoolId as string } } }
    },
    include: {
      bookIssue: {
        include: {
          bookCopy: { include: { book: { select: { title: true } } } },
          student: { select: { id: true, firstName: true, lastName: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Unpaid fines retrieved successfully", fines);
});
