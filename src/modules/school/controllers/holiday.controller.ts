import type { Request, Response } from "express";
import { HolidayType } from "../../../generated/prisma/client";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createHolidaySchema,
  updateHolidaySchema,
  bulkCreateHolidaysSchema,
} from "../validation/holiday.validation";

/**
 * @route   POST /api/school/holiday
 * @desc    Create a new holiday for an academic year
 * @access  Admin/School
 */
export const createHoliday = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createHolidaySchema.parse(req.body);

  // Validate school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Validate academic year exists and belongs to school
  const academicYear = await prisma.academicYear.findUnique({
    where: { id: validatedData.academicYearId },
  });
  if (!academicYear) throw new ErrorResponse("Academic year not found", statusCode.Not_Found);
  if (academicYear.schoolId !== validatedData.schoolId) {
    throw new ErrorResponse("Academic year does not belong to this school", statusCode.Bad_Request);
  }

  // Validate date falls within academic year range
  const holidayDate = new Date(validatedData.date);
  const startDate = new Date(academicYear.startDate);
  const endDate = new Date(academicYear.endDate);

  if (holidayDate < startDate || holidayDate > endDate) {
    throw new ErrorResponse(
      `Holiday date must be within academic year range (${startDate.toISOString().split("T")[0]} to ${endDate.toISOString().split("T")[0]})`,
      statusCode.Bad_Request
    );
  }

  // Check for duplicate holiday on same date
  const existingHoliday = await prisma.holiday.findUnique({
    where: {
      schoolId_academicYearId_date: {
        schoolId: validatedData.schoolId,
        academicYearId: validatedData.academicYearId,
        date: holidayDate,
      },
    },
  });

  if (existingHoliday) {
    throw new ErrorResponse(
      `A holiday already exists on ${validatedData.date} for this academic year`,
      statusCode.Conflict
    );
  }

  // Create holiday
  const holiday = await prisma.holiday.create({
    data: {
      ...validatedData,
      date: holidayDate,
      isActive: validatedData.isActive ?? true,
    },
    include: {
      academicYear: {
        select: { id: true, name: true },
      },
    },
  });

  return SuccessResponse(res, "Holiday created successfully", holiday, statusCode.Created);
});

/**
 * @route   GET /api/school/holiday/academic-year/:academicYearId
 * @desc    Get all holidays for a specific academic year
 * @access  Admin/School
 */
export const getHolidaysByAcademicYear = asyncHandler(async (req: Request, res: Response) => {
  const { academicYearId } = req.params;
  const { type, month, startDate, endDate, isActive } = req.query;

  const where: any = { academicYearId: academicYearId as string };

  if (type) where.type = type as HolidayType;
  if (isActive !== undefined) where.isActive = isActive === "true";

  // Date range filters
  if (month && !startDate && !endDate) {
    const year = new Date().getFullYear();
    const monthNum = parseInt(month as string);
    where.date = {
      gte: new Date(year, monthNum - 1, 1),
      lte: new Date(year, monthNum, 0),
    };
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate as string);
    if (endDate) where.date.lte = new Date(endDate as string);
  }

  const holidays = await prisma.holiday.findMany({
    where,
    include: {
      academicYear: {
        select: { id: true, name: true },
      },
    },
    orderBy: { date: "asc" },
  });

  return SuccessResponse(res, "Holidays retrieved successfully", holidays);
});

/**
 * @route   GET /api/school/holiday/school/:schoolId/current
 * @desc    Get current academic year holidays for a school
 * @access  Admin/School
 */
export const getCurrentYearHolidays = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;

  // Get current academic year
  const currentAcademicYear = await prisma.academicYear.findFirst({
    where: {
      schoolId: schoolId as string,
      isCurrent: true,
    },
  });

  if (!currentAcademicYear) {
    throw new ErrorResponse("No current academic year found for this school", statusCode.Not_Found);
  }

  const holidays = await prisma.holiday.findMany({
    where: {
      academicYearId: currentAcademicYear.id,
      isActive: true,
    },
    include: {
      academicYear: {
        select: { id: true, name: true },
      },
    },
    orderBy: { date: "asc" },
  });

  return SuccessResponse(res, "Current year holidays retrieved successfully", {
    academicYear: currentAcademicYear,
    holidays,
  });
});

/**
 * @route   GET /api/school/holiday/check/:academicYearId/:date
 * @desc    Check if a specific date is a holiday
 * @access  Admin/School
 */
export const checkHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { academicYearId, date } = req.params;

  const holidayDate = new Date(date as string);
  const holiday = await prisma.holiday.findFirst({
    where: {
      academicYearId: academicYearId as string,
      date: holidayDate,
      isActive: true,
    },
    include: {
      academicYear: {
        select: { id: true, name: true },
      },
    },
  });

  return SuccessResponse(res, holiday ? "Date is a holiday" : "Date is not a holiday", {
    isHoliday: !!holiday,
    holiday: holiday || null,
  });
});

/**
 * @route   GET /api/school/holiday/:id
 * @desc    Get holiday by ID
 * @access  Admin/School
 */
export const getHolidayById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const holiday = await prisma.holiday.findUnique({
    where: { id: id as string },
    include: {
      academicYear: {
        select: { id: true, name: true },
      },
    },
  });

  if (!holiday) throw new ErrorResponse("Holiday not found", statusCode.Not_Found);

  return SuccessResponse(res, "Holiday retrieved successfully", holiday);
});

/**
 * @route   PUT /api/school/holiday/:id
 * @desc    Update holiday
 * @access  Admin/School
 */
export const updateHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateHolidaySchema.parse(req.body);

  const existingHoliday = await prisma.holiday.findUnique({ where: { id: id as string } });
  if (!existingHoliday) throw new ErrorResponse("Holiday not found", statusCode.Not_Found);

  const holiday = await prisma.holiday.update({
    where: { id: id as string },
    data: validatedData,
    include: {
      academicYear: {
        select: { id: true, name: true },
      },
    },
  });

  return SuccessResponse(res, "Holiday updated successfully", holiday);
});

/**
 * @route   DELETE /api/school/holiday/:id
 * @desc    Delete holiday
 * @access  Admin
 */
export const deleteHoliday = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const holiday = await prisma.holiday.findUnique({ where: { id: id as string } });
  if (!holiday) throw new ErrorResponse("Holiday not found", statusCode.Not_Found);

  await prisma.holiday.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Holiday deleted successfully", null);
});

/**
 * @route   POST /api/school/holiday/bulk
 * @desc    Bulk create holidays for an academic year
 * @access  Admin/School
 */
export const bulkCreateHolidays = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkCreateHolidaysSchema.parse(req.body);

  // Validate school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Validate academic year exists and belongs to school
  const academicYear = await prisma.academicYear.findUnique({
    where: { id: validatedData.academicYearId },
  });
  if (!academicYear) throw new ErrorResponse("Academic year not found", statusCode.Not_Found);
  if (academicYear.schoolId !== validatedData.schoolId) {
    throw new ErrorResponse("Academic year does not belong to this school", statusCode.Bad_Request);
  }

  const startDate = new Date(academicYear.startDate);
  const endDate = new Date(academicYear.endDate);

  // Validate all dates and check for duplicates
  const holidayDates: Date[] = [];
  const errors: string[] = [];

  for (const holiday of validatedData.holidays) {
    const holidayDate = new Date(holiday.date);

    // Check if date is within academic year range
    if (holidayDate < startDate || holidayDate > endDate) {
      errors.push(`${holiday.name} (${holiday.date}) is outside academic year range`);
      continue;
    }

    // Check for duplicate dates in request
    if (holidayDates.some((d) => d.getTime() === holidayDate.getTime())) {
      errors.push(`Duplicate date in request: ${holiday.date}`);
      continue;
    }

    holidayDates.push(holidayDate);
  }

  if (errors.length > 0) {
    throw new ErrorResponse(`Validation errors: ${errors.join(", ")}`, statusCode.Bad_Request);
  }

  // Check for existing holidays
  const existingHolidays = await prisma.holiday.findMany({
    where: {
      schoolId: validatedData.schoolId,
      academicYearId: validatedData.academicYearId,
      date: {
        in: holidayDates,
      },
    },
  });

  if (existingHolidays.length > 0) {
    const existingDates = existingHolidays.map((h) => h.date.toISOString().split("T")[0]).join(", ");
    throw new ErrorResponse(
      `Holidays already exist for the following dates: ${existingDates}`,
      statusCode.Conflict
    );
  }

  // Create all holidays
  const createData = validatedData.holidays.map((holiday, index) => ({
    schoolId: validatedData.schoolId,
    academicYearId: validatedData.academicYearId,
    name: holiday.name,
    date: holidayDates[index]!,
    type: holiday.type,
    description: holiday.description || null,
    isActive: true,
  }));

  await prisma.holiday.createMany({
    data: createData,
  });

  return SuccessResponse(
    res,
    `${createData.length} holidays created successfully`,
    { count: createData.length },
    statusCode.Created
  );
});


