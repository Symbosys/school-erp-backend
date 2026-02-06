"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deletePTM = exports.updatePTM = exports.getPTMById = exports.getAllPTMs = exports.createPTM = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const ptm_validation_1 = require("../validation/ptm.validation");
/**
 * @route   POST /api/school/ptm
 * @desc    Create a new Parent Teacher Meeting
 * @access  Private (School Admin)
 */
exports.createPTM = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const schoolId = req.school?.id;
    const createdBy = req.school?.id; // Admin ID
    const validatedData = ptm_validation_1.createPTMSchema.parse(req.body);
    // Transaction to create PTM and its Targets
    const result = await prisma_1.prisma.$transaction(async (tx) => {
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
        }
        else if (validatedData.targetType === "SECTION" && validatedData.sectionId) {
            await tx.pTMTarget.create({
                data: { ptmId: ptm.id, sectionId: validatedData.sectionId }
            });
        }
        else if (validatedData.targetType === "INDIVIDUAL" && validatedData.studentIds) {
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
    return (0, response_util_1.SuccessResponse)(res, "PTM created successfully", result, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/ptm
 * @desc    Get all PTMs for the school
 * @access  Private (School Admin)
 */
exports.getAllPTMs = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const schoolId = req.params.schoolId;
    const ptms = await prisma_1.prisma.parentTeacherMeeting.findMany({
        where: { schoolId: schoolId },
        include: {
            _count: { select: { targets: true } }
        },
        orderBy: { meetingDate: 'desc' }
    });
    return (0, response_util_1.SuccessResponse)(res, "PTMs retrieved successfully", ptms);
});
/**
 * @route   GET /api/school/ptm/:id
 * @desc    Get PTM details
 * @access  Private (School Admin)
 */
exports.getPTMById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const ptm = await prisma_1.prisma.parentTeacherMeeting.findUnique({
        where: { id: id },
        include: {
            targets: true
        }
    });
    if (!ptm) {
        throw new response_util_1.ErrorResponse("PTM not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "PTM details retrieved", ptm);
});
/**
 * @route   PATCH /api/school/ptm/:id
 * @desc    Update PTM
 * @access  Private (School Admin)
 */
exports.updatePTM = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = ptm_validation_1.updatePTMSchema.parse(req.body);
    // If targetType is changing, we might need to wipe old targets.
    // For simplicity, strict updates on basic fields. Complex target changes usually require re-creating or specific logic.
    // Here we allow basic updates.
    const ptm = await prisma_1.prisma.parentTeacherMeeting.update({
        where: { id: id },
        data: {
            title: validatedData.title,
            description: validatedData.description,
            meetingDate: validatedData.meetingDate ? new Date(validatedData.meetingDate) : undefined,
            startTime: validatedData.startTime,
            endTime: validatedData.endTime,
            location: validatedData.location,
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "PTM updated successfully", ptm);
});
/**
 * @route   DELETE /api/school/ptm/:id
 * @desc    Delete PTM
 * @access  Private (School Admin)
 */
exports.deletePTM = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.parentTeacherMeeting.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "PTM deleted successfully");
});
//# sourceMappingURL=ptm.controller.js.map