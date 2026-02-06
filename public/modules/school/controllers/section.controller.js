"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSection = exports.updateSection = exports.getSectionById = exports.getSectionsBySchool = exports.getSectionsByClass = exports.createSection = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const section_validation_1 = require("../validation/section.validation");
/**
 * @route   POST /api/school/section
 * @desc    Create a new section
 * @access  Admin/School
 */
exports.createSection = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = section_validation_1.createSectionSchema.parse(req.body);
    // Check if school exists
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: validatedData.schoolId }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Check if class exists
    const classData = await prisma_1.prisma.class.findUnique({
        where: { id: validatedData.classId }
    });
    if (!classData) {
        throw new response_util_1.ErrorResponse("Class not found", types_1.statusCode.Not_Found);
    }
    // Verify class belongs to the school
    if (classData.schoolId !== validatedData.schoolId) {
        throw new response_util_1.ErrorResponse("Class does not belong to this school", types_1.statusCode.Bad_Request);
    }
    // Check if section with same name already exists for this class
    const existingSection = await prisma_1.prisma.section.findFirst({
        where: {
            classId: validatedData.classId,
            name: validatedData.name
        }
    });
    if (existingSection) {
        throw new response_util_1.ErrorResponse(`Section ${validatedData.name} already exists for this class`, types_1.statusCode.Conflict);
    }
    // Create section
    const section = await prisma_1.prisma.section.create({
        data: {
            schoolId: validatedData.schoolId,
            classId: validatedData.classId,
            name: validatedData.name,
            capacity: validatedData.capacity || 40,
            roomNumber: validatedData.roomNumber || null,
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Section created successfully", section, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/section/class/:classId
 * @desc    Get all sections for a class
 * @access  Admin/School
 */
exports.getSectionsByClass = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { classId } = req.params;
    const { isActive } = req.query;
    const where = { classId: classId };
    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }
    const sections = await prisma_1.prisma.section.findMany({
        where,
        orderBy: { name: "asc" },
        include: {
            class: {
                select: {
                    id: true,
                    name: true,
                    grade: true
                }
            },
            _count: {
                select: {
                    enrollments: true,
                    teacherAssignments: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Sections retrieved successfully", sections);
});
/**
 * @route   GET /api/school/section/school/:schoolId
 * @desc    Get all sections for a school
 * @access  Admin/School
 */
exports.getSectionsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive } = req.query;
    const where = { schoolId: schoolId };
    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }
    const sections = await prisma_1.prisma.section.findMany({
        where,
        orderBy: [
            { class: { grade: "asc" } },
            { name: "asc" }
        ],
        include: {
            class: {
                select: {
                    id: true,
                    name: true,
                    grade: true
                }
            },
            _count: {
                select: {
                    enrollments: true,
                    teacherAssignments: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Sections retrieved successfully", sections);
});
/**
 * @route   GET /api/school/section/:id
 * @desc    Get section by ID
 * @access  Admin/School
 */
exports.getSectionById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const section = await prisma_1.prisma.section.findUnique({
        where: { id: id },
        include: {
            school: {
                select: {
                    id: true,
                    name: true,
                    code: true
                }
            },
            class: {
                select: {
                    id: true,
                    name: true,
                    grade: true
                }
            },
            _count: {
                select: {
                    enrollments: true,
                    teacherAssignments: true
                }
            }
        }
    });
    if (!section) {
        throw new response_util_1.ErrorResponse("Section not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Section retrieved successfully", section);
});
/**
 * @route   PUT /api/school/section/:id
 * @desc    Update section
 * @access  Admin/School
 */
exports.updateSection = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = section_validation_1.updateSectionSchema.parse(req.body);
    const existingSection = await prisma_1.prisma.section.findUnique({
        where: { id: id }
    });
    if (!existingSection) {
        throw new response_util_1.ErrorResponse("Section not found", types_1.statusCode.Not_Found);
    }
    // If updating name, check for duplicates in the same class
    if (validatedData.name && validatedData.name !== existingSection.name) {
        const duplicateSection = await prisma_1.prisma.section.findFirst({
            where: {
                classId: existingSection.classId,
                name: validatedData.name,
                id: { not: id }
            }
        });
        if (duplicateSection) {
            throw new response_util_1.ErrorResponse(`Section ${validatedData.name} already exists for this class`, types_1.statusCode.Conflict);
        }
    }
    const updateData = {};
    if (validatedData.name)
        updateData.name = validatedData.name;
    if (validatedData.capacity !== undefined)
        updateData.capacity = validatedData.capacity;
    if (validatedData.roomNumber !== undefined)
        updateData.roomNumber = validatedData.roomNumber;
    if (validatedData.isActive !== undefined)
        updateData.isActive = validatedData.isActive;
    const updatedSection = await prisma_1.prisma.section.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Section updated successfully", updatedSection);
});
/**
 * @route   DELETE /api/school/section/:id
 * @desc    Delete section
 * @access  Admin
 */
exports.deleteSection = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const section = await prisma_1.prisma.section.findUnique({
        where: { id: id },
        include: {
            _count: {
                select: {
                    enrollments: true,
                    teacherAssignments: true
                }
            }
        }
    });
    if (!section) {
        throw new response_util_1.ErrorResponse("Section not found", types_1.statusCode.Not_Found);
    }
    // Check if section has enrollments or assignments
    const hasData = section._count.enrollments > 0 ||
        section._count.teacherAssignments > 0;
    if (hasData) {
        throw new response_util_1.ErrorResponse("Cannot delete section with existing enrollments or teacher assignments", types_1.statusCode.Bad_Request);
    }
    await prisma_1.prisma.section.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Section deleted successfully", null);
});
//# sourceMappingURL=section.controller.js.map