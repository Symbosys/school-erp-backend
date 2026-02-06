"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteLeave = exports.updateLeaveStatus = exports.getAllLeaves = exports.getMyLeaves = exports.applyLeave = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const cloudinary_1 = require("../../../config/cloudinary");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const leave_validation_1 = require("../validator/leave.validation");
/**
 * @route   POST /api/common/leave (or similar)
 * @desc    Apply for leave (Student or Teacher)
 * @access  Student/Teacher
 */
exports.applyLeave = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    // Parsing body
    const validatedData = leave_validation_1.applyLeaveSchema.parse(req.body);
    // Identify User from Auth Middleware
    // Assuming req.user is populated with { id, role, schoolId }
    const user = req.user;
    if (!user) {
        throw new response_util_1.ErrorResponse("Unauthorized", types_1.statusCode.Unauthorized);
    }
    // Handle attachment
    let attachmentData = null;
    if (req.file) {
        try {
            attachmentData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/leaves");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse("Failed to upload attachment", types_1.statusCode.Internal_Server_Error);
        }
    }
    // Prepare data
    const leaveData = {
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
    }
    else if (user.role === "TEACHER" || user.role === "STAFF") {
        leaveData.teacherId = user.id;
    }
    else {
        // If Admin tries to apply? Maybe allow manual entry? 
        // For now, restrict to Student/Teacher self-service
        throw new response_util_1.ErrorResponse("Only Students and Teachers can apply for leave via this endpoint", types_1.statusCode.Forbidden);
    }
    const newLeave = await prisma_1.prisma.leaveRequest.create({
        data: leaveData
    });
    return (0, response_util_1.SuccessResponse)(res, "Leave application submitted successfully", newLeave, types_1.statusCode.Created);
});
/**
 * @route   GET /api/common/leave/my-leaves
 * @desc    Get current user's leaves
 * @access  Student/Teacher
 */
exports.getMyLeaves = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const user = req.user;
    if (!user)
        throw new response_util_1.ErrorResponse("Unauthorized", types_1.statusCode.Unauthorized);
    const filter = { schoolId: user.schoolId };
    if (user.role === "STUDENT") {
        filter.studentId = user.id;
    }
    else if (user.role === "TEACHER") {
        filter.teacherId = user.id;
    }
    else {
        return (0, response_util_1.SuccessResponse)(res, "No leaves found for this role", []);
    }
    const leaves = await prisma_1.prisma.leaveRequest.findMany({
        where: filter,
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Leaves retrieved successfully", leaves);
});
/**
 * @route   GET /api/common/leave/school/:schoolId
 * @desc    Get all leaves for a school (Admin View)
 * @access  Admin/Principal
 */
exports.getAllLeaves = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { status, type, role, studentId, teacherId, startDate: qStartDate, endDate: qEndDate, page = "1", limit = "10" } = req.query;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const filter = { schoolId: schoolId };
    if (typeof status === 'string')
        filter.status = status;
    if (typeof type === 'string')
        filter.type = type;
    if (role === 'STUDENT') {
        if (typeof studentId === 'string') {
            filter.studentId = studentId;
        }
        else {
            filter.studentId = { not: null };
        }
    }
    else if (role === 'TEACHER') {
        if (typeof teacherId === 'string') {
            filter.teacherId = teacherId;
        }
        else {
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
        prisma_1.prisma.leaveRequest.findMany({
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
        prisma_1.prisma.leaveRequest.count({ where: filter })
    ]);
    return (0, response_util_1.SuccessResponse)(res, "All leaves retrieved successfully", {
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
exports.updateLeaveStatus = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = leave_validation_1.updateLeaveStatusSchema.parse(req.body);
    const currentUser = req.user;
    const leave = await prisma_1.prisma.leaveRequest.findUnique({
        where: { id: id }
    });
    if (!leave) {
        throw new response_util_1.ErrorResponse("Leave request not found", types_1.statusCode.Not_Found);
    }
    const updatedLeave = await prisma_1.prisma.leaveRequest.update({
        where: { id: id },
        data: {
            status: validatedData.status,
            rejectionReason: validatedData.rejectionReason,
            approvedBy: currentUser?.id || validatedData.approvedBy,
        }
    });
    return (0, response_util_1.SuccessResponse)(res, `Leave request ${validatedData.status.toLowerCase()} successfully`, updatedLeave);
});
/**
 * @route   DELETE /api/common/leave/:id
 * @desc    Cancel/Delete leave request
 * @access  Owner/Admin
 */
exports.deleteLeave = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const user = req.user;
    const leave = await prisma_1.prisma.leaveRequest.findUnique({
        where: { id: id }
    });
    if (!leave) {
        throw new response_util_1.ErrorResponse("Leave request not found", types_1.statusCode.Not_Found);
    }
    // Authorization check: Only owner or admin can delete
    // Note: Simple check here. In robust system, check role & ownership.
    await prisma_1.prisma.leaveRequest.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Leave request deleted successfully", null);
});
//# sourceMappingURL=leave.controller.js.map