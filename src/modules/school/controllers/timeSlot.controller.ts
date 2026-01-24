import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createTimeSlotSchema,
  updateTimeSlotSchema,
  bulkCreateTimeSlotsSchema,
} from "../validation/timeSlot.validation";

/**
 * @route   POST /api/school/time-slot
 * @desc    Create a new time slot for a school
 * @access  Admin/School
 */
export const createTimeSlot = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createTimeSlotSchema.parse(req.body);

  // Validate school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Validate start time is before end time
  if (validatedData.startTime >= validatedData.endTime) {
    throw new ErrorResponse("Start time must be before end time", statusCode.Bad_Request);
  }

  // Check for duplicate name
  const existing = await prisma.timeSlot.findUnique({
    where: {
      schoolId_name: {
        schoolId: validatedData.schoolId,
        name: validatedData.name,
      },
    },
  });

  if (existing) {
    throw new ErrorResponse(`Time slot "${validatedData.name}" already exists`, statusCode.Conflict);
  }

  // Create time slot
  const timeSlot = await prisma.timeSlot.create({
    data: {
      schoolId: validatedData.schoolId,
      name: validatedData.name,
      startTime: validatedData.startTime,
      endTime: validatedData.endTime,
      slotOrder: validatedData.slotOrder ?? 0,
      isBreak: validatedData.isBreak ?? false,
      isActive: true,
    },
  });

  return SuccessResponse(res, "Time slot created successfully", timeSlot, statusCode.Created);
});

/**
 * @route   GET /api/school/time-slot/school/:schoolId
 * @desc    Get all time slots for a school
 * @access  Admin/School
 */
export const getTimeSlotsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive, isBreak } = req.query;

  const where: any = { schoolId: schoolId as string };

  if (isActive !== undefined) where.isActive = isActive === "true";
  if (isBreak !== undefined) where.isBreak = isBreak === "true";

  const timeSlots = await prisma.timeSlot.findMany({
    where,
    orderBy: { slotOrder: "asc" },
  });

  return SuccessResponse(res, "Time slots retrieved successfully", timeSlots);
});

/**
 * @route   GET /api/school/time-slot/:id
 * @desc    Get time slot by ID
 * @access  Admin/School
 */
export const getTimeSlotById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const timeSlot = await prisma.timeSlot.findUnique({
    where: { id: id as string },
  });

  if (!timeSlot) throw new ErrorResponse("Time slot not found", statusCode.Not_Found);

  return SuccessResponse(res, "Time slot retrieved successfully", timeSlot);
});

/**
 * @route   PUT /api/school/time-slot/:id
 * @desc    Update time slot
 * @access  Admin/School
 */
export const updateTimeSlot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTimeSlotSchema.parse(req.body);

  const existingSlot = await prisma.timeSlot.findUnique({ where: { id: id as string } });
  if (!existingSlot) throw new ErrorResponse("Time slot not found", statusCode.Not_Found);

  // Validate time logic if both are being updated
  const startTime = validatedData.startTime ?? existingSlot.startTime;
  const endTime = validatedData.endTime ?? existingSlot.endTime;
  if (startTime >= endTime) {
    throw new ErrorResponse("Start time must be before end time", statusCode.Bad_Request);
  }

  // Check for duplicate name if name is being changed
  if (validatedData.name && validatedData.name !== existingSlot.name) {
    const duplicate = await prisma.timeSlot.findUnique({
      where: {
        schoolId_name: {
          schoolId: existingSlot.schoolId,
          name: validatedData.name,
        },
      },
    });
    if (duplicate) {
      throw new ErrorResponse(`Time slot "${validatedData.name}" already exists`, statusCode.Conflict);
    }
  }

  const timeSlot = await prisma.timeSlot.update({
    where: { id: id as string },
    data: validatedData,
  });

  return SuccessResponse(res, "Time slot updated successfully", timeSlot);
});

/**
 * @route   DELETE /api/school/time-slot/:id
 * @desc    Delete time slot
 * @access  Admin
 */
export const deleteTimeSlot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const timeSlot = await prisma.timeSlot.findUnique({ where: { id: id as string } });
  if (!timeSlot) throw new ErrorResponse("Time slot not found", statusCode.Not_Found);

  // Check if time slot is used in any timetable entries
  const usedInEntries = await prisma.timetableEntry.count({
    where: { timeSlotId: id as string },
  });

  if (usedInEntries > 0) {
    throw new ErrorResponse(
      `Cannot delete time slot. It is used in ${usedInEntries} timetable entries.`,
      statusCode.Conflict
    );
  }

  await prisma.timeSlot.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Time slot deleted successfully", null);
});

/**
 * @route   POST /api/school/time-slot/bulk
 * @desc    Bulk create time slots for a school
 * @access  Admin/School
 */
export const bulkCreateTimeSlots = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkCreateTimeSlotsSchema.parse(req.body);

  // Validate school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Validate all time slots
  const errors: string[] = [];
  const names = new Set<string>();

  for (const slot of validatedData.timeSlots) {
    if (slot.startTime >= slot.endTime) {
      errors.push(`${slot.name}: Start time must be before end time`);
    }
    if (names.has(slot.name)) {
      errors.push(`Duplicate name in request: ${slot.name}`);
    }
    names.add(slot.name);
  }

  if (errors.length > 0) {
    throw new ErrorResponse(`Validation errors: ${errors.join(", ")}`, statusCode.Bad_Request);
  }

  // Check for existing names
  const existingSlots = await prisma.timeSlot.findMany({
    where: {
      schoolId: validatedData.schoolId,
      name: { in: Array.from(names) },
    },
  });

  if (existingSlots.length > 0) {
    const existingNames = existingSlots.map((s) => s.name).join(", ");
    throw new ErrorResponse(`Time slots already exist: ${existingNames}`, statusCode.Conflict);
  }

  // Create all time slots
  const createData = validatedData.timeSlots.map((slot, index) => ({
    schoolId: validatedData.schoolId,
    name: slot.name,
    startTime: slot.startTime,
    endTime: slot.endTime,
    slotOrder: slot.slotOrder ?? index + 1,
    isBreak: slot.isBreak ?? false,
    isActive: true,
  }));

  await prisma.timeSlot.createMany({ data: createData });

  return SuccessResponse(
    res,
    `${createData.length} time slots created successfully`,
    { count: createData.length },
    statusCode.Created
  );
});
