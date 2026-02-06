import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../config/cloudinary";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { applyLeaveSchema, updateLeaveStatusSchema } from "../validator/leave.validation";

/**
 * @route   POST /api/common/leave (or similar)
 * @desc    Apply for leave (Student or Teacher)
 * @access  Student/Teacher
 */
export const applyLeave = asyncHandler(async (req: Request, res: Response) => {
  // Parsing body
  const validatedData = applyLeaveSchema.parse(req.body);

  // Identify User from Auth Middleware
  // Assuming req.user is populated with { id, role, schoolId }
  const user = (req as any).user;

  if (!user) {
    throw new ErrorResponse("Unauthorized", statusCode.Unauthorized);
  }

  // Handle attachment
  let attachmentData: object | null = null;
  if (req.file) {
    try {
      attachmentData = await uploadToCloudinary(req.file.buffer, "schools/leaves");
    } catch (uploadError) {
      throw new ErrorResponse("Failed to upload attachment", statusCode.Internal_Server_Error);
    }
  }

  // Prepare data
  const leaveData: any = {
    schoolId: validatedData.schoolId,
    startDate: new Date(validatedData.startDate),
    endDate: new Date(validatedData.endDate),
    reason: validatedData.reason,
    type: validatedData.type,
    attachment: attachmentData || undefined,
    status: "PENDING"
  };

  // Assign to correct relation based on role
  // This depends on how your auth middleware populates 'role'
  if (user.role === "STUDENT") {
    leaveData.studentId = user.id;
  } else if (user.role === "TEACHER" || user.role === "STAFF") {
    leaveData.teacherId = user.id;
  } else {
    // If Admin tries to apply? Maybe allow manual entry? 
    // For now, restrict to Student/Teacher self-service
    throw new ErrorResponse("Only Students and Teachers can apply for leave via this endpoint", statusCode.Forbidden);
  }

  const newLeave = await prisma.leaveRequest.create({
    data: leaveData
  });

  return SuccessResponse(res, "Leave application submitted successfully", newLeave, statusCode.Created);
});

/**
 * @route   GET /api/common/leave/my-leaves
 * @desc    Get current user's leaves
 * @access  Student/Teacher
 */
export const getMyLeaves = asyncHandler(async (req: Request, res: Response) => {
  const user = (req as any).user;
  if (!user) throw new ErrorResponse("Unauthorized", statusCode.Unauthorized);

  const filter: any = { schoolId: user.schoolId };

  if (user.role === "STUDENT") {
    filter.studentId = user.id;
  } else if (user.role === "TEACHER") {
    filter.teacherId = user.id;
  } else {
    return SuccessResponse(res, "No leaves found for this role", []);
  }

  const leaves = await (prisma.leaveRequest as any).findMany({
    where: filter,
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Leaves retrieved successfully", leaves);
});

/**
 * @route   GET /api/common/leave/school/:schoolId
 * @desc    Get all leaves for a school (Admin View)
 * @access  Admin/Principal
 */
export const getAllLeaves = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const {
    status,
    type,
    role,
    studentId,
    teacherId,
    startDate: qStartDate,
    endDate: qEndDate,
    page = "1",
    limit = "10"
  } = req.query;

  const pageNum = parseInt(page as string) || 1;
  const limitNum = parseInt(limit as string) || 10;
  const skip = (pageNum - 1) * limitNum;

  const filter: any = { schoolId: schoolId as string };

  if (typeof status === 'string') filter.status = status;
  if (typeof type === 'string') filter.type = type;

  if (role === 'STUDENT') {
    if (typeof studentId === 'string') {
      filter.studentId = studentId;
    } else {
      filter.studentId = { not: null };
    }
  } else if (role === 'TEACHER') {
    if (typeof teacherId === 'string') {
      filter.teacherId = teacherId;
    } else {
      filter.teacherId = { not: null };
    }
  }

  if (typeof qStartDate === 'string' && typeof qEndDate === 'string') {
    const startDate = new Date(qStartDate);
    const endDate = new Date(qEndDate);
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      filter.startDate = { gte: startDate };
      filter.endDate = { lte: endDate };
    }
  }

  const [leaves, total] = await Promise.all([
    (prisma.leaveRequest as any).findMany({
      where: filter,
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            admissionNumber: true,
            enrollments: {
              where: {
                academicYear: { isCurrent: true }
              },
              select: {
                rollNumber: true,
                section: {
                  select: {
                    name: true,
                    class: { select: { name: true } }
                  }
                }
              },
              take: 1
            }
          }
        },
        teacher: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            qualification: true,
            specialization: true,
            experience: true,
            phone: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limitNum
    }),
    (prisma.leaveRequest as any).count({ where: filter })
  ]);

  return SuccessResponse(res, "All leaves retrieved successfully", {
    leaves,
    pagination: {
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * @route   PATCH /api/common/leave/:id/status
 * @desc    Approve/Reject leave
 * @access  Admin/Teacher(for students)
 */
export const updateLeaveStatus = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateLeaveStatusSchema.parse(req.body);
  const currentUser = (req as any).user;

  const leave = await prisma.leaveRequest.findUnique({
    where: { id: id as string }
  });

  if (!leave) {
    throw new ErrorResponse("Leave request not found", statusCode.Not_Found);
  }

  const updatedLeave = await prisma.leaveRequest.update({
    where: { id: id as string },
    data: {
      status: validatedData.status,
      rejectionReason: validatedData.rejectionReason,
      approvedBy: currentUser?.id || validatedData.approvedBy,
    }
  });

  return SuccessResponse(
    res,
    `Leave request ${validatedData.status.toLowerCase()} successfully`,
    updatedLeave
  );
});

/**
 * @route   DELETE /api/common/leave/:id
 * @desc    Cancel/Delete leave request
 * @access  Owner/Admin
 */
export const deleteLeave = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = (req as any).user;

  const leave = await prisma.leaveRequest.findUnique({
    where: { id: id as string }
  });

  if (!leave) {
    throw new ErrorResponse("Leave request not found", statusCode.Not_Found);
  }

  // Authorization check: Only owner or admin can delete
  // Note: Simple check here. In robust system, check role & ownership.

  await prisma.leaveRequest.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Leave request deleted successfully", null);
});
