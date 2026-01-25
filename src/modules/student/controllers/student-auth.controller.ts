import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { studentLoginSchema, studentUpdateFcmTokenSchema } from "../validation/student-auth.validation";
import { verifyPassword } from "../../../utils/password.util";
import { generateToken } from "../../../utils/jwt.util";

/**
 * @route   POST /api/auth/student/login
 * @desc    Login student and return JWT token
 * @access  Public
 */
export const studentLogin = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = studentLoginSchema.parse(req.body);

  const student = await prisma.student.findFirst({
    where: { 
      email: validatedData.email,
      isActive: true
    },
    select: {
      id: true,
      schoolId: true,
      admissionNumber: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      profilePicture: true,
      password: true,
      status: true,
    }
  });

  if (!student) {
    throw new ErrorResponse("Invalid email or password", statusCode.Unauthorized);
  }

  if (!student.password) {
    throw new ErrorResponse("Password not set. Please contact administrator.", statusCode.Bad_Request);
  }

  if (student.status !== "ACTIVE") {
    throw new ErrorResponse("Student account is not active", statusCode.Forbidden);
  }

  const isPasswordValid = await verifyPassword(validatedData.password, student.password);
  if (!isPasswordValid) {
    throw new ErrorResponse("Invalid email or password", statusCode.Unauthorized);
  }

  const token = generateToken({ 
    userId: student.id, 
    userType: "student",
    email: student.email || "",
    schoolId: student.schoolId
  });

  const { password: _, ...studentData } = student;

  return SuccessResponse(res, "Login successful", { 
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
export const studentLogout = asyncHandler(async (_req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  // Optionally, you can clear FCM token here if needed
  return SuccessResponse(res, "Logged out successfully", null);
});

/**
 * @route   GET /api/auth/student/profile
 * @desc    Get authenticated student profile
 * @access  Private
 */
export const getStudentProfile = asyncHandler(async (req: Request, res: Response) => {
  const studentId = (req as any).student?.userId;

  if (!studentId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  const student = await prisma.student.findUnique({
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
    throw new ErrorResponse("Student not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Profile retrieved successfully", student);
});

/**
 * @route   PUT /api/auth/student/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
export const updateStudentFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const studentId = (req as any).student?.userId;
  const validatedData = studentUpdateFcmTokenSchema.parse(req.body);

  if (!studentId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  await prisma.student.update({
    where: { id: studentId },
    data: { fcmToken: validatedData.fcmToken }
  });

  return SuccessResponse(res, "FCM token updated successfully", null);
});
