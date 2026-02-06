"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payFineSchema = exports.createFineSchema = exports.returnBookSchema = exports.borrowBookSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Borrowing Book
 */
exports.borrowBookSchema = zod_1.z.object({
    bookId: zod_1.z.string().uuid("Invalid book ID"),
    studentId: zod_1.z.string().uuid().optional().nullable(),
    teacherId: zod_1.z.string().uuid().optional().nullable(),
    dueDate: zod_1.z.string().min(1, "Due date is required"),
    remarks: zod_1.z.string().optional(),
}).refine((data) => data.studentId || data.teacherId, { message: "Either studentId or teacherId is required" });
/**
 * Zod Schema for Returning Book
 */
exports.returnBookSchema = zod_1.z.object({
    borrowId: zod_1.z.string().uuid("Invalid borrow ID"),
    remarks: zod_1.z.string().optional(),
});
/**
 * Zod Schema for Creating Fine
 */
exports.createFineSchema = zod_1.z.object({
    bookId: zod_1.z.string().uuid("Invalid book ID"),
    studentId: zod_1.z.string().uuid().optional().nullable(),
    teacherId: zod_1.z.string().uuid().optional().nullable(),
    amount: zod_1.z.number().positive("Amount must be positive"),
    reason: zod_1.z.string().min(1).max(200),
}).refine((data) => data.studentId || data.teacherId, { message: "Either studentId or teacherId is required" });
/**
 * Zod Schema for Paying Fine
 */
exports.payFineSchema = zod_1.z.object({
    fineId: zod_1.z.string().uuid("Invalid fine ID"),
    paidAmount: zod_1.z.number().positive("Amount must be positive"),
});
//# sourceMappingURL=bookIssue.validation.js.map