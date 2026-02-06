"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.schoolLogout = exports.getSchoolProfile = exports.setPassword = exports.schoolLogin = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const auth_validation_1 = require("../validation/auth.validation");
const password_util_1 = require("../../../utils/password.util");
const jwt_util_1 = require("../../../utils/jwt.util");
const COOKIE_NAME = "school_token";
const COOKIE_MAX_AGE = 180 * 24 * 60 * 60 * 1000; // 6 months
/**
 * @route   POST /api/auth/school/login
 * @desc    Login school and set JWT cookie
 * @access  Public
 */
exports.schoolLogin = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = auth_validation_1.schoolLoginSchema.parse(req.body);
    const school = await prisma_1.prisma.school.findUnique({
        where: { email: validatedData.email },
        select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
            logoUrl: true,
            password: true,
            isActive: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
        }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("Invalid email or password", types_1.statusCode.Unauthorized);
    }
    if (!school.password) {
        throw new response_util_1.ErrorResponse("Password not set. Please complete registration.", types_1.statusCode.Bad_Request);
    }
    if (!school.isActive) {
        throw new response_util_1.ErrorResponse("School account is inactive", types_1.statusCode.Forbidden);
    }
    const isPasswordValid = await (0, password_util_1.verifyPassword)(validatedData.password, school.password);
    if (!isPasswordValid) {
        throw new response_util_1.ErrorResponse("Invalid email or password", types_1.statusCode.Unauthorized);
    }
    const token = (0, jwt_util_1.generateToken)({ id: school.id, email: school.email });
    const { password: _, ...schoolData } = school;
    res.cookie(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: COOKIE_MAX_AGE,
    });
    return (0, response_util_1.SuccessResponse)(res, "Login successful", { school: schoolData });
});
/**
 * @route   POST /api/auth/school/set-password
 * @desc    Set or update school password
 * @access  Private (requires school ID)
 */
exports.setPassword = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const validatedData = auth_validation_1.setPasswordSchema.parse(req.body);
    const school = await prisma_1.prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    const hashedPassword = await (0, password_util_1.hashPassword)(validatedData.password);
    await prisma_1.prisma.school.update({
        where: { id: schoolId },
        data: { password: hashedPassword }
    });
    return (0, response_util_1.SuccessResponse)(res, "Password set successfully", null);
});
/**
 * @route   GET /api/auth/school/profile
 * @desc    Get authenticated school profile
 * @access  Private
 */
exports.getSchoolProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const schoolId = req.school?.id;
    if (!schoolId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: schoolId },
        select: {
            id: true,
            name: true,
            code: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            country: true,
            pincode: true,
            logoUrl: true,
            website: true,
            isActive: true,
            subscriptionStatus: true,
            subscriptionPlan: true,
            subscriptionStart: true,
            subscriptionEnd: true,
            maxStudents: true,
            maxTeachers: true,
        }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Profile retrieved successfully", school);
});
/**
 * @route   POST /api/auth/school/logout
 * @desc    Logout and clear cookie
 * @access  Private
 */
exports.schoolLogout = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
    res.clearCookie(COOKIE_NAME, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    return (0, response_util_1.SuccessResponse)(res, "Logged out successfully", null);
});
//# sourceMappingURL=auth.controller.js.map