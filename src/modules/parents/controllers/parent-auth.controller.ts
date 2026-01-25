import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { parentLoginSchema, parentUpdateFcmTokenSchema } from "../validation/parent-auth.validation";
import { verifyPassword } from "../../../utils/password.util";
import { generateToken } from "../../../utils/jwt.util";

/**
 * @route   POST /api/auth/parent/login
 * @desc    Login parent and return JWT token
 * @access  Public
 */
export const parentLogin = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = parentLoginSchema.parse(req.body);

  const parent = await prisma.parent.findUnique({
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
    throw new ErrorResponse("Invalid email or password", statusCode.Unauthorized);
  }

  if (!parent.password) {
    throw new ErrorResponse("Password not set. Please contact administrator.", statusCode.Bad_Request);
  }

  if (!parent.isActive) {
    throw new ErrorResponse("Parent account is inactive", statusCode.Forbidden);
  }

  const isPasswordValid = await verifyPassword(validatedData.password, parent.password);
  if (!isPasswordValid) {
    throw new ErrorResponse("Invalid email or password", statusCode.Unauthorized);
  }

  const token = generateToken({ 
    userId: parent.id, 
    userType: "parent",
    email: parent.email,
    schoolId: parent.schoolId
  });

  const { password: _, ...parentData } = parent;

  return SuccessResponse(res, "Login successful", { 
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
export const parentLogout = asyncHandler(async (_req: Request, res: Response) => {
  // With JWT, logout is handled client-side by removing the token
  return SuccessResponse(res, "Logged out successfully", null);
});

/**
 * @route   GET /api/auth/parent/profile
 * @desc    Get authenticated parent profile
 * @access  Private
 */
export const getParentProfile = asyncHandler(async (req: Request, res: Response) => {
  const parentId = (req as any).parent?.userId;

  if (!parentId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  const parent = await prisma.parent.findUnique({
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
            }
          }
        }
      }
    }
  });

  if (!parent) {
    throw new ErrorResponse("Parent not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Profile retrieved successfully", parent);
});

/**
 * @route   PUT /api/auth/parent/fcm-token
 * @desc    Update FCM token for push notifications
 * @access  Private
 */
export const updateParentFcmToken = asyncHandler(async (req: Request, res: Response) => {
  const parentId = (req as any).parent?.userId;
  const validatedData = parentUpdateFcmTokenSchema.parse(req.body);

  if (!parentId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  await prisma.parent.update({
    where: { id: parentId },
    data: { fcmToken: validatedData.fcmToken }
  });

  return SuccessResponse(res, "FCM token updated successfully", null);
});
