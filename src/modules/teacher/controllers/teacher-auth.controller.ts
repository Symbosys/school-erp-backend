import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { teacherLoginSchema, teacherUpdateFcmTokenSchema } from "../validation/teacher-auth.validation";
import { verifyPassword } from "../../../utils/password.util";
import { generateToken } from "../../../utils/jwt.util";

/**
 * @route   POST /api/auth/teacher/login
 * @desc    Login teacher, mark attendance check-in, and return JWT token
 * @access  Public
 */
export const teacherLogin = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = teacherLoginSchema.parse(req.body);

  const teacher = await prisma.teacher.findFirst({
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
    }
  });

  if (!teacher) {
    throw new ErrorResponse("Invalid email or password", statusCode.Unauthorized);
  }

  if (!teacher.password) {
    throw new ErrorResponse("Password not set. Please contact administrator.", statusCode.Bad_Request);
  }

  if (!teacher.isActive) {
    throw new ErrorResponse("Teacher account is inactive", statusCode.Forbidden);
  }

  if (teacher.status !== "ACTIVE") {
    throw new ErrorResponse("Teacher account is not active", statusCode.Forbidden);
  }

  const isPasswordValid = await verifyPassword(validatedData.password, teacher.password);
  if (!isPasswordValid) {
    throw new ErrorResponse("Invalid email or password", statusCode.Unauthorized);
  }

  // Mark attendance - check if already checked in today
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const existingAttendance = await prisma.staffAttendance.findUnique({
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
    attendance = await prisma.staffAttendance.create({
      data: {
        teacherId: teacher.id,
        schoolId: teacher.schoolId,
        date: today,
        status: "PRESENT",
        checkInTime: new Date(),
      }
    });
  } else {
    attendance = existingAttendance;
  }

  const token = generateToken({
    userId: teacher.id,
    userType: "teacher",
    email: teacher.email,
    schoolId: teacher.schoolId
  });

  const { password: _, ...teacherData } = teacher;

  return SuccessResponse(res, "Login successful", {
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
export const teacherLogout = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = (req as any).teacher?.userId;

  if (!teacherId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  // Find today's attendance record and update checkout time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const attendance = await prisma.staffAttendance.findUnique({
    where: {
      teacherId_date: {
        teacherId: teacherId,
        date: today
      }
    }
  });

  if (attendance && !attendance.checkOutTime) {
    await prisma.staffAttendance.update({
      where: { id: attendance.id },
      data: { checkOutTime: new Date() }
    });
  }

  return SuccessResponse(res, "Logged out successfully", null);
});

/**
 * @route   GET /api/auth/teacher/profile
 * @desc    Get authenticated teacher profile
 * @access  Private
 */
export const getTeacherProfile = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = (req as any).teacher?.userId;

  if (!teacherId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  const teacher = await prisma.teacher.findUnique({
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
      createdAt: true,
    }
  });

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Profile retrieved successfully", teacher);
});

/**
 * @route   PUT /api/auth/teacher/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
export const updateTeacherFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const teacherId = (req as any).teacher?.userId;
  const validatedData = teacherUpdateFcmTokenSchema.parse(req.body);

  if (!teacherId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  await prisma.teacher.update({
    where: { id: teacherId },
    data: { fcmToken: validatedData.fcmToken }
  });

  return SuccessResponse(res, "FCM token updated successfully", null);
});