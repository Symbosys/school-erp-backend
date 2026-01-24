import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { schoolLoginSchema, setPasswordSchema } from "../validation/auth.validation";
import { hashPassword, verifyPassword } from "../../../utils/password.util";
import { generateToken } from "../../../utils/jwt.util";

const COOKIE_NAME = "school_token";
const COOKIE_MAX_AGE = 180 * 24 * 60 * 60 * 1000; // 6 months

/**
 * @route   POST /api/auth/school/login
 * @desc    Login school and set JWT cookie
 * @access  Public
 */
export const schoolLogin = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = schoolLoginSchema.parse(req.body);

  const school = await prisma.school.findUnique({
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
    throw new ErrorResponse("Invalid email or password", statusCode.Unauthorized);
  }

  if (!school.password) {
    throw new ErrorResponse("Password not set. Please complete registration.", statusCode.Bad_Request);
  }

  if (!school.isActive) {
    throw new ErrorResponse("School account is inactive", statusCode.Forbidden);
  }

  const isPasswordValid = await verifyPassword(validatedData.password, school.password);
  if (!isPasswordValid) {
    throw new ErrorResponse("Invalid email or password", statusCode.Unauthorized);
  }

  const token = generateToken({ schoolId: school.id, email: school.email });

  const { password: _, ...schoolData } = school;

  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
  });

  return SuccessResponse(res, "Login successful", { school: schoolData });
});

/**
 * @route   POST /api/auth/school/set-password
 * @desc    Set or update school password
 * @access  Private (requires school ID)
 */
export const setPassword = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const validatedData = setPasswordSchema.parse(req.body);

  const school = await prisma.school.findUnique({ where: { id: schoolId as string } });
  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  const hashedPassword = await hashPassword(validatedData.password);

  await prisma.school.update({
    where: { id: schoolId as string },
    data: { password: hashedPassword }
  });

  return SuccessResponse(res, "Password set successfully", null);
});

/**
 * @route   GET /api/auth/school/profile
 * @desc    Get authenticated school profile
 * @access  Private
 */
export const getSchoolProfile = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = (req as any).school?.schoolId;

  if (!schoolId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  const school = await prisma.school.findUnique({
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
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Profile retrieved successfully", school);
});

/**
 * @route   POST /api/auth/school/logout
 * @desc    Logout and clear cookie
 * @access  Private
 */
export const schoolLogout = asyncHandler(async (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });

  return SuccessResponse(res, "Logged out successfully", null);
});
