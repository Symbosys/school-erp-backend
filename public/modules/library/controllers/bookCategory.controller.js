"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBookCategory = exports.updateBookCategory = exports.getBookCategoryById = exports.getBookCategoriesBySchool = exports.createBookCategory = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const bookCategory_validation_1 = require("../validation/bookCategory.validation");
/**
 * @route   POST /api/library/category
 * @desc    Create book category
 * @access  Admin/School
 */
exports.createBookCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = bookCategory_validation_1.createBookCategorySchema.parse(req.body);
    // Check school exists
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    // Check duplicate
    const existing = await prisma_1.prisma.bookCategory.findUnique({
        where: {
            schoolId_name: {
                schoolId: validatedData.schoolId,
                name: validatedData.name
            }
        }
    });
    if (existing) {
        throw new response_util_1.ErrorResponse("Category with this name already exists", types_1.statusCode.Conflict);
    }
    const category = await prisma_1.prisma.bookCategory.create({
        data: {
            ...validatedData,
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Book category created successfully", category, types_1.statusCode.Created);
});
/**
 * @route   GET /api/library/category/school/:schoolId
 * @desc    Get all book categories for a school
 * @access  Admin/School
 */
exports.getBookCategoriesBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive } = req.query;
    const where = { schoolId: schoolId };
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    const categories = await prisma_1.prisma.bookCategory.findMany({
        where,
        include: { _count: { select: { books: true } } },
        orderBy: { name: "asc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Book categories retrieved successfully", categories);
});
/**
 * @route   GET /api/library/category/:id
 * @desc    Get book category by ID
 * @access  Admin/School
 */
exports.getBookCategoryById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await prisma_1.prisma.bookCategory.findUnique({
        where: { id: id },
        include: { _count: { select: { books: true } } }
    });
    if (!category)
        throw new response_util_1.ErrorResponse("Book category not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Book category retrieved successfully", category);
});
/**
 * @route   PUT /api/library/category/:id
 * @desc    Update book category
 * @access  Admin/School
 */
exports.updateBookCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = bookCategory_validation_1.updateBookCategorySchema.parse(req.body);
    const existing = await prisma_1.prisma.bookCategory.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Book category not found", types_1.statusCode.Not_Found);
    const category = await prisma_1.prisma.bookCategory.update({
        where: { id: id },
        data: validatedData
    });
    return (0, response_util_1.SuccessResponse)(res, "Book category updated successfully", category);
});
/**
 * @route   DELETE /api/library/category/:id
 * @desc    Delete book category
 * @access  Admin
 */
exports.deleteBookCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await prisma_1.prisma.bookCategory.findUnique({
        where: { id: id },
        include: { _count: { select: { books: true } } }
    });
    if (!category)
        throw new response_util_1.ErrorResponse("Book category not found", types_1.statusCode.Not_Found);
    const bookCount = category._count?.books ?? 0;
    if (bookCount > 0) {
        throw new response_util_1.ErrorResponse("Cannot delete category with books", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.bookCategory.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Book category deleted successfully", null);
});
//# sourceMappingURL=bookCategory.controller.js.map