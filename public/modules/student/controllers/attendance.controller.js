"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAttendance = exports.getAttendanceByStudent = exports.getAttendanceBySection = exports.markBulkAttendance = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const attendance_validation_1 = require("../validation/attendance.validation");
/**
 * @route   POST /api/student/attendance/bulk
 * @desc    Mark attendance for multiple students (Class/Section)
 * @access  Admin/Teacher
 */
exports.markBulkAttendance = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = attendance_validation_1.markBulkAttendanceSchema.parse(req.body);
    // Validate Section belongs to School
    const section = await prisma_1.prisma.section.findUnique({
        where: { id: validatedData.sectionId }
    });
    if (!section || section.schoolId !== validatedData.schoolId) {
        throw new response_util_1.ErrorResponse("Invalid section or school ID mismatch", types_1.statusCode.Bad_Request);
    }
    const date = new Date(validatedData.date);
    // Check if the date is a holiday
    const holiday = await prisma_1.prisma.holiday.findFirst({
        where: {
            schoolId: validatedData.schoolId,
            academicYearId: validatedData.academicYearId,
            date: date,
            isActive: true,
        },
    });
    if (holiday) {
        // Auto-mark all students in section as HOLIDAY
        const enrollments = await prisma_1.prisma.studentEnrollment.findMany({
            where: {
                sectionId: validatedData.sectionId,
                academicYearId: validatedData.academicYearId,
            },
            select: { studentId: true },
        });
        const operations = enrollments.map((enrollment) => {
            return prisma_1.prisma.studentAttendance.upsert({
                where: {
                    studentId_date: {
                        studentId: enrollment.studentId,
                        date: date,
                    },
                },
                update: {
                    status: "HOLIDAY",
                    remarks: holiday.name,
                    markedBy: "SYSTEM",
                },
                create: {
                    studentId: enrollment.studentId,
                    date: date,
                    status: "HOLIDAY",
                    remarks: holiday.name,
                    academicYearId: validatedData.academicYearId,
                    schoolId: validatedData.schoolId,
                    markedBy: "SYSTEM",
                },
            });
        });
        const results = await prisma_1.prisma.$transaction(operations);
        return (0, response_util_1.SuccessResponse)(res, `Attendance auto-marked as HOLIDAY for ${holiday.name}`, { count: results.length, holiday: holiday.name }, types_1.statusCode.Created);
    }
    // Perform bulk upsert using transaction
    const operations = validatedData.students.map((student) => {
        return prisma_1.prisma.studentAttendance.upsert({
            where: {
                studentId_date: {
                    studentId: student.studentId,
                    date: date
                }
            },
            update: {
                status: student.status,
                remarks: student.remarks,
                markedBy: validatedData.markedBy,
            },
            create: {
                studentId: student.studentId,
                date: date,
                status: student.status,
                remarks: student.remarks,
                academicYearId: validatedData.academicYearId,
                schoolId: validatedData.schoolId,
                markedBy: validatedData.markedBy,
            }
        });
    });
    const results = await prisma_1.prisma.$transaction(operations);
    return (0, response_util_1.SuccessResponse)(res, "Attendance marked successfully", { count: results.length }, types_1.statusCode.Created);
});
/**
 * @route   GET /api/student/attendance/section/:sectionId
 * @desc    Get attendance for a section on a specific date
 * @access  Admin/Teacher
 */
exports.getAttendanceBySection = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { sectionId } = req.params;
    const { date, academicYearId } = req.query;
    if (!date || !academicYearId) {
        throw new response_util_1.ErrorResponse("Date and Academic Year ID are required", types_1.statusCode.Bad_Request);
    }
    const searchDate = new Date(date);
    // Check if the date is a holiday
    const section = await prisma_1.prisma.section.findUnique({
        where: { id: sectionId },
        select: { schoolId: true },
    });
    let holiday = null;
    if (section) {
        holiday = await prisma_1.prisma.holiday.findFirst({
            where: {
                schoolId: section.schoolId,
                academicYearId: academicYearId,
                date: searchDate,
                isActive: true,
            },
        });
    }
    // 1. Get all students currently enrolled in this section for the academic year
    // This helps to show WHO is missing from attendance list or to list all students with their status
    const students = await prisma_1.prisma.studentEnrollment.findMany({
        where: {
            sectionId: sectionId,
            academicYearId: academicYearId
        },
        include: {
            student: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    admissionNumber: true,
                    profilePicture: true,
                }
            }
        },
        orderBy: {
            student: { firstName: 'asc' }
        }
    });
    // 2. Get attendance records for these students on the date
    const studentIds = students.map(s => s.studentId);
    const attendanceRecords = await prisma_1.prisma.studentAttendance.findMany({
        where: {
            studentId: { in: studentIds },
            date: searchDate,
            academicYearId: academicYearId
        }
    });
    // Get unique markedBy values that look like UUIDs
    const teacherIds = Array.from(new Set(attendanceRecords
        .map(a => a.markedBy)
        .filter(id => id && id.length === 36)));
    const teachers = await prisma_1.prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, firstName: true, lastName: true }
    });
    const teacherMap = new Map(teachers.map(t => [t.id, `${t.firstName} ${t.lastName}`]));
    // Re-map attendance records to include teacher name
    const processedAttendance = attendanceRecords.map(record => ({
        ...record,
        markedBy: (record.markedBy && teacherMap.has(record.markedBy))
            ? teacherMap.get(record.markedBy)
            : record.markedBy
    }));
    // Map attendance to students
    const result = students.map(enrollment => {
        const attendance = processedAttendance.find(a => a.studentId === enrollment.studentId);
        return {
            student: enrollment.student,
            rollNumber: enrollment.rollNumber,
            attendance: attendance || null // null means not marked yet
        };
    });
    return (0, response_util_1.SuccessResponse)(res, "Section attendance retrieved successfully", {
        attendance: result,
        isHoliday: !!holiday,
        holiday: holiday || null,
    });
});
/**
 * @route   GET /api/student/attendance/student/:studentId
 * @desc    Get attendance history for a student
 * @access  Admin/Teacher/Parent/Student
 */
exports.getAttendanceByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const { academicYearId, month, year } = req.query;
    const where = { studentId: studentId };
    if (academicYearId)
        where.academicYearId = academicYearId;
    // Filter by Month/Year if provided
    if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        where.date = {
            gte: startDate,
            lte: endDate
        };
    }
    const attendance = await prisma_1.prisma.studentAttendance.findMany({
        where,
        orderBy: { date: 'desc' }
    });
    // Get unique markedBy values that look like UUIDs
    const teacherIds = Array.from(new Set(attendance
        .map(a => a.markedBy)
        .filter(id => id && id.length === 36)));
    // Fetch teacher names
    const teachers = await prisma_1.prisma.teacher.findMany({
        where: { id: { in: teacherIds } },
        select: { id: true, firstName: true, lastName: true }
    });
    const teacherMap = new Map(teachers.map(t => [t.id, `${t.firstName} ${t.lastName}`]));
    // Re-map attendance records to include teacher name
    const result = attendance.map(record => ({
        ...record,
        markedBy: (record.markedBy && teacherMap.has(record.markedBy))
            ? teacherMap.get(record.markedBy)
            : record.markedBy
    }));
    return (0, response_util_1.SuccessResponse)(res, "Student attendance retrieved successfully", result);
});
/**
 * @route   PUT /api/student/attendance/:id
 * @desc    Update specific attendance record
 * @access  Admin/Teacher
 */
exports.updateAttendance = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = attendance_validation_1.updateAttendanceSchema.parse(req.body);
    const existing = await prisma_1.prisma.studentAttendance.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Attendance record not found", types_1.statusCode.Not_Found);
    const update = await prisma_1.prisma.studentAttendance.update({
        where: { id: id },
        data: validatedData
    });
    return (0, response_util_1.SuccessResponse)(res, "Attendance updated successfully", update);
});
//# sourceMappingURL=attendance.controller.js.map