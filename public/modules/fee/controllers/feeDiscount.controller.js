"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteFeeDiscount = exports.updateFeeDiscount = exports.getFeeDiscountById = exports.getDiscountsBySchool = exports.getDiscountsByStudent = exports.createFeeDiscount = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const feeDiscount_validation_1 = require("../validation/feeDiscount.validation");
/**
 * @route   POST /api/fee/discount
 * @desc    Create fee discount for a student
 * @access  Admin/School
 */
exports.createFeeDiscount = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = feeDiscount_validation_1.createFeeDiscountSchema.parse(req.body);
    // Validate student and academic year
    const student = await prisma_1.prisma.student.findUnique({ where: { id: validatedData.studentId } });
    if (!student)
        throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    const academicYear = await prisma_1.prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
    if (!academicYear)
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    // Validate fee category if provided
    if (validatedData.feeCategoryId) {
        const category = await prisma_1.prisma.feeCategory.findUnique({ where: { id: validatedData.feeCategoryId } });
        if (!category)
            throw new response_util_1.ErrorResponse("Fee category not found", types_1.statusCode.Not_Found);
        if (category.schoolId !== student.schoolId) {
            throw new response_util_1.ErrorResponse("Fee category must belong to the same school", types_1.statusCode.Bad_Request);
        }
    }
    const discount = await prisma_1.prisma.feeDiscount.create({
        data: {
            studentId: validatedData.studentId,
            academicYearId: validatedData.academicYearId,
            feeCategoryId: validatedData.feeCategoryId || null,
            discountType: validatedData.discountType,
            discountValue: validatedData.discountValue,
            reason: validatedData.reason,
            approvedBy: validatedData.approvedBy,
            isActive: validatedData.isActive ?? true
        },
        include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            feeCategory: true,
            academicYear: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee discount created successfully", discount, types_1.statusCode.Created);
});
/**
 * @route   GET /api/fee/discount/student/:studentId
 * @desc    Get all discounts for a student
 * @access  Admin/School
 */
exports.getDiscountsByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const { academicYearId } = req.query;
    const where = { studentId: studentId };
    if (academicYearId)
        where.academicYearId = academicYearId;
    const discounts = await prisma_1.prisma.feeDiscount.findMany({
        where,
        include: {
            feeCategory: true,
            academicYear: true
        },
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Discounts retrieved successfully", discounts);
});
/**
 * @route   GET /api/fee/discount/school/:schoolId
 * @desc    Get all discounts for a school
 * @access  Admin/School
 */
exports.getDiscountsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { academicYearId } = req.query;
    const where = {
        student: { schoolId: schoolId }
    };
    if (academicYearId)
        where.academicYearId = academicYearId;
    const discounts = await prisma_1.prisma.feeDiscount.findMany({
        where,
        include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
            feeCategory: true,
            academicYear: true
        },
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Discounts retrieved successfully", discounts);
});
/**
 * @route   GET /api/fee/discount/:id
 * @desc    Get discount by ID
 * @access  Admin/School
 */
exports.getFeeDiscountById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const discount = await prisma_1.prisma.feeDiscount.findUnique({
        where: { id: id },
        include: {
            student: true,
            feeCategory: true,
            academicYear: true
        }
    });
    if (!discount)
        throw new response_util_1.ErrorResponse("Discount not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Discount retrieved successfully", discount);
});
/**
 * @route   PUT /api/fee/discount/:id
 * @desc    Update fee discount
 * @access  Admin/School
 */
exports.updateFeeDiscount = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = feeDiscount_validation_1.updateFeeDiscountSchema.parse(req.body);
    const existing = await prisma_1.prisma.feeDiscount.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Discount not found", types_1.statusCode.Not_Found);
    const discount = await prisma_1.prisma.feeDiscount.update({
        where: { id: id },
        data: validatedData,
        include: {
            student: { select: { id: true, firstName: true, lastName: true } },
            feeCategory: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Discount updated successfully", discount);
});
/**
 * @route   DELETE /api/fee/discount/:id
 * @desc    Delete fee discount
 * @access  Admin
 */
exports.deleteFeeDiscount = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const discount = await prisma_1.prisma.feeDiscount.findUnique({ where: { id: id } });
    if (!discount)
        throw new response_util_1.ErrorResponse("Discount not found", types_1.statusCode.Not_Found);
    await prisma_1.prisma.feeDiscount.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Discount deleted successfully", null);
});
//# sourceMappingURL=feeDiscount.controller.js.map