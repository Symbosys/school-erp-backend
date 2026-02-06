"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMyPTMs = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
/**
 * @route   GET /api/parents/ptm/my-meetings
 * @desc    Get PTMs relevant to the logged-in parent (Class, Section, or Individual)
 * @access  Private (Parent)
 */
exports.getMyPTMs = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const parentId = req.parent?.userId;
    const schoolId = req.parent?.schoolId;
    if (!parentId) {
        throw new response_util_1.ErrorResponse("Not authenticated", types_1.statusCode.Unauthorized);
    }
    // 1. Get all students linked to this parent to find their Class and Section IDs
    const studentLinks = await prisma_1.prisma.studentParent.findMany({
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
    const classIds = new Set();
    const sectionIds = new Set();
    studentLinks.forEach((link) => {
        if (link.student && link.student.enrollments) {
            link.student.enrollments.forEach((enrollment) => {
                if (enrollment.section?.classId)
                    classIds.add(enrollment.section.classId);
                if (enrollment.sectionId)
                    sectionIds.add(enrollment.sectionId);
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
    const ptms = await prisma_1.prisma.parentTeacherMeeting.findMany({
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
    return (0, response_util_1.SuccessResponse)(res, "Parent Teacher Meetings retrieved successfully", ptms);
});
//# sourceMappingURL=ptm.controller.js.map