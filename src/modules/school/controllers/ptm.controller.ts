import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { createPTMSchema, updatePTMSchema } from "../validation/ptm.validation";

/**
 * @route   POST /api/school/ptm
 * @desc    Create a new Parent Teacher Meeting
 * @access  Private (School Admin)
 */
export const createPTM = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = (req as any).school?.schoolId;
  const createdBy = (req as any).school?.id; // Admin ID

  const validatedData = createPTMSchema.parse(req.body);

  // Transaction to create PTM and its Targets
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create the PTM record
    const ptm = await tx.parentTeacherMeeting.create({
      data: {
        schoolId,
        title: validatedData.title,
        description: validatedData.description,
        meetingDate: new Date(validatedData.meetingDate),
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        location: validatedData.location,
        targetType: validatedData.targetType,
        createdBy,
      }
    });

    // 2. Create Target records based on type
    if (validatedData.targetType === "CLASS" && validatedData.classId) {
      await tx.pTMTarget.create({
        data: { ptmId: ptm.id, classId: validatedData.classId }
      });
    } else if (validatedData.targetType === "SECTION" && validatedData.sectionId) {
      await tx.pTMTarget.create({
        data: { ptmId: ptm.id, sectionId: validatedData.sectionId }
      });
    } else if (validatedData.targetType === "INDIVIDUAL" && validatedData.studentIds) {
      // Create a target for each student (linking to their PARENTS via db query if needed, 
      // but schema links targets to studentId as per plan update or parentId?)
      // Wait, schema has `parentId` in PTMTarget. User wanted `parentId`. 
      // But implementation plan discussed `studentId`. 
      // Checking Schema: `parentId String?`. 
      // So we must find Parents of these students.
      
      const parents = await tx.studentParent.findMany({
        where: { studentId: { in: validatedData.studentIds } },
        select: { parentId: true }
      });
      
      // Unique parents
      const uniqueParentIds = [...new Set(parents.map(p => p.parentId))];
      
      await tx.pTMTarget.createMany({
        data: uniqueParentIds.map(pid => ({
            ptmId: ptm.id,
            parentId: pid
        }))
      });
    }

    return ptm;
  });

  return SuccessResponse(res, "PTM created successfully", result, statusCode.Created);
});

/**
 * @route   GET /api/school/ptm
 * @desc    Get all PTMs for the school
 * @access  Private (School Admin)
 */
export const getAllPTMs = asyncHandler(async (req: Request, res: Response) => {
  const schoolId = req.params.schoolId;

  const ptms = await prisma.parentTeacherMeeting.findMany({
    where: { schoolId: schoolId as string },
    include: {
      _count: { select: { targets: true } } 
    },
    orderBy: { meetingDate: 'desc' }
  });

  return SuccessResponse(res, "PTMs retrieved successfully", ptms);
});

/**
 * @route   GET /api/school/ptm/:id
 * @desc    Get PTM details
 * @access  Private (School Admin)
 */
export const getPTMById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const ptm = await prisma.parentTeacherMeeting.findUnique({
    where: { id: id as string },
    include: {
      targets: true
    }
  });

  if (!ptm) {
    throw new ErrorResponse("PTM not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "PTM details retrieved", ptm);
});

/**
 * @route   PATCH /api/school/ptm/:id
 * @desc    Update PTM
 * @access  Private (School Admin)
 */
export const updatePTM = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updatePTMSchema.parse(req.body);

  // If targetType is changing, we might need to wipe old targets.
  // For simplicity, strict updates on basic fields. Complex target changes usually require re-creating or specific logic.
  // Here we allow basic updates.
  
  const ptm = await prisma.parentTeacherMeeting.update({
    where: { id: id as string },
    data: {
        title: validatedData.title,
        description: validatedData.description,
        meetingDate: validatedData.meetingDate ? new Date(validatedData.meetingDate) : undefined,
        startTime: validatedData.startTime,
        endTime: validatedData.endTime,
        location: validatedData.location,
    }
  });

  return SuccessResponse(res, "PTM updated successfully", ptm);
});

/**
 * @route   DELETE /api/school/ptm/:id
 * @desc    Delete PTM
 * @access  Private (School Admin)
 */
export const deletePTM = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.parentTeacherMeeting.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "PTM deleted successfully");
});
