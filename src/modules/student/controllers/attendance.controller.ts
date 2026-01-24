import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  markBulkAttendanceSchema,
  updateAttendanceSchema,
} from "../validation/attendance.validation";

/**
 * @route   POST /api/student/attendance/bulk
 * @desc    Mark attendance for multiple students (Class/Section)
 * @access  Admin/Teacher
 */
export const markBulkAttendance = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = markBulkAttendanceSchema.parse(req.body);

  // Validate Section belongs to School
  const section = await prisma.section.findUnique({
    where: { id: validatedData.sectionId }
  });

  if (!section || section.schoolId !== validatedData.schoolId) {
    throw new ErrorResponse("Invalid section or school ID mismatch", statusCode.Bad_Request);
  }

  const date = new Date(validatedData.date);

  // Check if the date is a holiday
  const holiday = await prisma.holiday.findFirst({
    where: {
      schoolId: validatedData.schoolId,
      academicYearId: validatedData.academicYearId,
      date: date,
      isActive: true,
    },
  });

  if (holiday) {
    // Auto-mark all students in section as HOLIDAY
    const enrollments = await prisma.studentEnrollment.findMany({
      where: {
        sectionId: validatedData.sectionId,
        academicYearId: validatedData.academicYearId,
      },
      select: { studentId: true },
    });

    const operations = enrollments.map((enrollment) => {
      return prisma.studentAttendance.upsert({
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

    const results = await prisma.$transaction(operations);

    return SuccessResponse(
      res,
      `Attendance auto-marked as HOLIDAY for ${holiday.name}`,
      { count: results.length, holiday: holiday.name },
      statusCode.Created
    );
  }

  // Perform bulk upsert using transaction
  const operations = validatedData.students.map((student) => {
    return prisma.studentAttendance.upsert({
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

  const results = await prisma.$transaction(operations);

  return SuccessResponse(res, "Attendance marked successfully", { count: results.length }, statusCode.Created);
});


/**
 * @route   GET /api/student/attendance/section/:sectionId
 * @desc    Get attendance for a section on a specific date
 * @access  Admin/Teacher
 */
export const getAttendanceBySection = asyncHandler(async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const { date, academicYearId } = req.query;

  if (!date || !academicYearId) {
    throw new ErrorResponse("Date and Academic Year ID are required", statusCode.Bad_Request);
  }

  const searchDate = new Date(date as string);

  // Check if the date is a holiday
  const section = await prisma.section.findUnique({
    where: { id: sectionId as string },
    select: { schoolId: true },
  });

  let holiday = null;
  if (section) {
    holiday = await prisma.holiday.findFirst({
      where: {
        schoolId: section.schoolId,
        academicYearId: academicYearId as string,
        date: searchDate,
        isActive: true,
      },
    });
  }

  // 1. Get all students currently enrolled in this section for the academic year
  // This helps to show WHO is missing from attendance list or to list all students with their status
  const students = await prisma.studentEnrollment.findMany({
    where: {
      sectionId: sectionId as string,
      academicYearId: academicYearId as string
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
  const attendanceRecords = await prisma.studentAttendance.findMany({
    where: {
      studentId: { in: studentIds },
      date: searchDate,
      academicYearId: academicYearId as string
    }
  });

  // Map attendance to students
  const result = students.map(enrollment => {
    const attendance = attendanceRecords.find(a => a.studentId === enrollment.studentId);
    return {
      student: enrollment.student,
      rollNumber: enrollment.rollNumber,
      attendance: attendance || null // null means not marked yet
    };
  });

  return SuccessResponse(res, "Section attendance retrieved successfully", {
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
export const getAttendanceByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { academicYearId, month, year } = req.query;

  const where: any = { studentId: studentId as string };
  if (academicYearId) where.academicYearId = academicYearId as string;

  // Filter by Month/Year if provided
  if (month && year) {
    const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
    const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);
    where.date = {
      gte: startDate,
      lte: endDate
    };
  }

  const attendance = await prisma.studentAttendance.findMany({
    where,
    orderBy: { date: 'desc' }
  });

  return SuccessResponse(res, "Student attendance retrieved successfully", attendance);
});

/**
 * @route   PUT /api/student/attendance/:id
 * @desc    Update specific attendance record
 * @access  Admin/Teacher
 */
export const updateAttendance = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateAttendanceSchema.parse(req.body);

  const existing = await prisma.studentAttendance.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Attendance record not found", statusCode.Not_Found);

  const update = await prisma.studentAttendance.update({
    where: { id: id as string },
    data: validatedData
  });

  return SuccessResponse(res, "Attendance updated successfully", update);
});
