"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBookSchema = exports.createBookSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Creating Book
 */
exports.createBookSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    categoryId: zod_1.z.string().uuid("Invalid category ID"),
    title: zod_1.z.string().min(1, "Title is required").max(200),
    author: zod_1.z.string().min(1, "Author is required").max(200),
    isbn: zod_1.z.string().max(20).optional(),
    publisher: zod_1.z.string().max(100).optional(),
    publishYear: zod_1.z.number().min(1800).max(2100).optional(),
    description: zod_1.z.string().optional(),
    totalCopies: zod_1.z.number().min(0).optional(),
    availableCopies: zod_1.z.number().min(0).optional(),
    stocks: zod_1.z.number().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Updating Book
 */
exports.updateBookSchema = zod_1.z.object({
    categoryId: zod_1.z.string().uuid().optional(),
    title: zod_1.z.string().max(200).optional(),
    author: zod_1.z.string().max(200).optional(),
    isbn: zod_1.z.string().max(20).optional(),
    publisher: zod_1.z.string().max(100).optional(),
    publishYear: zod_1.z.number().min(1800).max(2100).optional(),
    description: zod_1.z.string().optional(),
    stocks: zod_1.z.number().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=book.validation.js.map