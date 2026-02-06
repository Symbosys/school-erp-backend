"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteClass = exports.updateClass = exports.getClassById = exports.getClassesBySchool = exports.createClass = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const class_validation_1 = require("../validation/class.validation");
/**
 * @route   POST /api/school/class
 * @desc    Create a new class
 * @access  Admin/School
 */
exports.createClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = class_validation_1.createClassSchema.parse(req.body);
    // Check if school exists
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: validatedData.schoolId }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Check if class with same grade already exists for this school
    const existingClass = await prisma_1.prisma.class.findFirst({
        where: {
            schoolId: validatedData.schoolId,
            grade: validatedData.grade
        }
    });
    if (existingClass) {
        throw new response_util_1.ErrorResponse(`Class with grade ${validatedData.grade} already exists for this school`, types_1.statusCode.Conflict);
    }
    // Create class
    const newClass = await prisma_1.prisma.class.create({
        data: {
            schoolId: validatedData.schoolId,
            name: validatedData.name,
            grade: validatedData.grade,
            description: validatedData.description || null,
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Class created successfully", newClass, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/class/school/:schoolId
 * @desc    Get all classes for a school
 * @access  Admin/School
 */
exports.getClassesBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive } = req.query;
    const where = { schoolId: schoolId };
    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }
    const classes = await prisma_1.prisma.class.findMany({
        where,
        orderBy: { grade: "asc" },
        include: {
            _count: {
                select: {
                    sections: true,
                    subjects: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Classes retrieved successfully", classes);
});
/**
 * @route   GET /api/school/class/:id
 * @desc    Get class by ID
 * @access  Admin/School
 */
exports.getClassById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const classData = await prisma_1.prisma.class.findUnique({
        where: { id: id },
        include: {
            school: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            sections: {
                where: { isActive: true },
                orderBy: { name: "asc" }
            },
            _count: {
                select: {
                    sections: true,
                    subjects: true
                }
            }
        }
    });
    if (!classData) {
        throw new response_util_1.ErrorResponse("Class not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Class retrieved successfully", classData);
});
/**
 * @route   PUT /api/school/class/:id
 * @desc    Update class
 * @access  Admin/School
 */
exports.updateClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = class_validation_1.updateClassSchema.parse(req.body);
    const existingClass = await prisma_1.prisma.class.findUnique({
        where: { id: id }
    });
    if (!existingClass) {
        throw new response_util_1.ErrorResponse("Class not found", types_1.statusCode.Not_Found);
    }
    const updateData = {};
    if (validatedData.name)
        updateData.name = validatedData.name;
    if (validatedData.description !== undefined)
        updateData.description = validatedData.description || null;
    if (validatedData.isActive !== undefined)
        updateData.isActive = validatedData.isActive;
    const updatedClass = await prisma_1.prisma.class.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Class updated successfully", updatedClass);
});
/**
 * @route   DELETE /api/school/class/:id
 * @desc    Delete class
 * @access  Admin
 */
exports.deleteClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const classData = await prisma_1.prisma.class.findUnique({
        where: { id: id },
        include: {
            _count: {
                select: {
                    sections: true
                }
            }
        }
    });
    if (!classData) {
        throw new response_util_1.ErrorResponse("Class not found", types_1.statusCode.Not_Found);
    }
    // Check if class has sections
    if (classData._count.sections > 0) {
        throw new response_util_1.ErrorResponse("Cannot delete class with existing sections", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.class.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Class deleted successfully", null);
});
//# sourceMappingURL=class.controller.js.map