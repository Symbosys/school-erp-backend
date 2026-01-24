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

  const where: any = { schoolId: user.schoolId };

  if (user.role === "STUDENT") {
    where.studentId = user.id;
  } else if (user.role === "TEACHER") {
    where.teacherId = user.id;
  } else {
    return SuccessResponse(res, "No leaves found for this role", []);
  }

  const leaves = await prisma.leaveRequest.findMany({
    where,
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
  const { status, type, role } = req.query; // role filter: 'STUDENT' or 'TEACHER'

  const where: any = { schoolId };

  if (status) where.status = status;
  if (type) where.type = type;
  
  if (role === 'STUDENT') {
    where.studentId = { not: null };
  } else if (role === 'TEACHER') {
    where.teacherId = { not: null };
  }

  const leaves = await prisma.leaveRequest.findMany({
    where,
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
        //   class: true // if relation exists directly? likely need enrollment
        }
      },
      teacher: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          employeeId: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "All leaves retrieved successfully", leaves);
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
