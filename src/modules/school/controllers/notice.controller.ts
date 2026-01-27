import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../config/cloudinary";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createNoticeSchema,
  updateNoticeSchema,
} from "../validation/notice.validation";

/**
 * @route   POST /api/school/notice
 * @desc    Create a new notice
 * @access  Admin/School
 */
export const createNotice = asyncHandler(async (req: Request, res: Response) => {
  // Validate request body
  const validatedData = createNoticeSchema.parse(req.body);

  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id: validatedData.schoolId }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Handle attachment upload if provided
  let attachmentData: object | null = null;
  if (req.file) {
    try {
      attachmentData = await uploadToCloudinary(req.file.buffer, "schools/notices");
    } catch (uploadError) {
      throw new ErrorResponse(
        "Failed to upload attachment",
        statusCode.Internal_Server_Error
      );
    }
  }

  // Create notice
  const notice = await prisma.notice.create({
    data: {
      schoolId: validatedData.schoolId,
      title: validatedData.title,
      content: validatedData.content,
      type: validatedData.type,
      priority: validatedData.priority,
      forStudents: validatedData.forStudents,
      forParents: validatedData.forParents,
      forTeachers: validatedData.forTeachers,
      targetClassIds: validatedData.targetClassIds ? validatedData.targetClassIds as any : undefined,
      attachment: attachmentData || undefined,
      postedBy: validatedData.postedBy, // Ideally from req.user
    }
  });

  return SuccessResponse(
    res,
    "Notice created successfully",
    notice,
    statusCode.Created
  );
});

/**
 * @route   GET /api/school/notice/school/:schoolId
 * @desc    Get all notices for a school with filters
 * @access  Admin/School/Teacher/Student/Parent
 */
export const getNoticesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { 
    page = 1,
    limit = 10,
    type, 
    priority, 
    forStudents, 
    forParents, 
    forTeachers,
    search 
  } = req.query;

  const where: any = { schoolId };

  // Filters
  if (type) where.type = type;
  if (priority) where.priority = priority;
  if (forStudents === 'true') where.forStudents = true;
  if (forParents === 'true') where.forParents = true;
  if (forTeachers === 'true') where.forTeachers = true;
  
  if (search) {
    where.title = { contains: search as string };
  }

  // Default sort by createdAt desc
  const notices = await prisma.notice.findMany({
    where,
    orderBy: { createdAt: "desc" }
  });

  const totalNotice = await prisma.notice.count({where})

  return SuccessResponse(res, "Notices retrieved successfully", {
    notices,
    pagination: {
      total: totalNotice,
      currentPage: Number(page),
      totalPages: Math.ceil(totalNotice / Number(limit)),
      limit: Number(limit),
      count: notices.length,
    }
  });
});

/**
 * @route   PUT /api/school/notice/:id
 * @desc    Update a notice
 * @access  Admin/School
 */
export const updateNotice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateNoticeSchema.parse(req.body);

  const existingNotice = await prisma.notice.findUnique({
    where: { id: id as string }
  });

  if (!existingNotice) {
    throw new ErrorResponse("Notice not found", statusCode.Not_Found);
  }

  // Handle attachment update
  let attachmentData: object | null = null;
  if (req.file) {
    try {
      // Delete old attachment if exists
      if (existingNotice.attachment && typeof existingNotice.attachment === 'object' && 'public_id' in existingNotice.attachment) {
        await deleteFromCloudinary((existingNotice.attachment as any).public_id);
      }
      attachmentData = await uploadToCloudinary(req.file.buffer, "schools/notices");
    } catch (uploadError) {
      throw new ErrorResponse("Failed to update attachment", statusCode.Internal_Server_Error);
    }
  }

  const updateData: any = { ...validatedData };
  if (attachmentData) updateData.attachment = attachmentData;
  // If targetClassIds coming from form-data is handled by Zod, we assign it directly
  if (validatedData.targetClassIds) updateData.targetClassIds = validatedData.targetClassIds as any;

  const updatedNotice = await prisma.notice.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Notice updated successfully", updatedNotice);
});

/**
 * @route   DELETE /api/school/notice/:id
 * @desc    Delete a notice
 * @access  Admin/School
 */
export const deleteNotice = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const notice = await prisma.notice.findUnique({
    where: { id: id as string }
  });

  if (!notice) {
    throw new ErrorResponse("Notice not found", statusCode.Not_Found);
  }

  // Delete attachment from Cloudinary
  if (notice.attachment && typeof notice.attachment === 'object' && 'public_id' in notice.attachment) {
    try {
      await deleteFromCloudinary((notice.attachment as any).public_id);
    } catch (error) {
      console.error("Failed to delete attachment from Cloudinary", error);
      // Continue with DB deletion even if Cloudinary fails
    }
  }

  await prisma.notice.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Notice deleted successfully", null);
});
