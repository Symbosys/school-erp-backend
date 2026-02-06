"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteParent = exports.updateParent = exports.getParentById = exports.getParentsBySchool = exports.createParent = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const cloudinary_1 = require("../../../config/cloudinary");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const parent_validation_1 = require("../validation/parent.validation");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * @route   POST /api/parents
 * @desc    Onboard/Create a new parent
 * @access  Admin/School
 */
exports.createParent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = parent_validation_1.createParentSchema.parse(req.body);
    // Check school exists
    const school = await prisma_1.prisma.school.findUnique({ where: { id: validatedData.schoolId } });
    if (!school)
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    // Check duplicate email (Parents might share email globally?)
    // Schema says email @unique. So duplicate check is needed.
    const existingParent = await prisma_1.prisma.parent.findUnique({ where: { email: validatedData.email } });
    if (existingParent) {
        throw new response_util_1.ErrorResponse("Parent with this email already exists", types_1.statusCode.Conflict);
    }
    // Handle profile picture
    let profilePictureUrl = null;
    if (req.file) {
        try {
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/parents");
            profilePictureUrl = uploadResult.secure_url;
        }
        catch (error) {
            throw new response_util_1.ErrorResponse("Failed to upload profile picture", types_1.statusCode.Internal_Server_Error);
        }
    }
    const parent = await prisma_1.prisma.parent.create({
        data: {
            ...validatedData,
            profilePicture: profilePictureUrl,
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Parent created successfully", parent, types_1.statusCode.Created);
});
/**
 * @route   GET /api/parents/school/:schoolId
 * @desc    Get all parents for a school
 * @access  Admin/School
 */
exports.getParentsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { page = 1, limit = 10, search } = req.query;
    const where = { schoolId };
    const skip = (Number(page) - 1) * Number(limit);
    if (search) {
        where.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { phone: { contains: search } }
        ];
    }
    const [parents, totalParents] = await Promise.all([
        prisma_1.prisma.parent.findMany({
            where,
            orderBy: { firstName: 'asc' },
            skip,
            take: Number(limit),
            include: {
                _count: {
                    select: { students: true }
                }
            }
        }),
        prisma_1.prisma.parent.count({ where })
    ]);
    return (0, response_util_1.SuccessResponse)(res, "Parents retrieved successfully", {
        parents,
        pagination: {
            total: totalParents,
            currentPage: Number(page),
            totalPages: Math.ceil(totalParents / Number(limit)),
            limit: Number(limit),
            count: parents.length
        }
    });
});
/**
 * @route   GET /api/parents/:id
 * @desc    Get parent by ID
 * @access  Admin/School
 */
exports.getParentById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const parent = await prisma_1.prisma.parent.findUnique({
        where: { id: id },
        include: {
            students: {
                include: {
                    student: true
                }
            }
        }
    });
    if (!parent)
        throw new response_util_1.ErrorResponse("Parent not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Parent retrieved successfully", parent);
});
/**
 * @route   PUT /api/parents/:id
 * @desc    Update parent details
 * @access  Admin/School
 */
exports.updateParent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = parent_validation_1.updateParentSchema.parse(req.body);
    const existingParent = await prisma_1.prisma.parent.findUnique({ where: { id: id } });
    if (!existingParent)
        throw new response_util_1.ErrorResponse("Parent not found", types_1.statusCode.Not_Found);
    // Handle profile picture
    let profilePictureUrl = existingParent.profilePicture;
    if (req.file) {
        try {
            // Delete old if exists
            if (existingParent.profilePicture) {
                const publicId = (0, cloudinary_1.extractPublicId)(existingParent.profilePicture);
                if (publicId)
                    await (0, cloudinary_1.deleteFromCloudinary)(publicId);
            }
            const uploadResult = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/parents");
            profilePictureUrl = uploadResult.secure_url;
        }
        catch (error) {
            throw new response_util_1.ErrorResponse("Failed to upload profile picture", types_1.statusCode.Internal_Server_Error);
        }
    }
    let password = existingParent.password;
    if (validatedData.password) {
        // hash password
        password = await bcryptjs_1.default.hash(validatedData.password, 10);
    }
    const parent = await prisma_1.prisma.parent.update({
        where: { id: id },
        data: {
            ...validatedData,
            profilePicture: profilePictureUrl,
            password
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Parent updated successfully", parent);
});
/**
 * @route   DELETE /api/parents/:id
 * @desc    Delete parent
 * @access  Admin
 */
exports.deleteParent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const parent = await prisma_1.prisma.parent.findUnique({
        where: { id: id },
        include: {
            _count: {
                select: { students: true }
            }
        }
    });
    if (!parent)
        throw new response_util_1.ErrorResponse("Parent not found", types_1.statusCode.Not_Found);
    // Check associations
    const studentCount = parent._count?.students ?? 0;
    if (studentCount > 0) {
        throw new response_util_1.ErrorResponse("Cannot delete parent associated with students", types_1.statusCode.Bad_Request);
    }
    // Delete profile picture
    if (parent.profilePicture) {
        const publicId = (0, cloudinary_1.extractPublicId)(parent.profilePicture);
        if (publicId)
            await (0, cloudinary_1.deleteFromCloudinary)(publicId);
    }
    await prisma_1.prisma.parent.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Parent deleted successfully", null);
});
//# sourceMappingURL=parent.controller.js.map