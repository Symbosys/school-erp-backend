"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFinesByTeacher = exports.getFinesByStudent = exports.getUnpaidFinesBySchool = exports.payFine = exports.createFine = exports.getBorrowHistoryByTeacher = exports.getBorrowHistoryByStudent = exports.getBorrowRecordsBySchool = exports.returnBook = exports.issueBook = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const bookIssue_validation_1 = require("../validation/bookIssue.validation");
/**
 * @route   POST /api/library/issue
 * @desc    Borrow book (Record creation + Decrement stocks)
 * @access  Admin/School/Librarian
 */
exports.issueBook = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = bookIssue_validation_1.borrowBookSchema.parse(req.body);
    const book = await prisma_1.prisma.book.findUnique({
        where: { id: validatedData.bookId }
    });
    if (!book)
        throw new response_util_1.ErrorResponse("Book not found", types_1.statusCode.Not_Found);
    if (book.stocks !== null && book.stocks <= 0) {
        throw new response_util_1.ErrorResponse("Book out of stock", types_1.statusCode.Bad_Request);
    }
    // Validate borrower
    if (validatedData.studentId) {
        const student = await prisma_1.prisma.student.findUnique({ where: { id: validatedData.studentId } });
        if (!student)
            throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    }
    else if (validatedData.teacherId) {
        const teacher = await prisma_1.prisma.teacher.findUnique({ where: { id: validatedData.teacherId } });
        if (!teacher)
            throw new response_util_1.ErrorResponse("Teacher not found", types_1.statusCode.Not_Found);
    }
    // Create Borrow Record and Update Stocks in a Transaction
    const record = await prisma_1.prisma.$transaction(async (tx) => {
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
    return (0, response_util_1.SuccessResponse)(res, "Book borrowed successfully", record, types_1.statusCode.Created);
});
/**
 * @route   POST /api/library/return
 * @desc    Return book (Record update + Increment stocks)
 * @access  Admin/School/Librarian
 */
exports.returnBook = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = bookIssue_validation_1.returnBookSchema.parse(req.body);
    const borrowRecord = await prisma_1.prisma.bookBorrowed.findUnique({
        where: { id: validatedData.borrowId },
        include: { book: true }
    });
    if (!borrowRecord)
        throw new response_util_1.ErrorResponse("Borrow record not found", types_1.statusCode.Not_Found);
    if (borrowRecord.status === "RETURNED")
        throw new response_util_1.ErrorResponse("Book already returned", types_1.statusCode.Bad_Request);
    // Update Record and Stocks in a Transaction
    const updatedRecord = await prisma_1.prisma.$transaction(async (tx) => {
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
    return (0, response_util_1.SuccessResponse)(res, "Book returned successfully", updatedRecord);
});
/**
 * @route   GET /api/library/issue/school/:schoolId
 * @desc    Get all borrow records for a school
 * @access  Admin/School/Librarian
 */
exports.getBorrowRecordsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { status, page = 1, limit = 10 } = req.query;
    const where = {
        book: { schoolId: schoolId }
    };
    if (status)
        where.status = status;
    const skip = (Number(page) - 1) * Number(limit);
    const [records, totalRecords] = await Promise.all([
        prisma_1.prisma.bookBorrowed.findMany({
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
        prisma_1.prisma.bookBorrowed.count({ where })
    ]);
    return (0, response_util_1.SuccessResponse)(res, "Borrow records retrieved successfully", {
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
exports.getBorrowHistoryByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const records = await prisma_1.prisma.bookBorrowed.findMany({
        where: { studentId: studentId },
        include: {
            book: { select: { id: true, title: true, author: true } }
        },
        orderBy: { borrowDate: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Student borrow history retrieved successfully", records);
});
/**
 * @route   GET /api/library/issue/teacher/:teacherId
 * @desc    Get individual teacher's borrow history
 * @access  Admin/School/Teacher
 */
exports.getBorrowHistoryByTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { teacherId } = req.params;
    const records = await prisma_1.prisma.bookBorrowed.findMany({
        where: { teacherId: teacherId },
        include: {
            book: { select: { id: true, title: true, author: true } }
        },
        orderBy: { borrowDate: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher borrow history retrieved successfully", records);
});
/**
 * @route   POST /api/library/fine
 * @desc    Create manual fine
 * @access  Admin/School/Librarian
 */
exports.createFine = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = bookIssue_validation_1.createFineSchema.parse(req.body);
    const book = await prisma_1.prisma.book.findUnique({ where: { id: validatedData.bookId } });
    if (!book)
        throw new response_util_1.ErrorResponse("Book not found", types_1.statusCode.Not_Found);
    const fine = await prisma_1.prisma.libraryFine.create({
        data: {
            bookId: validatedData.bookId,
            studentId: validatedData.studentId,
            teacherId: validatedData.teacherId,
            amount: validatedData.amount,
            reason: validatedData.reason
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fine created successfully", fine, types_1.statusCode.Created);
});
/**
 * @route   POST /api/library/fine/pay
 * @desc    Pay fine
 * @access  Admin/School/Librarian
 */
exports.payFine = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = bookIssue_validation_1.payFineSchema.parse(req.body);
    const fine = await prisma_1.prisma.libraryFine.findUnique({ where: { id: validatedData.fineId } });
    if (!fine)
        throw new response_util_1.ErrorResponse("Fine not found", types_1.statusCode.Not_Found);
    if (fine.isPaid) {
        throw new response_util_1.ErrorResponse("Fine already paid", types_1.statusCode.Bad_Request);
    }
    const updatedFine = await prisma_1.prisma.libraryFine.update({
        where: { id: validatedData.fineId },
        data: {
            isPaid: true,
            paidDate: new Date(),
            paidAmount: validatedData.paidAmount
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fine paid successfully", updatedFine);
});
/**
 * @route   GET /api/library/fine/unpaid/school/:schoolId
 * @desc    Get unpaid fines for a school
 * @access  Admin/School/Librarian
 */
exports.getUnpaidFinesBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const fines = await prisma_1.prisma.libraryFine.findMany({
        where: {
            isPaid: false,
            book: { schoolId: schoolId }
        },
        include: {
            book: { select: { title: true } },
            student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
            teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } }
        },
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Unpaid fines retrieved successfully", fines);
});
/**
 * @route   GET /api/library/fine/student/:studentId
 * @desc    Get student's fine history
 * @access  Admin/School/Student/Parent
 */
exports.getFinesByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const fines = await prisma_1.prisma.libraryFine.findMany({
        where: { studentId: studentId },
        include: {
            book: { select: { title: true } }
        },
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Student fine history retrieved successfully", fines);
});
/**
 * @route   GET /api/library/fine/teacher/:teacherId
 * @desc    Get teacher's fine history
 * @access  Admin/School/Teacher
 */
exports.getFinesByTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { teacherId } = req.params;
    const fines = await prisma_1.prisma.libraryFine.findMany({
        where: { teacherId: teacherId },
        include: {
            book: { select: { title: true } }
        },
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher fine history retrieved successfully", fines);
});
//# sourceMappingURL=bookIssue.controller.js.map