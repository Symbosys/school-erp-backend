import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";

/**
 * @route   GET /api/parents/ptm/my-meetings
 * @desc    Get PTMs relevant to the logged-in parent (Class, Section, or Individual)
 * @access  Private (Parent)
 */
export const getMyPTMs = asyncHandler(async (req: Request, res: Response) => {
  const parentId = (req as any).parent?.userId;
  const schoolId = (req as any).parent?.schoolId;

  if (!parentId) {
    throw new ErrorResponse("Not authenticated", statusCode.Unauthorized);
  }

  // 1. Get all students linked to this parent to find their Class and Section IDs
  const studentLinks = await prisma.studentParent.findMany({
    where: { parentId },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          enrollments: {
            where: {
              academicYear: { isCurrent: true }
            },
            select: {
              sectionId: true,
              section: {
                select: {
                  classId: true
                }
              }
            }
          }
        }
      }
    }
  });

  // Extract Class IDs and Section IDs from the children's current enrollments
  // We use Sets to avoid duplicates
  const classIds = new Set<string>();
  const sectionIds = new Set<string>();

  studentLinks.forEach((link: any) => {
    if (link.student && link.student.enrollments) {
      link.student.enrollments.forEach((enrollment: any) => {
        if (enrollment.section?.classId) classIds.add(enrollment.section.classId);
        if (enrollment.sectionId) sectionIds.add(enrollment.sectionId);
      });
    }
  });

  // 2. Query PTMs that match:
  // - Targeted to Class of any child
  // - Targeted to Section of any child
  // - Targeted specifically to this Parent (Individual)
  //
  // NOTE: We filter by targets. This allows a PTM to have multiple targets.
  // Casting to any to avoid Prisma Client type inference lag or generation issues
  const ptms = await (prisma as any).parentTeacherMeeting.findMany({
    where: {
      schoolId,
      isActive: true,
      targets: {
        some: {
          OR: [
            // Match Class
            { classId: { in: Array.from(classIds) } },
            // Match Section
            { sectionId: { in: Array.from(sectionIds) } },
            // Match Parent Directly
            { parentId: parentId }
          ]
        }
      }
    },
    include: {
      targets: true // Optional: if we want to show who it was for?
    },
    orderBy: {
      meetingDate: 'desc'
    }
  });

  return SuccessResponse(res, "Parent Teacher Meetings retrieved successfully", ptms);
});
