"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.punchAttendance = exports.updateTeacherAttendance = exports.getAttendanceByTeacher = exports.getTeacherAttendanceBySchool = exports.markBulkTeacherAttendance = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const attendance_validation_1 = require("../validation/attendance.validation");
/**
 * @route   POST /api/teacher/attendance/bulk
 * @desc    Mark attendance for multiple teachers (School Level)
 * @access  Admin/School
 */
exports.markBulkTeacherAttendance = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = attendance_validation_1.markBulkTeacherAttendanceSchema.parse(req.body);
    const date = new Date(validatedData.date);
    // Validate School exists
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: validatedData.schoolId }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Check if the date is a holiday
    const academicYear = await prisma_1.prisma.academicYear.findFirst({
        where: {
            schoolId: validatedData.schoolId,
            isCurrent: true,
        },
    });
    if (academicYear) {
        const holiday = await prisma_1.prisma.holiday.findFirst({
            where: {
                schoolId: validatedData.schoolId,
                academicYearId: academicYear.id,
                date: date,
                isActive: true,
            },
        });
        if (holiday) {
            // Auto-mark all teachers as HOLIDAY
            const allTeachers = await prisma_1.prisma.teacher.findMany({
                where: {
                    schoolId: validatedData.schoolId,
                    isActive: true,
                    status: { not: 'TERMINATED' },
                },
                select: { id: true },
            });
            const operations = allTeachers.map((teacher) => {
                return prisma_1.prisma.staffAttendance.upsert({
                    where: {
                        teacherId_date: {
                            teacherId: teacher.id,
                            date: date,
                        },
                    },
                    update: {
                        status: "HOLIDAY",
                        remarks: holiday.name,
                        checkInTime: null,
                        checkOutTime: null,
                    },
                    create: {
                        teacherId: teacher.id,
                        date: date,
                        schoolId: validatedData.schoolId,
                        status: "HOLIDAY",
                        remarks: holiday.name,
                        checkInTime: null,
                        checkOutTime: null,
                    },
                });
            });
            const results = await prisma_1.prisma.$transaction(operations);
            return (0, response_util_1.SuccessResponse)(res, `Attendance auto-marked as HOLIDAY for ${holiday.name}`, { count: results.length, holiday: holiday.name }, types_1.statusCode.Created);
        }
    }
    // Perform bulk upsert in transaction
    const operations = validatedData.teachers.map((teacher) => {
        return prisma_1.prisma.staffAttendance.upsert({
            where: {
                teacherId_date: {
                    teacherId: teacher.teacherId,
                    date: date
                }
            },
            update: {
                status: teacher.status,
                checkInTime: teacher.checkInTime ? new Date(teacher.checkInTime) : undefined,
                checkOutTime: teacher.checkOutTime ? new Date(teacher.checkOutTime) : undefined,
                remarks: teacher.remarks,
            },
            create: {
                teacherId: teacher.teacherId,
                date: date,
                schoolId: validatedData.schoolId,
                status: teacher.status,
                checkInTime: teacher.checkInTime ? new Date(teacher.checkInTime) : undefined,
                checkOutTime: teacher.checkOutTime ? new Date(teacher.checkOutTime) : undefined,
                remarks: teacher.remarks,
            }
        });
    });
    const results = await prisma_1.prisma.$transaction(operations);
    return (0, response_util_1.SuccessResponse)(res, "Teacher attendance marked successfully", { count: results.length }, types_1.statusCode.Created);
});
/**
 * @route   GET /api/teacher/attendance/school/:schoolId
 * @desc    Get daily attendance sheet for all teachers in school
 * @access  Admin/School
 */
exports.getTeacherAttendanceBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { date } = req.query;
    if (!date) {
        throw new response_util_1.ErrorResponse("Date is required", types_1.statusCode.Bad_Request);
    }
    const searchDate = new Date(date);
    // Check if the date is a holiday
    const academicYear = await prisma_1.prisma.academicYear.findFirst({
        where: {
            schoolId: schoolId,
            isCurrent: true,
        },
    });
    let holiday = null;
    if (academicYear) {
        holiday = await prisma_1.prisma.holiday.findFirst({
            where: {
                schoolId: schoolId,
                academicYearId: academicYear.id,
                date: searchDate,
                isActive: true,
            },
        });
    }
    // 1. Get all active teachers in the school
    const teachers = await prisma_1.prisma.teacher.findMany({
        where: {
            schoolId: schoolId,
            isActive: true, // Only show active teachers
            status: { not: 'TERMINATED' } // Exclude terminated
        },
        select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            profilePicture: true,
        },
        orderBy: { firstName: 'asc' }
    });
    // 2. Get attendance records for these teachers on the date
    const teacherIds = teachers.map(t => t.id);
    const attendanceRecords = await prisma_1.prisma.staffAttendance.findMany({
        where: {
            teacherId: { in: teacherIds },
            date: searchDate,
        }
    });
    // Map attendance to teachers
    const result = teachers.map(teacher => {
        const attendance = attendanceRecords.find(a => a.teacherId === teacher.id);
        return {
            teacher,
            attendance: attendance || null
        };
    });
    return (0, response_util_1.SuccessResponse)(res, "School teacher attendance retrieved successfully", {
        attendance: result,
        isHoliday: !!holiday,
        holiday: holiday || null,
    });
});
/**
 * @route   GET /api/teacher/attendance/teacher/:teacherId
 * @desc    Get attendance history for a specific teacher
 * @access  Admin/School/Teacher
 */
exports.getAttendanceByTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { teacherId } = req.params;
    const { month, year } = req.query;
    const where = { teacherId: teacherId };
    // Filter by Month/Year if provided
    if (month && year) {
        const startDate = new Date(parseInt(year), parseInt(month) - 1, 1);
        const endDate = new Date(parseInt(year), parseInt(month), 0);
        where.date = {
            gte: startDate,
            lte: endDate
        };
    }
    const attendance = await prisma_1.prisma.staffAttendance.findMany({
        where,
        orderBy: { date: 'desc' },
        select: {
            id: true,
            date: true,
            status: true,
            checkInTime: true,
            checkOutTime: true,
            remarks: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher attendance retrieved successfully", attendance);
});
/**
 * @route   PUT /api/teacher/attendance/:id
 * @desc    Update specific attendance record
 * @access  Admin/School
 */
exports.updateTeacherAttendance = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = attendance_validation_1.updateTeacherAttendanceSchema.parse(req.body);
    const existing = await prisma_1.prisma.staffAttendance.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Attendance record not found", types_1.statusCode.Not_Found);
    const updateData = {};
    if (validatedData.status)
        updateData.status = validatedData.status;
    if (validatedData.remarks !== undefined)
        updateData.remarks = validatedData.remarks;
    if (validatedData.checkInTime !== undefined) {
        updateData.checkInTime = validatedData.checkInTime ? new Date(validatedData.checkInTime) : null;
    }
    if (validatedData.checkOutTime !== undefined) {
        updateData.checkOutTime = validatedData.checkOutTime ? new Date(validatedData.checkOutTime) : null;
    }
    const update = await prisma_1.prisma.staffAttendance.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Attendance updated successfully", update);
});
/**
 * @route   POST /api/teacher/attendance/punch
 * @desc    Teacher Punch In/Out
 * @access  Teacher
 */
exports.punchAttendance = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const teacherPayload = req.teacher;
    if (!teacherPayload) {
        throw new response_util_1.ErrorResponse("Teacher not found in request", types_1.statusCode.Unauthorized);
    }
    const validatedData = attendance_validation_1.punchAttendanceSchema.parse(req.body);
    const { type } = validatedData;
    const teacherId = teacherPayload.userId;
    const schoolId = teacherPayload.schoolId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    // Check if attendance already exists for today
    let attendance = await prisma_1.prisma.staffAttendance.findUnique({
        where: {
            teacherId_date: {
                teacherId,
                date: today,
            },
        },
    });
    if (type === "IN") {
        if (attendance && attendance.checkInTime) {
            throw new response_util_1.ErrorResponse("Already punched in for today", types_1.statusCode.Bad_Request);
        }
        attendance = await prisma_1.prisma.staffAttendance.upsert({
            where: {
                teacherId_date: {
                    teacherId,
                    date: today,
                },
            },
            update: {
                checkInTime: new Date(),
                status: "PRESENT", // Auto-mark as PRESENT on punch in
            },
            create: {
                teacherId,
                schoolId,
                date: today,
                checkInTime: new Date(),
                status: "PRESENT",
            },
        });
    }
    else {
        // Punch OUT
        if (!attendance || !attendance.checkInTime) {
            throw new response_util_1.ErrorResponse("Cannot punch out without punching in", types_1.statusCode.Bad_Request);
        }
        if (attendance.checkOutTime) {
            throw new response_util_1.ErrorResponse("Already punched out for today", types_1.statusCode.Bad_Request);
        }
        attendance = await prisma_1.prisma.staffAttendance.update({
            where: {
                id: attendance.id,
            },
            data: {
                checkOutTime: new Date(),
            },
        });
    }
    return (0, response_util_1.SuccessResponse)(res, `Punched ${type} successfully`, attendance, types_1.statusCode.Created);
});
//# sourceMappingURL=attendance.controller.js.map