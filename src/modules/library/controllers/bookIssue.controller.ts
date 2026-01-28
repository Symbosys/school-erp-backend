import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  borrowBookSchema,
  returnBookSchema,
  createFineSchema,
  payFineSchema,
} from "../validation/bookIssue.validation";

/**
 * @route   POST /api/library/issue
 * @desc    Borrow book (Record creation + Decrement stocks)
 * @access  Admin/School/Librarian
 */
export const issueBook = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = borrowBookSchema.parse(req.body);

  const book = await prisma.book.findUnique({
    where: { id: validatedData.bookId }
  });

  if (!book) throw new ErrorResponse("Book not found", statusCode.Not_Found);

  if (book.stocks !== null && book.stocks <= 0) {
    throw new ErrorResponse("Book out of stock", statusCode.Bad_Request);
  }

  // Validate borrower
  if (validatedData.studentId) {
    const student = await prisma.student.findUnique({ where: { id: validatedData.studentId } });
    if (!student) throw new ErrorResponse("Student not found", statusCode.Not_Found);
  } else if (validatedData.teacherId) {
    const teacher = await prisma.teacher.findUnique({ where: { id: validatedData.teacherId } });
    if (!teacher) throw new ErrorResponse("Teacher not found", statusCode.Not_Found);
  }

  // Create Borrow Record and Update Stocks in a Transaction
  const record = await prisma.$transaction(async (tx) => {
    const borrowRecord = await tx.bookBorrowed.create({
      data: {
        bookId: validatedData.bookId,
        studentId: validatedData.studentId,
        teacherId: validatedData.teacherId,
        dueDate: new Date(validatedData.dueDate),
        remarks: validatedData.remarks,
        status: "ISSUED"
      },
      include: {
        book: { select: { title: true } },
        student: { select: { firstName: true, lastName: true } },
        teacher: { select: { firstName: true, lastName: true } }
      }
    });

    await tx.book.update({
      where: { id: validatedData.bookId },
      data: {
        stocks: book.stocks !== null ? { decrement: 1 } : null,
        availableCopies: { decrement: 1 }
      }
    });

    return borrowRecord;
  });

  return SuccessResponse(res, "Book borrowed successfully", record, statusCode.Created);
});

/**
 * @route   POST /api/library/return
 * @desc    Return book (Record update + Increment stocks)
 * @access  Admin/School/Librarian
 */
export const returnBook = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = returnBookSchema.parse(req.body);

  const borrowRecord = await prisma.bookBorrowed.findUnique({
    where: { id: validatedData.borrowId },
    include: { book: true }
  });

  if (!borrowRecord) throw new ErrorResponse("Borrow record not found", statusCode.Not_Found);
  if (borrowRecord.status === "RETURNED") throw new ErrorResponse("Book already returned", statusCode.Bad_Request);

  // Update Record and Stocks in a Transaction
  const updatedRecord = await prisma.$transaction(async (tx) => {
    const record = await tx.bookBorrowed.update({
      where: { id: validatedData.borrowId },
      data: {
        returnDate: new Date(),
        status: "RETURNED",
        remarks: validatedData.remarks
      }
    });

    await tx.book.update({
      where: { id: borrowRecord.bookId },
      data: {
        stocks: borrowRecord.book.stocks !== null ? { increment: 1 } : null,
        availableCopies: { increment: 1 }
      }
    });

    return record;
  });

  return SuccessResponse(res, "Book returned successfully", updatedRecord);
});

/**
 * @route   GET /api/library/issue/school/:schoolId
 * @desc    Get all borrow records for a school
 * @access  Admin/School/Librarian
 */
export const getBorrowRecordsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { status, page = 1, limit = 10 } = req.query;

  const where: any = {
    book: { schoolId: schoolId as string }
  };
  if (status) where.status = status as string;

  const skip = (Number(page) - 1) * Number(limit);

  const [records, totalRecords] = await Promise.all([
    prisma.bookBorrowed.findMany({
      where,
      include: {
        book: { select: { id: true, title: true, author: true } },
        student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
        teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } }
      },
      orderBy: { borrowDate: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.bookBorrowed.count({ where })
  ]);

  return SuccessResponse(res, "Borrow records retrieved successfully", {
    records,
    pagination: {
      total: totalRecords,
      currentPage: Number(page),
      totalPages: Math.ceil(totalRecords / Number(limit)),
      limit: Number(limit),
      count: records.length
    }
  });
});

/**
 * @route   GET /api/library/issue/student/:studentId
 * @desc    Get individual student's borrow history
 * @access  Admin/School/Student/Parent
 */
export const getBorrowHistoryByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const records = await prisma.bookBorrowed.findMany({
    where: { studentId: studentId as string },
    include: {
      book: { select: { id: true, title: true, author: true } }
    },
    orderBy: { borrowDate: "desc" }
  });

  return SuccessResponse(res, "Student borrow history retrieved successfully", records);
});

/**
 * @route   GET /api/library/issue/teacher/:teacherId
 * @desc    Get individual teacher's borrow history
 * @access  Admin/School/Teacher
 */
export const getBorrowHistoryByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;

  const records = await prisma.bookBorrowed.findMany({
    where: { teacherId: teacherId as string },
    include: {
      book: { select: { id: true, title: true, author: true } }
    },
    orderBy: { borrowDate: "desc" }
  });

  return SuccessResponse(res, "Teacher borrow history retrieved successfully", records);
});

/**
 * @route   POST /api/library/fine
 * @desc    Create manual fine
 * @access  Admin/School/Librarian
 */
export const createFine = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createFineSchema.parse(req.body);

  const book = await prisma.book.findUnique({ where: { id: validatedData.bookId } });
  if (!book) throw new ErrorResponse("Book not found", statusCode.Not_Found);

  const fine = await prisma.libraryFine.create({
    data: {
      bookId: validatedData.bookId,
      studentId: validatedData.studentId,
      teacherId: validatedData.teacherId,
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
 * @route   GET /api/library/fine/unpaid/school/:schoolId
 * @desc    Get unpaid fines for a school
 * @access  Admin/School/Librarian
 */
export const getUnpaidFinesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  const fines = await prisma.libraryFine.findMany({
    where: {
      isPaid: false,
      book: { schoolId: schoolId as string }
    },
    include: {
      book: { select: { title: true } },
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Unpaid fines retrieved successfully", fines);
});

/**
 * @route   GET /api/library/fine/student/:studentId
 * @desc    Get student's fine history
 * @access  Admin/School/Student/Parent
 */
export const getFinesByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const fines = await prisma.libraryFine.findMany({
    where: { studentId: studentId as string },
    include: {
      book: { select: { title: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Student fine history retrieved successfully", fines);
});

/**
 * @route   GET /api/library/fine/teacher/:teacherId
 * @desc    Get teacher's fine history
 * @access  Admin/School/Teacher
 */
export const getFinesByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;

  const fines = await prisma.libraryFine.findMany({
    where: { teacherId: teacherId as string },
    include: {
      book: { select: { title: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Teacher fine history retrieved successfully", fines);
});
