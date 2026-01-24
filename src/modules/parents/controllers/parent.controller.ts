import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { uploadToCloudinary, deleteFromCloudinary, extractPublicId } from "../../../config/cloudinary";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createParentSchema,
  updateParentSchema,
} from "../validation/parent.validation";

/**
 * @route   POST /api/parents
 * @desc    Onboard/Create a new parent
 * @access  Admin/School
 */
export const createParent = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createParentSchema.parse(req.body);

  // Check school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Check duplicate email (Parents might share email globally?)
  // Schema says email @unique. So duplicate check is needed.
  const existingParent = await prisma.parent.findUnique({ where: { email: validatedData.email } });
  if (existingParent) {
    throw new ErrorResponse("Parent with this email already exists", statusCode.Conflict);
  }

  // Handle profile picture
  let profilePictureUrl: string | null = null;
  if (req.file) {
    try {
      const uploadResult = await uploadToCloudinary(req.file.buffer, "schools/parents");
      profilePictureUrl = uploadResult.secure_url;
    } catch (error) {
      throw new ErrorResponse("Failed to upload profile picture", statusCode.Internal_Server_Error);
    }
  }

  const parent = await prisma.parent.create({
    data: {
      ...validatedData,
      profilePicture: profilePictureUrl,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(res, "Parent created successfully", parent, statusCode.Created);
});

/**
 * @route   GET /api/parents/school/:schoolId
 * @desc    Get all parents for a school
 * @access  Admin/School
 */
export const getParentsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { search } = req.query;

  const where: any = { schoolId };
  if (search) {
    where.OR = [
      { firstName: { contains: search as string } },
      { lastName: { contains: search as string } },
      { email: { contains: search as string } },
      { phone: { contains: search as string } }
    ];
  }

  const parents = await prisma.parent.findMany({
    where,
    orderBy: { firstName: 'asc' },
    include: {
      _count: {
        select: { students: true }
      }
    }
  });

  return SuccessResponse(res, "Parents retrieved successfully", parents);
});

/**
 * @route   GET /api/parents/:id
 * @desc    Get parent by ID
 * @access  Admin/School
 */
export const getParentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const parent = await prisma.parent.findUnique({
    where: { id: id as string },
    include: {
      students: {
        include: {
          student: true
        }
      }
    }
  });

  if (!parent) throw new ErrorResponse("Parent not found", statusCode.Not_Found);

  return SuccessResponse(res, "Parent retrieved successfully", parent);
});

/**
 * @route   PUT /api/parents/:id
 * @desc    Update parent details
 * @access  Admin/School
 */
export const updateParent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateParentSchema.parse(req.body);

  const existingParent = await prisma.parent.findUnique({ where: { id: id as string } });
  if (!existingParent) throw new ErrorResponse("Parent not found", statusCode.Not_Found);

  // Handle profile picture
  let profilePictureUrl = existingParent.profilePicture;
  if (req.file) {
    try {
      // Delete old if exists
      if (existingParent.profilePicture) {
        const publicId = extractPublicId(existingParent.profilePicture);
        if (publicId) await deleteFromCloudinary(publicId);
      }
      const uploadResult = await uploadToCloudinary(req.file.buffer, "schools/parents");
      profilePictureUrl = uploadResult.secure_url;
    } catch (error) {
      throw new ErrorResponse("Failed to upload profile picture", statusCode.Internal_Server_Error);
    }
  }

  const parent = await prisma.parent.update({
    where: { id: id as string },
    data: {
      ...validatedData,
      profilePicture: profilePictureUrl
    }
  });

  return SuccessResponse(res, "Parent updated successfully", parent);
});

/**
 * @route   DELETE /api/parents/:id
 * @desc    Delete parent
 * @access  Admin
 */
export const deleteParent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const parent = await prisma.parent.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: { students: true }
      }
    }
  });

  if (!parent) throw new ErrorResponse("Parent not found", statusCode.Not_Found);

  // Check associations
  const studentCount = (parent as any)._count?.students ?? 0;
  if (studentCount > 0) {
    throw new ErrorResponse("Cannot delete parent associated with students", statusCode.Bad_Request);
  }

  // Delete profile picture
  if (parent.profilePicture) {
    const publicId = extractPublicId(parent.profilePicture);
    if (publicId) await deleteFromCloudinary(publicId);
  }

  await prisma.parent.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Parent deleted successfully", null);
});
