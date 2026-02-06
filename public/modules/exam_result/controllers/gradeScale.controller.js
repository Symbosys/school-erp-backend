"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGradeScale = exports.updateGradeScale = exports.getGradeScaleById = exports.getGradeScalesBySchool = exports.createGradeScale = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const gradeScale_validation_1 = require("../validation/gradeScale.validation");
/**
 * @route   POST /api/exam/grade-scale
 * @desc    Create grade scale entry
 * @access  Admin/School
 */
exports.createGradeScale = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = gradeScale_validation_1.createGradeScaleSchema.parse(req.body);
    // Check school exists
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    // Check duplicate
    const existing = await prisma_1.prisma.gradeScale.findUnique({
        where: {
            schoolId_name: {
                schoolId: validatedData.schoolId,
                name: validatedData.name
            }
        }
    });
    if (existing) {
        throw new response_util_1.ErrorResponse("Grade scale with this name already exists", types_1.statusCode.Conflict);
    }
    const gradeScale = await prisma_1.prisma.gradeScale.create({
        data: {
            ...validatedData,
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Grade scale created successfully", gradeScale, types_1.statusCode.Created);
});
/**
 * @route   GET /api/exam/grade-scale/school/:schoolId
 * @desc    Get all grade scales for a school
 * @access  Admin/School
 */
exports.getGradeScalesBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive } = req.query;
    const where = { schoolId: schoolId };
    if (isActive !== undefined)
        where.isActive = isActive === "true";
    const gradeScales = await prisma_1.prisma.gradeScale.findMany({
        where,
        orderBy: { minPercentage: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Grade scales retrieved successfully", gradeScales);
});
/**
 * @route   GET /api/exam/grade-scale/:id
 * @desc    Get grade scale by ID
 * @access  Admin/School
 */
exports.getGradeScaleById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const gradeScale = await prisma_1.prisma.gradeScale.findUnique({
        where: { id: id }
    });
    if (!gradeScale)
        throw new response_util_1.ErrorResponse("Grade scale not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Grade scale retrieved successfully", gradeScale);
});
/**
 * @route   PUT /api/exam/grade-scale/:id
 * @desc    Update grade scale
 * @access  Admin/School
 */
exports.updateGradeScale = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = gradeScale_validation_1.updateGradeScaleSchema.parse(req.body);
    const existing = await prisma_1.prisma.gradeScale.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Grade scale not found", types_1.statusCode.Not_Found);
    const gradeScale = await prisma_1.prisma.gradeScale.update({
        where: { id: id },
        data: validatedData
    });
    return (0, response_util_1.SuccessResponse)(res, "Grade scale updated successfully", gradeScale);
});
/**
 * @route   DELETE /api/exam/grade-scale/:id
 * @desc    Delete grade scale
 * @access  Admin
 */
exports.deleteGradeScale = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const gradeScale = await prisma_1.prisma.gradeScale.findUnique({ where: { id: id } });
    if (!gradeScale)
        throw new response_util_1.ErrorResponse("Grade scale not found", types_1.statusCode.Not_Found);
    await prisma_1.prisma.gradeScale.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Grade scale deleted successfully", null);
});
//# sourceMappingURL=gradeScale.controller.js.map