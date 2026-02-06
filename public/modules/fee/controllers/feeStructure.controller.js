"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFeeStructureItem = exports.addFeeStructureItem = exports.deleteFeeStructure = exports.updateFeeStructure = exports.getFeeStructureById = exports.getFeeStructuresBySchool = exports.createFeeStructure = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const feeStructure_validation_1 = require("../validation/feeStructure.validation");
/**
 * @route   POST /api/fee/structure
 * @desc    Create new fee structure with items
 * @access  Admin/School
 */
exports.createFeeStructure = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = feeStructure_validation_1.createFeeStructureSchema.parse(req.body);
    // Validate school, class, and academic year exist
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    const classEntity = await prisma_1.prisma.class.findUnique({ where: { id: validatedData.classId } });
    if (!classEntity)
        throw new response_util_1.ErrorResponse("Class not found", types_1.statusCode.Not_Found);
    const academicYear = await prisma_1.prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
    if (!academicYear)
        throw new response_util_1.ErrorResponse("Academic year not found", types_1.statusCode.Not_Found);
    // Check same school
    if (classEntity.schoolId !== validatedData.schoolId || academicYear.schoolId !== validatedData.schoolId) {
        throw new response_util_1.ErrorResponse("Class and Academic Year must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // Check duplicate
    const existing = await prisma_1.prisma.feeStructure.findUnique({
        where: {
            classId_academicYearId: {
                classId: validatedData.classId,
                academicYearId: validatedData.academicYearId
            }
        }
    });
    if (existing) {
        throw new response_util_1.ErrorResponse("Fee structure already exists for this class and academic year", types_1.statusCode.Conflict);
    }
    // Create structure with items in transaction
    const structure = await prisma_1.prisma.feeStructure.create({
        data: {
            schoolId: validatedData.schoolId,
            classId: validatedData.classId,
            academicYearId: validatedData.academicYearId,
            name: validatedData.name,
            totalAmount: validatedData.totalAmount,
            dueDay: validatedData.dueDay ?? 10,
            lateFeePercentage: validatedData.lateFeePercentage ?? 0,
            lateFeeFixedAmount: validatedData.lateFeeFixedAmount ?? 0,
            gracePeriodDays: validatedData.gracePeriodDays ?? 5,
            isActive: validatedData.isActive ?? true,
            items: {
                create: validatedData.items.map(item => ({
                    feeCategoryId: item.feeCategoryId,
                    amount: item.amount,
                    frequency: item.frequency ?? "MONTHLY"
                }))
            }
        },
        include: {
            items: {
                include: { feeCategory: true }
            },
            class: true,
            academicYear: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee structure created successfully", structure, types_1.statusCode.Created);
});
/**
 * @route   GET /api/fee/structure/school/:schoolId
 * @desc    Get all fee structures for a school
 * @access  Admin/School
 */
exports.getFeeStructuresBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { academicYearId, classId, isActive } = req.query;
    const where = { schoolId: schoolId };
    if (academicYearId)
        where.academicYearId = academicYearId;
    if (classId)
        where.classId = classId;
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    const structures = await prisma_1.prisma.feeStructure.findMany({
        where,
        include: {
            class: true,
            academicYear: true,
            _count: { select: { items: true, studentFees: true } }
        },
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee structures retrieved successfully", structures);
});
/**
 * @route   GET /api/fee/structure/:id
 * @desc    Get fee structure by ID with all items
 * @access  Admin/School
 */
exports.getFeeStructureById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const structure = await prisma_1.prisma.feeStructure.findUnique({
        where: { id: id },
        include: {
            items: {
                include: { feeCategory: true }
            },
            class: true,
            academicYear: true,
            _count: { select: { studentFees: true } }
        }
    });
    if (!structure)
        throw new response_util_1.ErrorResponse("Fee structure not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Fee structure retrieved successfully", structure);
});
/**
 * @route   PUT /api/fee/structure/:id
 * @desc    Update fee structure
 * @access  Admin/School
 */
exports.updateFeeStructure = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = feeStructure_validation_1.updateFeeStructureSchema.parse(req.body);
    const existing = await prisma_1.prisma.feeStructure.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Fee structure not found", types_1.statusCode.Not_Found);
    const structure = await prisma_1.prisma.feeStructure.update({
        where: { id: id },
        data: validatedData,
        include: {
            items: { include: { feeCategory: true } },
            class: true,
            academicYear: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee structure updated successfully", structure);
});
/**
 * @route   DELETE /api/fee/structure/:id
 * @desc    Delete fee structure
 * @access  Admin
 */
exports.deleteFeeStructure = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const structure = await prisma_1.prisma.feeStructure.findUnique({
        where: { id: id },
        include: { _count: { select: { studentFees: true } } }
    });
    if (!structure)
        throw new response_util_1.ErrorResponse("Fee structure not found", types_1.statusCode.Not_Found);
    const feeCount = structure._count?.studentFees ?? 0;
    if (feeCount > 0) {
        throw new response_util_1.ErrorResponse("Cannot delete structure assigned to students", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.feeStructure.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Fee structure deleted successfully", null);
});
/**
 * @route   POST /api/fee/structure/item
 * @desc    Add item to fee structure
 * @access  Admin/School
 */
exports.addFeeStructureItem = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = feeStructure_validation_1.addFeeStructureItemSchema.parse(req.body);
    const structure = await prisma_1.prisma.feeStructure.findUnique({ where: { id: validatedData.feeStructureId } });
    if (!structure)
        throw new response_util_1.ErrorResponse("Fee structure not found", types_1.statusCode.Not_Found);
    const category = await prisma_1.prisma.feeCategory.findUnique({ where: { id: validatedData.feeCategoryId } });
    if (!category)
        throw new response_util_1.ErrorResponse("Fee category not found", types_1.statusCode.Not_Found);
    // Check same school
    if (structure.schoolId !== category.schoolId) {
        throw new response_util_1.ErrorResponse("Category must belong to the same school", types_1.statusCode.Bad_Request);
    }
    const item = await prisma_1.prisma.feeStructureItem.create({
        data: {
            feeStructureId: validatedData.feeStructureId,
            feeCategoryId: validatedData.feeCategoryId,
            amount: validatedData.amount,
            frequency: validatedData.frequency ?? "MONTHLY"
        },
        include: { feeCategory: true }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee item added successfully", item, types_1.statusCode.Created);
});
/**
 * @route   DELETE /api/fee/structure/item/:id
 * @desc    Remove item from fee structure
 * @access  Admin/School
 */
exports.removeFeeStructureItem = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const item = await prisma_1.prisma.feeStructureItem.findUnique({ where: { id: id } });
    if (!item)
        throw new response_util_1.ErrorResponse("Fee item not found", types_1.statusCode.Not_Found);
    await prisma_1.prisma.feeStructureItem.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Fee item removed successfully", null);
});
//# sourceMappingURL=feeStructure.controller.js.map