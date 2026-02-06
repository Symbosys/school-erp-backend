"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacherFcmToken = exports.getTeacherProfile = exports.teacherLogout = exports.teacherLogin = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const teacher_auth_validation_1 = require("../validation/teacher-auth.validation");
const password_util_1 = require("../../../utils/password.util");
const jwt_util_1 = require("../../../utils/jwt.util");
/**
 * @route   POST /api/auth/teacher/login
 * @desc    Login teacher, mark attendance check-in, and return JWT token
 * @access  Public
 */
exports.teacherLogin = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = teacher_auth_validation_1.teacherLoginSchema.parse(req.body);
    const teacher = await prisma_1.prisma.teacher.findFirst({
        where: {
            OR: [
                { email: validatedData.email },
                { employeeId: validatedData.email }
            ]
        },
        select: {
            id: true,
            schoolId: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            profilePicture: true,
            password: true,
            status: true,
            isActive: true,
            monthlySalary: true,
        }
    });
    if (!teacher) {
        throw new response_util_1.ErrorResponse("Invalid email or password", types_1.statusCode.Unauthorized);
    }
    if (!teacher.password) {
        throw new response_util_1.ErrorResponse("Password not set. Please contact administrator.", types_1.statusCode.Bad_Request);
    }
    if (!teacher.isActive) {
        throw new response_util_1.ErrorResponse("Teacher account is inactive", types_1.statusCode.Forbidden);
    }
    if (teacher.status !== "ACTIVE") {
        throw new response_util_1.ErrorResponse("Teacher account is not active", types_1.statusCode.Forbidden);
    }
    const isPasswordValid = await (0, password_util_1.verifyPassword)(validatedData.password, teacher.password);
    if (!isPasswordValid) {
        throw new response_util_1.ErrorResponse("Invalid email or password", types_1.statusCode.Unauthorized);
    }
    // Mark attendance - check if already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const existingAttendance = await prisma_1.prisma.staffAttendance.findUnique({
        where: {
            teacherId_date: {
                teacherId: teacher.id,
                date: today
            }
        }
    });
    let attendance;
    if (!existingAttendance) {
        // Create new attendance record with check-in
        attendance = await prisma_1.prisma.staffAttendance.create({
            data: {
                teacherId: teacher.id,
                schoolId: teacher.schoolId,
                date: today,
                status: "PRESENT",
                checkInTime: new Date(),
            }
        });
    }
    else {
        attendance = existingAttendance;
    }
    const token = (0, jwt_util_1.generateToken)({
        userId: teacher.id,
        userType: "teacher",
        email: teacher.email,
        schoolId: teacher.schoolId
    });
    const { password: _, ...teacherData } = teacher;
    return (0, response_util_1.SuccessResponse)(res, "Login successful", {
        teacher: teacherData,
        token,
        role: "teacher",
        attendance: {
            date: attendance.date,
            checkInTime: attendance.checkInTime,
            status: attendance.status
        }
    });
});
/**
 * @route   POST /api/auth/teacher/logout
 * @desc    Logout teacher and mark attendance check-out
 * @access  Private
 */
exports.teacherLogout = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const teacherId = req.teacher?.userId;
    if (!teacherId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    // Find today's attendance record and update checkout time
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await prisma_1.prisma.staffAttendance.findUnique({
        where: {
            teacherId_date: {
                teacherId: teacherId,
                date: today
            }
        }
    });
    if (attendance && !attendance.checkOutTime) {
        await prisma_1.prisma.staffAttendance.update({
            where: { id: attendance.id },
            data: { checkOutTime: new Date() }
        });
    }
    return (0, response_util_1.SuccessResponse)(res, "Logged out successfully", null);
});
/**
 * @route   GET /api/auth/teacher/profile
 * @desc    Get authenticated teacher profile
 * @access  Private
 */
exports.getTeacherProfile = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const teacherId = req.teacher?.userId;
    if (!teacherId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    const teacher = await prisma_1.prisma.teacher.findUnique({
        where: { id: teacherId },
        select: {
            id: true,
            schoolId: true,
            employeeId: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            qualification: true,
            specialization: true,
            experience: true,
            joiningDate: true,
            profilePicture: true,
            status: true,
            monthlySalary: true,
            createdAt: true,
        }
    });
    if (!teacher) {
        throw new response_util_1.ErrorResponse("Teacher not found", types_1.statusCode.Not_Found);
    }
    // Get today's attendance
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const attendance = await prisma_1.prisma.staffAttendance.findUnique({
        where: {
            teacherId_date: {
                teacherId: teacher.id,
                date: today
            }
        },
        select: {
            date: true,
            status: true,
            checkInTime: true,
            checkOutTime: true,
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Profile retrieved successfully", {
        ...teacher,
        todayAttendance: attendance || null
    });
});
/**
 * @route   PUT /api/auth/teacher/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
exports.updateTeacherFcmToken = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const teacherId = req.teacher?.userId;
    const validatedData = teacher_auth_validation_1.teacherUpdateFcmTokenSchema.parse(req.body);
    if (!teacherId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    await prisma_1.prisma.teacher.update({
        where: { id: teacherId },
        data: { fcmToken: validatedData.fcmToken }
    });
    return (0, response_util_1.SuccessResponse)(res, "FCM token updated successfully", null);
});
//# sourceMappingURL=teacher-auth.controller.js.map