"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParentFcmToken = exports.getParentProfile = exports.parentLogout = exports.parentLogin = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const parent_auth_validation_1 = require("../validation/parent-auth.validation");
const password_util_1 = require("../../../utils/password.util");
const jwt_util_1 = require("../../../utils/jwt.util");
/**
 * @route   POST /api/auth/parent/login
 * @desc    Login parent and return JWT token
 * @access  Public
 */
exports.parentLogin = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = parent_auth_validation_1.parentLoginSchema.parse(req.body);
    const parent = await prisma_1.prisma.parent.findUnique({
        where: { email: validatedData.email },
        select: {
            id: true,
            schoolId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            occupation: true,
            profilePicture: true,
            password: true,
            isActive: true,
        }
    });
    if (!parent) {
        throw new response_util_1.ErrorResponse("Invalid email or password", types_1.statusCode.Unauthorized);
    }
    if (!parent.password) {
        throw new response_util_1.ErrorResponse("Password not set. Please contact administrator.", types_1.statusCode.Bad_Request);
    }
    if (!parent.isActive) {
        throw new response_util_1.ErrorResponse("Parent account is inactive", types_1.statusCode.Forbidden);
    }
    const isPasswordValid = await (0, password_util_1.verifyPassword)(validatedData.password, parent.password);
    if (!isPasswordValid) {
        throw new response_util_1.ErrorResponse("Invalid email or password", types_1.statusCode.Unauthorized);
    }
    const token = (0, jwt_util_1.generateToken)({
        userId: parent.id,
        userType: "parent",
        email: parent.email,
        schoolId: parent.schoolId
    });
    const { password: _, ...parentData } = parent;
    return (0, response_util_1.SuccessResponse)(res, "Login successful", {
        parent: parentData,
        token,
        role: "parent"
    });
});
/**
 * @route   POST /api/auth/parent/logout
 * @desc    Logout parent (client-side token removal)
 * @access  Private
 */
exports.parentLogout = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
    // With JWT, logout is handled client-side by removing the token
    return (0, response_util_1.SuccessResponse)(res, "Logged out successfully", null);
});
/**
 * @route   GET /api/auth/parent/profile
 * @desc    Get authenticated parent profile
 * @access  Private
 */
exports.getParentProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const parentId = req.parent?.userId;
    if (!parentId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    const parent = await prisma_1.prisma.parent.findUnique({
        where: { id: parentId },
        select: {
            id: true,
            schoolId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            occupation: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            profilePicture: true,
            createdAt: true,
            students: {
                select: {
                    relationship: true,
                    isPrimary: true,
                    student: {
                        select: {
                            id: true,
                            admissionNumber: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            profilePicture: true,
                            status: true,
                            enrollments: {
                                where: {
                                    isPromoted: false, // Assuming active enrollment
                                },
                                take: 1,
                                include: {
                                    academicYear: true,
                                    section: {
                                        include: {
                                            class: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    });
    if (!parent) {
        throw new response_util_1.ErrorResponse("Parent not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Profile retrieved successfully", parent);
});
/**
 * @route   PUT /api/auth/parent/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
exports.updateParentFcmToken = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const parentId = req.parent?.userId;
    const validatedData = parent_auth_validation_1.parentUpdateFcmTokenSchema.parse(req.body);
    if (!parentId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    await prisma_1.prisma.parent.update({
        where: { id: parentId },
        data: { fcmToken: validatedData.fcmToken }
    });
    return (0, response_util_1.SuccessResponse)(res, "FCM token updated successfully", null);
});
//# sourceMappingURL=parent-auth.controller.js.map