"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSubmission = exports.gradeSubmission = exports.getSubmissions = exports.submitHomework = exports.deleteHomework = exports.updateHomework = exports.getHomeworkById = exports.getHomeworkForStudent = exports.getHomeworkBySection = exports.createHomework = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const client_1 = require("../../../generated/prisma/client");
const homework_validation_1 = require("../validation/homework.validation");
// ==========================================
// HOMEWORK MANAGEMENT
// ==========================================
/**
 * @route   POST /api/homework
 * @desc    Create a new homework assignment
 * @access  Teacher/Admin
 */
exports.createHomework = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = homework_validation_1.createHomeworkSchema.parse(req.body);
    // Validate timetable entry exists and belongs to correct subject/teacher context
    const timetableEntry = await prisma_1.prisma.timetableEntry.findUnique({
        where: { id: validatedData.timetableEntryId },
        include: {
            subject: true,
            teacher: true,
        },
    });
    if (!timetableEntry) {
        throw new response_util_1.ErrorResponse("Timetable entry not found", types_1.statusCode.Not_Found);
    }
    // Create Homework
    const homework = await prisma_1.prisma.homework.create({
        data: {
            schoolId: validatedData.schoolId,
            sectionId: validatedData.sectionId,
            timetableEntryId: validatedData.timetableEntryId,
            assignedDate: new Date(validatedData.assignedDate),
            title: validatedData.title,
            description: validatedData.description,
            attachments: validatedData.attachments,
            dueDate: new Date(validatedData.dueDate),
            maxMarks: validatedData.maxMarks,
            assignedBy: validatedData.assignedBy,
            isActive: true,
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Homework assigned successfully", homework, types_1.statusCode.Created);
});
/**
 * @route   GET /api/homework/section/:sectionId
 * @desc    Get homework for a section (with filters)
 * @access  Student/Teacher/Admin
 */
exports.getHomeworkBySection = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { sectionId } = req.params;
    const { date, subjectId } = req.query;
    const where = {
        sectionId: sectionId,
        isActive: true,
    };
    if (date) {
        where.assignedDate = new Date(date);
    }
    if (subjectId) {
        where.timetableEntry = {
            subjectId: subjectId,
        };
    }
    const homework = await prisma_1.prisma.homework.findMany({
        where,
        include: {
            timetableEntry: {
                include: {
                    subject: { select: { id: true, name: true } },
                    timeSlot: { select: { id: true, name: true, startTime: true, endTime: true } },
                },
            },
            assignedByUser: {
                select: { id: true, firstName: true, lastName: true },
            },
            _count: {
                select: { submissions: true },
            },
        },
        orderBy: { assignedDate: "desc" },
    });
    return (0, response_util_1.SuccessResponse)(res, "Homework retrieved successfully", homework);
});
/**
 * @route   GET /api/homework/student/:studentId
 * @desc    Get homework for a student (includes submission status)
 * @access  Student
 */
exports.getHomeworkForStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const { date, status } = req.query;
    // 1. Get student's section
    const studentEnrollment = await prisma_1.prisma.studentEnrollment.findFirst({
        where: {
            studentId: studentId,
            academicYear: { isCurrent: true },
        },
        select: { sectionId: true },
    });
    if (!studentEnrollment) {
        throw new response_util_1.ErrorResponse("Student not enrolled in current academic year", types_1.statusCode.Not_Found);
    }
    // 2. Build filter
    const where = {
        sectionId: studentEnrollment.sectionId,
        isActive: true,
    };
    if (date)
        where.assignedDate = new Date(date);
    // 3. Fetch homework with this student's submission
    const homeworkList = await prisma_1.prisma.homework.findMany({
        where,
        include: {
            timetableEntry: {
                include: {
                    subject: { select: { id: true, name: true } },
                },
            },
            assignedByUser: {
                select: { id: true, firstName: true, lastName: true },
            },
            submissions: {
                where: { studentId: studentId },
                take: 1,
            },
        },
        orderBy: { dueDate: "asc" },
    });
    // 4. Transform response to flattening submission status
    const result = homeworkList.map((hw) => {
        const submission = hw.submissions[0];
        let calculatedStatus = client_1.HomeworkSubmissionStatus.PENDING;
        if (submission) {
            calculatedStatus = submission.status;
        }
        else if (new Date() > new Date(hw.dueDate)) {
            calculatedStatus = client_1.HomeworkSubmissionStatus.LATE; // Not submitted and past due
        }
        // Client-side filtering for status if requested
        if (status && calculatedStatus !== status)
            return null;
        return {
            ...hw,
            mySubmission: submission || null,
            status: calculatedStatus,
        };
    }).filter(Boolean); // Remove nulls from status filter
    return (0, response_util_1.SuccessResponse)(res, "My homework retrieved successfully", result);
});
/**
 * @route   GET /api/homework/:id
 * @desc    Get homework details
 * @access  All
 */
exports.getHomeworkById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const homework = await prisma_1.prisma.homework.findUnique({
        where: { id: id },
        include: {
            timetableEntry: {
                include: {
                    subject: true,
                    timeSlot: true,
                },
            },
            assignedByUser: {
                select: { id: true, firstName: true, lastName: true },
            },
        },
    });
    if (!homework)
        throw new response_util_1.ErrorResponse("Homework not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Homework details retrieved successfully", homework);
});
/**
 * @route   PUT /api/homework/:id
 * @desc    Update homework
 * @access  Teacher/Admin
 */
exports.updateHomework = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = homework_validation_1.updateHomeworkSchema.parse(req.body);
    const homework = await prisma_1.prisma.homework.update({
        where: { id: id },
        data: {
            title: validatedData.title,
            description: validatedData.description,
            attachments: validatedData.attachments,
            dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
            maxMarks: validatedData.maxMarks,
            isActive: validatedData.isActive,
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Homework updated successfully", homework);
});
/**
 * @route   DELETE /api/homework/:id
 * @desc    Delete homework
 * @access  Teacher/Admin
 */
exports.deleteHomework = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.homework.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Homework deleted successfully", null);
});
// ==========================================
// SUBMISSION MANAGEMENT
// ==========================================
/**
 * @route   POST /api/homework/:id/submit
 * @desc    Submit homework (Student)
 * @access  Student
 */
exports.submitHomework = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params; // homeworkId
    const validatedData = homework_validation_1.submitHomeworkSchema.parse(req.body);
    const homework = await prisma_1.prisma.homework.findUnique({ where: { id: id } });
    if (!homework)
        throw new response_util_1.ErrorResponse("Homework not found", types_1.statusCode.Not_Found);
    // Check if past due date
    // const isLate = new Date() > new Date(homework.dueDate);
    // Optional: Auto-mark as LATE if configured
    const submission = await prisma_1.prisma.homeworkSubmission.upsert({
        where: {
            homeworkId_studentId: {
                homeworkId: id,
                studentId: validatedData.studentId,
            },
        },
        update: {
            content: validatedData.content,
            attachments: validatedData.attachments,
            submittedAt: new Date(),
            status: client_1.HomeworkSubmissionStatus.SUBMITTED,
        },
        create: {
            homeworkId: id,
            studentId: validatedData.studentId,
            content: validatedData.content,
            attachments: validatedData.attachments,
            submittedAt: new Date(),
            status: client_1.HomeworkSubmissionStatus.SUBMITTED,
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Homework submitted successfully", submission);
});
/**
 * @route   GET /api/homework/:id/submissions
 * @desc    Get all submissions for a homework
 * @access  Teacher
 */
exports.getSubmissions = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const submissions = await prisma_1.prisma.homeworkSubmission.findMany({
        where: { homeworkId: id },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    admissionNumber: true,
                    profilePicture: true,
                },
            },
        },
        orderBy: { submittedAt: "desc" },
    });
    return (0, response_util_1.SuccessResponse)(res, "Submissions retrieved successfully", submissions);
});
/**
 * @route   PUT /api/homework/submission/:id/grade
 * @desc    Grade a submission
 * @access  Teacher
 */
exports.gradeSubmission = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params; // submissionId
    const validatedData = homework_validation_1.gradeSubmissionSchema.parse(req.body);
    const submission = await prisma_1.prisma.homeworkSubmission.update({
        where: { id: id },
        data: {
            marks: validatedData.marks,
            feedback: validatedData.feedback,
            gradedBy: validatedData.gradedBy,
            gradedAt: new Date(),
            status: validatedData.status || client_1.HomeworkSubmissionStatus.GRADED,
        },
    });
    return (0, response_util_1.SuccessResponse)(res, "Homework graded successfully", submission);
});
/**
 * @route   DELETE /api/homework/submission/:id
 * @desc    Delete a submission
 * @access  Teacher/Admin
 */
exports.deleteSubmission = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    await prisma_1.prisma.homeworkSubmission.delete({ where: { id: id } });
    return (0, response_util_1.SuccessResponse)(res, "Submission removed successfully", null);
});
//# sourceMappingURL=homework.controller.js.map