"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFeeCategory = exports.updateFeeCategory = exports.getFeeCategoryById = exports.getFeeCategoriesBySchool = exports.createFeeCategory = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const feeCategory_validation_1 = require("../validation/feeCategory.validation");
/**
 * @route   POST /api/fee/category
 * @desc    Create new fee category
 * @access  Admin/School
 */
exports.createFeeCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = feeCategory_validation_1.createFeeCategorySchema.parse(req.body);
    // Check school exists
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    // Check duplicate name
    const existing = await prisma_1.prisma.feeCategory.findUnique({
        where: {
            schoolId_name: {
                schoolId: validatedData.schoolId,
                name: validatedData.name
            }
        }
    });
    if (existing) {
        throw new response_util_1.ErrorResponse("Fee category with this name already exists", types_1.statusCode.Conflict);
    }
    const category = await prisma_1.prisma.feeCategory.create({
        data: {
            ...validatedData,
            isRecurring: validatedData.isRecurring ?? true,
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee category created successfully", category, types_1.statusCode.Created);
});
/**
 * @route   GET /api/fee/category/school/:schoolId
 * @desc    Get all fee categories for a school
 * @access  Admin/School
 */
exports.getFeeCategoriesBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive } = req.query;
    const where = { schoolId: schoolId };
    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }
    const categories = await prisma_1.prisma.feeCategory.findMany({
        where,
        orderBy: { name: "asc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee categories retrieved successfully", categories);
});
/**
 * @route   GET /api/fee/category/:id
 * @desc    Get fee category by ID
 * @access  Admin/School
 */
exports.getFeeCategoryById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await prisma_1.prisma.feeCategory.findUnique({
        where: { id: id },
        include: {
            _count: {
                select: { feeStructureItems: true }
            }
        }
    });
    if (!category)
        throw new response_util_1.ErrorResponse("Fee category not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Fee category retrieved successfully", category);
});
/**
 * @route   PUT /api/fee/category/:id
 * @desc    Update fee category
 * @access  Admin/School
 */
exports.updateFeeCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = feeCategory_validation_1.updateFeeCategorySchema.parse(req.body);
    const existing = await prisma_1.prisma.feeCategory.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Fee category not found", types_1.statusCode.Not_Found);
    const category = await prisma_1.prisma.feeCategory.update({
        where: { id: id },
        data: validatedData
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee category updated successfully", category);
});
/**
 * @route   DELETE /api/fee/category/:id
 * @desc    Delete fee category
 * @access  Admin
 */
exports.deleteFeeCategory = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const category = await prisma_1.prisma.feeCategory.findUnique({
        where: { id: id },
        include: {
            _count: { select: { feeStructureItems: true } }
        }
    });
    if (!category)
        throw new response_util_1.ErrorResponse("Fee category not found", types_1.statusCode.Not_Found);
    const itemCount = category._count?.feeStructureItems ?? 0;
    if (itemCount > 0) {
        throw new response_util_1.ErrorResponse("Cannot delete category used in fee structures", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.feeCategory.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Fee category deleted successfully", null);
});
//# sourceMappingURL=feeCategory.controller.js.map