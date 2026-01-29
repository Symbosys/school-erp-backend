import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createTimetableSchema,
  createSectionOverrideSchema,
  updateTimetableSchema,
  addTimetableEntrySchema,
  updateTimetableEntrySchema,
  bulkAddEntriesSchema,
} from "../validation/timetable.validation";

/**
 * @route   POST /api/school/timetable
 * @desc    Create a class-level timetable (Default for all sections)
 * @access  Admin/School
 */
export const createTimetable = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createTimetableSchema.parse(req.body);

  // Validate Class-Level Uniqueness
  const existingTimetable = await prisma.timetable.findFirst({
    where: {
      classId: validatedData.classId,
      academicYearId: validatedData.academicYearId,
      sectionId: null, // Ensure it's a class-level timetable
    },
  });

  if (existingTimetable) {
    throw new ErrorResponse(
      "A default timetable already exists for this class and academic year",
      statusCode.Conflict
    );
  }

  // Create Timetable with Entries
  const timetable = await prisma.timetable.create({
    data: {
      schoolId: validatedData.schoolId,
      academicYearId: validatedData.academicYearId,
      classId: validatedData.classId,
      sectionId: null, // Explicitly null for class default
      name: validatedData.name,
      effectiveFrom: new Date(validatedData.effectiveFrom),
      effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : null,
      entries: validatedData.entries
        ? {
          create: validatedData.entries.map((entry) => ({
            timeSlotId: entry.timeSlotId,
            dayOfWeek: entry.dayOfWeek,
            subjectId: entry.subjectId,
            teacherId: entry.teacherId,
            roomNumber: entry.roomNumber,
          })),
        }
        : undefined,
    },
    include: {
      entries: true,
    },
  });

  return SuccessResponse(res, "Class timetable created successfully", timetable, statusCode.Created);
});

/**
 * @route   POST /api/school/timetable/override
 * @desc    Create a section-specific override timetable
 * @access  Admin/School
 */
export const createSectionOverride = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createSectionOverrideSchema.parse(req.body);

  // Validate Section Override Uniqueness
  const existingOverride = await prisma.timetable.findUnique({
    where: {
      classId_academicYearId_sectionId: {
        classId: validatedData.classId,
        academicYearId: validatedData.academicYearId,
        sectionId: validatedData.sectionId,
      },
    },
  });

  if (existingOverride) {
    throw new ErrorResponse(
      "An override timetable already exists for this section and academic year",
      statusCode.Conflict
    );
  }

  // Create Override Timetable
  const timetable = await prisma.timetable.create({
    data: {
      schoolId: validatedData.schoolId,
      academicYearId: validatedData.academicYearId,
      classId: validatedData.classId,
      sectionId: validatedData.sectionId,
      name: validatedData.name,
      effectiveFrom: new Date(validatedData.effectiveFrom),
      effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : null,
      entries: validatedData.entries
        ? {
          create: validatedData.entries.map((entry) => ({
            timeSlotId: entry.timeSlotId,
            dayOfWeek: entry.dayOfWeek,
            subjectId: entry.subjectId,
            teacherId: entry.teacherId,
            roomNumber: entry.roomNumber,
          })),
        }
        : undefined,
    },
    include: {
      entries: true,
    },
  });

  return SuccessResponse(res, "Section override timetable created successfully", timetable, statusCode.Created);
});

/**
 * @route   GET /api/school/timetable/class/:classId
 * @desc    Get class-level default timetable
 * @access  Admin/School
 */
export const getClassTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { academicYearId } = req.query;

  if (!academicYearId) throw new ErrorResponse("Academic Year ID is required", statusCode.Bad_Request);

  const timetable = await prisma.timetable.findFirst({
    where: {
      classId: classId as string,
      academicYearId: academicYearId as string,
      sectionId: null,
    },
    include: {
      entries: {
        include: {
          timeSlot: true,
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { timeSlot: { slotOrder: "asc" } }],
      },
    },
  });

  if (!timetable) throw new ErrorResponse("No default timetable found for this class", statusCode.Not_Found);

  return SuccessResponse(res, "Class timetable retrieved successfully", timetable);
});

/**
 * @route   GET /api/school/timetable/section/:sectionId
 * @desc    Get timetable for a section (Returns override if exists, else class default)
 * @access  Admin/School
 */
export const getSectionTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { sectionId } = req.params;
  const { academicYearId } = req.query;

  if (!academicYearId) throw new ErrorResponse("Academic Year ID is required", statusCode.Bad_Request);

  const section = await prisma.section.findUnique({
    where: { id: sectionId as string },
    select: { classId: true },
  });

  if (!section) throw new ErrorResponse("Section not found", statusCode.Not_Found);

  // Try to find section-specific override FIRST
  let timetable = await prisma.timetable.findUnique({
    where: {
      classId_academicYearId_sectionId: {
        classId: section.classId,
        academicYearId: academicYearId as string,
        sectionId: sectionId as string,
      },
    },
    include: {
      entries: {
        include: {
          timeSlot: true,
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { timeSlot: { slotOrder: "asc" } }],
      },
    },
  });

  let isOverride = true;

  // If no override, fetch class default
  if (!timetable) {
    timetable = await prisma.timetable.findFirst({
      where: {
        classId: section.classId,
        academicYearId: academicYearId as string,
        sectionId: null,
      },
      include: {
        entries: {
          include: {
            timeSlot: true,
            subject: { select: { id: true, name: true, code: true } },
            teacher: { select: { id: true, firstName: true, lastName: true } },
          },
          orderBy: [{ dayOfWeek: "asc" }, { timeSlot: { slotOrder: "asc" } }],
        },
      },
    });
    isOverride = false;
  }

  if (!timetable) throw new ErrorResponse("No timetable found for this section (neither override nor default)", statusCode.Not_Found);

  return SuccessResponse(res, "Timetable retrieved successfully", { ...timetable, isOverride });
});

/**
 * @route   GET /api/school/timetable/:id
 * @desc    Get timetable details by ID
 * @access  Admin/School
 */
export const getTimetableById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const timetable = await prisma.timetable.findUnique({
    where: { id: id as string },
    include: {
      entries: {
        include: {
          timeSlot: true,
          subject: { select: { id: true, name: true, code: true } },
          teacher: { select: { id: true, firstName: true, lastName: true } },
        },
        orderBy: [{ dayOfWeek: "asc" }, { timeSlot: { slotOrder: "asc" } }],
      },
    },
  });

  if (!timetable) throw new ErrorResponse("Timetable not found", statusCode.Not_Found);

  return SuccessResponse(res, "Timetable retrieved successfully", timetable);
});

/**
 * @route   GET /api/school/timetable/teacher/:teacherId
 * @desc    Get timetable entries for a specific teacher
 * @query   academicYearId (required)
 * @access  Teacher/Admin
 */
export const getTeacherTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const { academicYearId } = req.query;

  if (!academicYearId) throw new ErrorResponse("Academic Year ID is required", statusCode.Bad_Request);

  const entries = await prisma.timetableEntry.findMany({
    where: {
      teacherId: teacherId as string,
      timetable: {
        academicYearId: academicYearId as string,
        isActive: true,
      },
    },
    include: {
      timeSlot: true,
      subject: { select: { id: true, name: true, code: true } },
      timetable: {
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: [
      { dayOfWeek: "asc" },
      { timeSlot: { slotOrder: "asc" } },
    ],
  });

  return SuccessResponse(res, "Teacher timetable retrieved successfully", entries);
});


/**
 * @route   PUT /api/school/timetable/:id
 * @desc    Update timetable metadata
 * @access  Admin/School
 */
export const updateTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTimetableSchema.parse(req.body);

  const timetable = await prisma.timetable.update({
    where: { id: id as string },
    data: {
      name: validatedData.name,
      effectiveFrom: validatedData.effectiveFrom ? new Date(validatedData.effectiveFrom) : undefined,
      effectiveTo: validatedData.effectiveTo ? new Date(validatedData.effectiveTo) : undefined,
      isActive: validatedData.isActive,
    },
  });

  return SuccessResponse(res, "Timetable updated successfully", timetable);
});

/**
 * @route   DELETE /api/school/timetable/:id
 * @desc    Delete timetable
 * @access  Admin
 */
export const deleteTimetable = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.timetable.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Timetable deleted successfully", null);
});

// ==========================================
// TIMETABLE ENTRY APIs
// ==========================================

/**
 * @route   POST /api/school/timetable/entry
 * @desc    Add a single entry to a timetable
 * @access  Admin/School
 */
export const addTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = addTimetableEntrySchema.parse(req.body);

  // Check for conflicts
  const existingEntry = await prisma.timetableEntry.findUnique({
    where: {
      timetableId_timeSlotId_dayOfWeek: {
        timetableId: validatedData.timetableId,
        timeSlotId: validatedData.timeSlotId,
        dayOfWeek: validatedData.dayOfWeek,
      },
    },
  });

  if (existingEntry) {
    throw new ErrorResponse("An entry already exists for this slot and day", statusCode.Conflict);
  }

  const entry = await prisma.timetableEntry.create({
    data: validatedData,
  });

  return SuccessResponse(res, "Timetable entry added successfully", entry, statusCode.Created);
});

/**
 * @route   PUT /api/school/timetable/entry/:id
 * @desc    Update timetable entry
 * @access  Admin/School
 */
export const updateTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTimetableEntrySchema.parse(req.body);

  const entry = await prisma.timetableEntry.update({
    where: { id: id as string },
    data: validatedData,
  });

  return SuccessResponse(res, "Timetable entry updated successfully", entry);
});

/**
 * @route   DELETE /api/school/timetable/entry/:id
 * @desc    Delete timetable entry
 * @access  Admin/School
 */
export const deleteTimetableEntry = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  await prisma.timetableEntry.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Timetable entry deleted successfully", null);
});
