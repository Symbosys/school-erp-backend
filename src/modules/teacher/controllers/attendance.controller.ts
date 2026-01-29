import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  markBulkTeacherAttendanceSchema,
  updateTeacherAttendanceSchema,
  punchAttendanceSchema,
} from "../validation/attendance.validation";

/**
 * @route   POST /api/teacher/attendance/bulk
 * @desc    Mark attendance for multiple teachers (School Level)
 * @access  Admin/School
 */
export const markBulkTeacherAttendance = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = markBulkTeacherAttendanceSchema.parse(req.body);

  const date = new Date(validatedData.date);

  // Validate School exists
  const school = await prisma.school.findUnique({
    where: { id: validatedData.schoolId }
  });
  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Check if the date is a holiday
  const academicYear = await prisma.academicYear.findFirst({
    where: {
      schoolId: validatedData.schoolId,
      isCurrent: true,
    },
  });

  if (academicYear) {
    const holiday = await prisma.holiday.findFirst({
      where: {
        schoolId: validatedData.schoolId,
        academicYearId: academicYear.id,
        date: date,
        isActive: true,
      },
    });

    if (holiday) {
      // Auto-mark all teachers as HOLIDAY
      const allTeachers = await prisma.teacher.findMany({
        where: {
          schoolId: validatedData.schoolId,
          isActive: true,
          status: { not: 'TERMINATED' },
        },
        select: { id: true },
      });

      const operations = allTeachers.map((teacher) => {
        return prisma.staffAttendance.upsert({
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

      const results = await prisma.$transaction(operations);

      return SuccessResponse(
        res,
        `Attendance auto-marked as HOLIDAY for ${holiday.name}`,
        { count: results.length, holiday: holiday.name },
        statusCode.Created
      );
    }
  }

  // Perform bulk upsert in transaction
  const operations = validatedData.teachers.map((teacher) => {
    return prisma.staffAttendance.upsert({
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

  const results = await prisma.$transaction(operations);

  return SuccessResponse(res, "Teacher attendance marked successfully", { count: results.length }, statusCode.Created);
});


/**
 * @route   GET /api/teacher/attendance/school/:schoolId
 * @desc    Get daily attendance sheet for all teachers in school
 * @access  Admin/School
 */
export const getTeacherAttendanceBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { date } = req.query;

  if (!date) {
    throw new ErrorResponse("Date is required", statusCode.Bad_Request);
  }

  const searchDate = new Date(date as string);

  // Check if the date is a holiday
  const academicYear = await prisma.academicYear.findFirst({
    where: {
      schoolId: schoolId as string,
      isCurrent: true,
    },
  });

  let holiday = null;
  if (academicYear) {
    holiday = await prisma.holiday.findFirst({
      where: {
        schoolId: schoolId as string,
        academicYearId: academicYear.id,
        date: searchDate,
        isActive: true,
      },
    });
  }

  // 1. Get all active teachers in the school
  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId: schoolId as string,
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
  const attendanceRecords = await prisma.staffAttendance.findMany({
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

  return SuccessResponse(res, "School teacher attendance retrieved successfully", {
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
export const getAttendanceByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const { month, year } = req.query;

  const where: any = { teacherId: teacherId as string };

  // Filter by Month/Year if provided
  if (month && year) {
    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
    where.date = {
      gte: startDate,
      lte: endDate
    };
  }

  const attendance = await prisma.staffAttendance.findMany({
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

  return SuccessResponse(res, "Teacher attendance retrieved successfully", attendance);
});

/**
 * @route   PUT /api/teacher/attendance/:id
 * @desc    Update specific attendance record
 * @access  Admin/School
 */
export const updateTeacherAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTeacherAttendanceSchema.parse(req.body);

  const existing = await prisma.staffAttendance.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Attendance record not found", statusCode.Not_Found);

  const updateData: any = {};
  if (validatedData.status) updateData.status = validatedData.status;
  if (validatedData.remarks !== undefined) updateData.remarks = validatedData.remarks;

  if (validatedData.checkInTime !== undefined) {
    updateData.checkInTime = validatedData.checkInTime ? new Date(validatedData.checkInTime) : null;
  }
  if (validatedData.checkOutTime !== undefined) {
    updateData.checkOutTime = validatedData.checkOutTime ? new Date(validatedData.checkOutTime) : null;
  }

  const update = await prisma.staffAttendance.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Attendance updated successfully", update);
});


/**
 * @route   POST /api/teacher/attendance/punch
 * @desc    Teacher Punch In/Out
 * @access  Teacher
 */
export const punchAttendance = asyncHandler(async (req: Request, res: Response) => {
  const teacherPayload = (req as any).teacher;
  if (!teacherPayload) {
    throw new ErrorResponse("Teacher not found in request", statusCode.Unauthorized);
  }

  const validatedData = punchAttendanceSchema.parse(req.body);
  const { type } = validatedData;
  const teacherId = teacherPayload.userId;
  const schoolId = teacherPayload.schoolId;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if attendance already exists for today
  let attendance = await prisma.staffAttendance.findUnique({
    where: {
      teacherId_date: {
        teacherId,
        date: today,
      },
    },
  });

  if (type === "IN") {
    if (attendance && attendance.checkInTime) {
      throw new ErrorResponse("Already punched in for today", statusCode.Bad_Request);
    }

    attendance = await prisma.staffAttendance.upsert({
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
  } else {
    // Punch OUT
    if (!attendance || !attendance.checkInTime) {
      throw new ErrorResponse("Cannot punch out without punching in", statusCode.Bad_Request);
    }

    if (attendance.checkOutTime) {
      throw new ErrorResponse("Already punched out for today", statusCode.Bad_Request);
    }

    attendance = await prisma.staffAttendance.update({
      where: {
        id: attendance.id,
      },
      data: {
        checkOutTime: new Date(),
      },
    });
  }

  return SuccessResponse(
    res,
    `Punched ${type} successfully`,
    attendance,
    statusCode.Created
  );
});

