"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteNotice = exports.updateNotice = exports.getNoticesBySchool = exports.createNotice = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const cloudinary_1 = require("../../../config/cloudinary");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const notice_validation_1 = require("../validation/notice.validation");
/**
 * @route   POST /api/school/notice
 * @desc    Create a new notice
 * @access  Admin/School
 */
exports.createNotice = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    // Validate request body
    const validatedData = notice_validation_1.createNoticeSchema.parse(req.body);
    // Check if school exists
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: validatedData.schoolId }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Handle attachment upload if provided
    let attachmentData = null;
    if (req.file) {
        try {
            attachmentData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/notices");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse("Failed to upload attachment", types_1.statusCode.Internal_Server_Error);
        }
    }
    // Create notice
    const notice = await prisma_1.prisma.notice.create({
        data: {
            schoolId: validatedData.schoolId,
            title: validatedData.title,
            content: validatedData.content,
            type: validatedData.type,
            priority: validatedData.priority,
            forStudents: validatedData.forStudents,
            forParents: validatedData.forParents,
            forTeachers: validatedData.forTeachers,
            targetClassIds: validatedData.targetClassIds ? validatedData.targetClassIds : undefined,
            attachment: attachmentData || undefined,
            postedBy: validatedData.postedBy, // Ideally from req.user
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Notice created successfully", notice, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/notice/school/:schoolId
 * @desc    Get all notices for a school with filters
 * @access  Admin/School/Teacher/Student/Parent
 */
exports.getNoticesBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { page = 1, limit = 10, type, priority, forStudents, forParents, forTeachers, search } = req.query;
    const where = { schoolId };
    // Filters
    if (type)
        where.type = type;
    if (priority)
        where.priority = priority;
    if (forStudents === 'true')
        where.forStudents = true;
    if (forParents === 'true')
        where.forParents = true;
    if (forTeachers === 'true')
        where.forTeachers = true;
    if (search) {
        where.title = { contains: search };
    }
    // Default sort by createdAt desc
    const notices = await prisma_1.prisma.notice.findMany({
        where,
        orderBy: { createdAt: "desc" }
    });
    const totalNotice = await prisma_1.prisma.notice.count({ where });
    return (0, response_util_1.SuccessResponse)(res, "Notices retrieved successfully", {
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
exports.updateNotice = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = notice_validation_1.updateNoticeSchema.parse(req.body);
    const existingNotice = await prisma_1.prisma.notice.findUnique({
        where: { id: id }
    });
    if (!existingNotice) {
        throw new response_util_1.ErrorResponse("Notice not found", types_1.statusCode.Not_Found);
    }
    // Handle attachment update
    let attachmentData = null;
    if (req.file) {
        try {
            // Delete old attachment if exists
            if (existingNotice.attachment && typeof existingNotice.attachment === 'object' && 'public_id' in existingNotice.attachment) {
                await (0, cloudinary_1.deleteFromCloudinary)(existingNotice.attachment.public_id);
            }
            attachmentData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/notices");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse("Failed to update attachment", types_1.statusCode.Internal_Server_Error);
        }
    }
    const updateData = { ...validatedData };
    if (attachmentData)
        updateData.attachment = attachmentData;
    // If targetClassIds coming from form-data is handled by Zod, we assign it directly
    if (validatedData.targetClassIds)
        updateData.targetClassIds = validatedData.targetClassIds;
    const updatedNotice = await prisma_1.prisma.notice.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Notice updated successfully", updatedNotice);
});
/**
 * @route   DELETE /api/school/notice/:id
 * @desc    Delete a notice
 * @access  Admin/School
 */
exports.deleteNotice = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const notice = await prisma_1.prisma.notice.findUnique({
        where: { id: id }
    });
    if (!notice) {
        throw new response_util_1.ErrorResponse("Notice not found", types_1.statusCode.Not_Found);
    }
    // Delete attachment from Cloudinary
    if (notice.attachment && typeof notice.attachment === 'object' && 'public_id' in notice.attachment) {
        try {
            await (0, cloudinary_1.deleteFromCloudinary)(notice.attachment.public_id);
        }
        catch (error) {
            console.error("Failed to delete attachment from Cloudinary", error);
            // Continue with DB deletion even if Cloudinary fails
        }
    }
    await prisma_1.prisma.notice.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Notice deleted successfully", null);
});
//# sourceMappingURL=notice.controller.js.map