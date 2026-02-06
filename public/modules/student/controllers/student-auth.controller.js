"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentFcmToken = exports.getStudentProfile = exports.studentLogout = exports.studentLogin = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const student_auth_validation_1 = require("../validation/student-auth.validation");
const password_util_1 = require("../../../utils/password.util");
const jwt_util_1 = require("../../../utils/jwt.util");
/**
 * @route   POST /api/auth/student/login
 * @desc    Login student and return JWT token
 * @access  Public
 */
exports.studentLogin = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    console.log(req.body);
    const validatedData = student_auth_validation_1.studentLoginSchema.parse(req.body);
    const student = await prisma_1.prisma.student.findFirst({
        where: {
            email: validatedData.email,
            isActive: true,
        },
        include: {
            enrollments: {
                include: {
                    academicYear: true,
                    section: {
                        include: {
                            class: true,
                        }
                    },
                }
            }
        }
    });
    if (!student) {
        throw new response_util_1.ErrorResponse("Invalid email or password", types_1.statusCode.Unauthorized);
    }
    if (!student.password) {
        throw new response_util_1.ErrorResponse("Password not set. Please contact administrator.", types_1.statusCode.Bad_Request);
    }
    if (student.status !== "ACTIVE") {
        throw new response_util_1.ErrorResponse("Student account is not active", types_1.statusCode.Forbidden);
    }
    const isPasswordValid = await (0, password_util_1.verifyPassword)(validatedData.password, student.password);
    if (!isPasswordValid) {
        throw new response_util_1.ErrorResponse("Invalid email or password", types_1.statusCode.Unauthorized);
    }
    const token = (0, jwt_util_1.generateToken)({
        userId: student.id,
        userType: "student",
        email: student.email || "",
        schoolId: student.schoolId
    });
    const { password: _, ...studentData } = student;
    return (0, response_util_1.SuccessResponse)(res, "Login successful", {
        student: studentData,
        token,
        role: "student"
    });
});
/**
 * @route   POST /api/auth/student/logout
 * @desc    Logout student (client-side token removal)
 * @access  Private
 */
exports.studentLogout = (0, error_middleware_1.asyncHandler)(async (_req, res) => {
    // With JWT, logout is handled client-side by removing the token
    // Optionally, you can clear FCM token here if needed
    return (0, response_util_1.SuccessResponse)(res, "Logged out successfully", null);
});
/**
 * @route   GET /api/auth/student/profile
 * @desc    Get authenticated student profile
 * @access  Private
 */
exports.getStudentProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const studentId = req.student?.userId;
    if (!studentId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    const student = await prisma_1.prisma.student.findUnique({
        where: { id: studentId },
        select: {
            id: true,
            schoolId: true,
            admissionNumber: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            profilePicture: true,
            medicalInfo: true,
            status: true,
            createdAt: true,
        }
    });
    if (!student) {
        throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Profile retrieved successfully", student);
});
/**
 * @route   PUT /api/auth/student/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
exports.updateStudentFcmToken = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const studentId = req.student?.userId;
    const validatedData = student_auth_validation_1.studentUpdateFcmTokenSchema.parse(req.body);
    if (!studentId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    await prisma_1.prisma.student.update({
        where: { id: studentId },
        data: { fcmToken: validatedData.fcmToken }
    });
    return (0, response_util_1.SuccessResponse)(res, "FCM token updated successfully", null);
});
//# sourceMappingURL=student-auth.controller.js.map