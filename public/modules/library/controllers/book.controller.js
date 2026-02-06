"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBook = exports.updateBook = exports.getBookById = exports.getBooksBySchool = exports.createBook = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const book_validation_1 = require("../validation/book.validation");
/**
 * @route   POST /api/library/book
 * @desc    Create book
 * @access  Admin/School
 */
exports.createBook = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = book_validation_1.createBookSchema.parse(req.body);
    // Check school and category
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    const category = await prisma_1.prisma.bookCategory.findUnique({ where: { id: validatedData.categoryId } });
    if (!category)
        throw new response_util_1.ErrorResponse("Category not found", types_1.statusCode.Not_Found);
    if (category.schoolId !== validatedData.schoolId) {
        throw new response_util_1.ErrorResponse("Category must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // Create book
    const book = await prisma_1.prisma.book.create({
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
    return (0, response_util_1.SuccessResponse)(res, "Book created successfully", book, types_1.statusCode.Created);
});
/**
 * @route   GET /api/library/book/school/:schoolId
 * @desc    Get all books for a school
 * @access  Admin/School
 */
exports.getBooksBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { categoryId, search, isActive, page = 1, limit = 10 } = req.query;
    const where = { schoolId: schoolId };
    if (categoryId)
        where.categoryId = categoryId;
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    const skip = (Number(page) - 1) * Number(limit);
    if (search) {
        where.OR = [
            { title: { contains: search } },
            { author: { contains: search } },
            { isbn: { contains: search } }
        ];
    }
    const [books, totalBooks] = await Promise.all([
        prisma_1.prisma.book.findMany({
            where,
            include: {
                category: true,
            },
            orderBy: { title: "asc" },
            skip,
            take: Number(limit),
        }),
        prisma_1.prisma.book.count({ where })
    ]);
    return (0, response_util_1.SuccessResponse)(res, "Books retrieved successfully", {
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
exports.getBookById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const book = await prisma_1.prisma.book.findUnique({
        where: { id: id },
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
    if (!book)
        throw new response_util_1.ErrorResponse("Book not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Book retrieved successfully", book);
});
/**
 * @route   PUT /api/library/book/:id
 * @desc    Update book
 * @access  Admin/School
 */
exports.updateBook = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = book_validation_1.updateBookSchema.parse(req.body);
    const existing = await prisma_1.prisma.book.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Book not found", types_1.statusCode.Not_Found);
    const book = await prisma_1.prisma.book.update({
        where: { id: id },
        data: validatedData,
        include: { category: true }
    });
    return (0, response_util_1.SuccessResponse)(res, "Book updated successfully", book);
});
/**
 * @route   DELETE /api/library/book/:id
 * @desc    Delete book
 * @access  Admin
 */
exports.deleteBook = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const book = await prisma_1.prisma.book.findUnique({
        where: { id: id },
    });
    if (!book)
        throw new response_util_1.ErrorResponse("Book not found", types_1.statusCode.Not_Found);
    await prisma_1.prisma.book.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Book deleted successfully", null);
});
//# sourceMappingURL=book.controller.js.map