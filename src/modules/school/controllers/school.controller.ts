import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../config/cloudinary";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  onboardSchoolSchema,
  updateSchoolSchema,
  updateSubscriptionSchema,
  toggleStatusSchema,
} from "../validation/school.validation";
import bcrypt from "bcryptjs";

/**
 * @route   POST /api/school/onboard
 * @desc    Onboard a new school to the platform
 * @access  Admin
 */
export const onboardSchool = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body with Zod
  const validatedData = onboardSchoolSchema.parse(req.body);

  // Check if school code or email already exists
  const existingSchool = await prisma.school.findFirst({
    where: {
      OR: [
        { code: validatedData.code },
        { email: validatedData.email }
      ]
    }
  });

  if (existingSchool) {
    throw new ErrorResponse(
      existingSchool.code === validatedData.code
        ? "School with this code already exists"
        : "School with this email already exists",
      statusCode.Conflict
    );
  }

  // Handle logo upload if provided
  let logoData: { public_id: string; secure_url: string } | null = null;
  if (req.file) {
    try {
      logoData = await uploadToCloudinary(req.file.buffer, "schools/logos");
    } catch (uploadError) {
      throw new ErrorResponse(
        "Failed to upload school logo",
        statusCode.Internal_Server_Error
      );
    }
  }

  // Create school in database
  const school = await prisma.school.create({
    data: {
      name: validatedData.name,
      code: validatedData.code,
      email: validatedData.email,
      phone: validatedData.phone,
      address: validatedData.address,
      city: validatedData.city,
      state: validatedData.state,
      country: validatedData.country,
      pincode: validatedData.pincode,
      establishedDate: new Date(validatedData.establishedDate),
      website: validatedData.website || null,
      logoUrl: (logoData || {}) as any,
      subscriptionStatus: "ACTIVE",
      subscriptionPlan: validatedData.subscriptionPlan || "BASIC",
      subscriptionStart: validatedData.subscriptionStart
        ? new Date(validatedData.subscriptionStart)
        : new Date(),
      subscriptionEnd: validatedData.subscriptionEnd
        ? new Date(validatedData.subscriptionEnd)
        : null,
      maxStudents: validatedData.maxStudents || 100,
      maxTeachers: validatedData.maxTeachers || 10,
      isActive: true
    }
  });

  return SuccessResponse(
    res,
    "School onboarded successfully",
    {
      id: school.id,
      name: school.name,
      code: school.code,
      email: school.email,
      subscriptionStatus: school.subscriptionStatus,
      subscriptionPlan: school.subscriptionPlan,
      establishedDate: school.establishedDate,
      createdAt: school.createdAt
    },
    statusCode.Created
  );
});

/**
 * @route   GET /api/school/:id
 * @desc    Get school by ID
 * @access  Admin/School
 */
export const getSchoolById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const school = await prisma.school.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          academicYears: true,
          classes: true
        }
      }
    }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "School retrieved successfully", school);
});

/**
 * @route   GET /api/school
 * @desc    Get all schools with pagination and filters
 * @access  Admin
 */
export const getAllSchools = asyncHandler(async (req: Request, res: Response) => {
  const {
    page = "1",
    limit = "10",
    search,
    subscriptionStatus,
    subscriptionPlan,
    isActive
  } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where: any = {};

  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { code: { contains: search as string } },
      { email: { contains: search as string } },
      { city: { contains: search as string } }
    ];
  }

  if (subscriptionStatus) {
    where.subscriptionStatus = subscriptionStatus;
  }

  if (subscriptionPlan) {
    where.subscriptionPlan = subscriptionPlan;
  }

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  // Get total count
  const total = await prisma.school.count({ where });

  // Get schools
  const schools = await prisma.school.findMany({
    where,
    skip,
    take: limitNum,
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          students: true,
          teachers: true,
          academicYears: true
        }
      }
    }
  });

  return SuccessResponse(res, "Schools retrieved successfully", {
    schools,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * @route   PUT /api/school/:id
 * @desc    Update school details
 * @access  Admin/School
 */
export const updateSchool = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate request body with Zod
  const validatedData = updateSchoolSchema.parse(req.body);

  // Check if school exists
  const existingSchool = await prisma.school.findUnique({
    where: { id: id as string }
  });

  if (!existingSchool) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Handle logo upload/update if provided
  let logoData: { public_id: string; secure_url: string } | null = null;
  if (req.file) {
    try {
      // Delete old logo if exists
      if (existingSchool.logoUrl && typeof existingSchool.logoUrl === 'object' && 'public_id' in existingSchool.logoUrl) {
        await deleteFromCloudinary((existingSchool.logoUrl as any).public_id);
      }

      // Upload new logo
      logoData = await uploadToCloudinary(req.file.buffer, "schools/logos");
    } catch (uploadError) {
      throw new ErrorResponse(
        "Failed to upload school logo",
        statusCode.Internal_Server_Error
      );
    }
  }

  // Prepare update data
  const updateData: any = {};

  if (validatedData.name) updateData.name = validatedData.name;
  if (validatedData.email) updateData.email = validatedData.email;
  if (validatedData.phone) updateData.phone = validatedData.phone;
  if (validatedData.address) updateData.address = validatedData.address;
  if (validatedData.city) updateData.city = validatedData.city;
  if (validatedData.state) updateData.state = validatedData.state;
  if (validatedData.country) updateData.country = validatedData.country;
  if (validatedData.pincode) updateData.pincode = validatedData.pincode;
  if (validatedData.website !== undefined) updateData.website = validatedData.website || null;
  if (validatedData.subscriptionPlan) updateData.subscriptionPlan = validatedData.subscriptionPlan;
  if (validatedData.subscriptionStart) updateData.subscriptionStart = new Date(validatedData.subscriptionStart);
  if (validatedData.subscriptionEnd) updateData.subscriptionEnd = new Date(validatedData.subscriptionEnd);
  if (validatedData.maxStudents !== undefined) updateData.maxStudents = validatedData.maxStudents;
  if (validatedData.maxTeachers !== undefined) updateData.maxTeachers = validatedData.maxTeachers;
  if (logoData) updateData.logoUrl = logoData;

  if(validatedData.password){
    // hash password
    const hashedPassword = await bcrypt.hash(validatedData.password, 10);
    updateData.password = hashedPassword;
  }

  // Update school
  const updatedSchool = await prisma.school.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "School updated successfully", updatedSchool);
});

/**
 * @route   PATCH /api/school/:id/status
 * @desc    Activate/Deactivate school
 * @access  Admin
 */
export const toggleSchoolStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate request body with Zod
  const validatedData = toggleStatusSchema.parse(req.body);

  const school = await prisma.school.findUnique({
    where: { id: id as string }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  const updatedSchool = await prisma.school.update({
    where: { id: id as string },
    data: { isActive: validatedData.isActive }
  });

  return SuccessResponse(
    res,
    `School ${updatedSchool.isActive ? "activated" : "deactivated"} successfully`,
    updatedSchool
  );
});

/**
 * @route   PATCH /api/school/:id/subscription
 * @desc    Update school subscription
 * @access  Admin
 */
export const updateSubscription = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  // Validate request body with Zod
  const validatedData = updateSubscriptionSchema.parse(req.body);

  const school = await prisma.school.findUnique({
    where: { id: id as string }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  const updateData: any = {};
  if (validatedData.subscriptionStatus) updateData.subscriptionStatus = validatedData.subscriptionStatus;
  if (validatedData.subscriptionPlan) updateData.subscriptionPlan = validatedData.subscriptionPlan;
  if (validatedData.subscriptionStart) updateData.subscriptionStart = new Date(validatedData.subscriptionStart);
  if (validatedData.subscriptionEnd) updateData.subscriptionEnd = new Date(validatedData.subscriptionEnd);
  if (validatedData.maxStudents !== undefined) updateData.maxStudents = validatedData.maxStudents;
  if (validatedData.maxTeachers !== undefined) updateData.maxTeachers = validatedData.maxTeachers;

  const updatedSchool = await prisma.school.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Subscription updated successfully", updatedSchool);
});

/**
 * @route   DELETE /api/school/:id/logo
 * @desc    Delete school logo
 * @access  Admin/School
 */
export const deleteSchoolLogo = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const school = await prisma.school.findUnique({
    where: { id: id as string }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  if (!school.logoUrl) {
    throw new ErrorResponse("School has no logo to delete", statusCode.Bad_Request);
  }

  // Delete from Cloudinary
  if (typeof school.logoUrl === 'object' && 'public_id' in school.logoUrl) {
    await deleteFromCloudinary((school.logoUrl as any).public_id);
  }

  // Update database
  const updatedSchool = await prisma.school.update({
    where: { id: id as string },
    data: { logoUrl: {} as any }
  });

  return SuccessResponse(res, "School logo deleted successfully", updatedSchool);
});
