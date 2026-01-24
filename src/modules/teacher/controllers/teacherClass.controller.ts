import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  assignTeacherClassSchema,
  updateTeacherClassSchema,
} from "../validation/teacherClass.validation";

/**
 * @route   POST /api/teacher/class-assignment
 * @desc    Assign a teacher to a class/section (Class Teacher or Subject Teacher)
 * @access  Admin/School
 */
export const assignTeacherToClass = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = assignTeacherClassSchema.parse(req.body);

  // 1. Fetch all related entities to validate existence and school consistency
  const teacher = await prisma.teacher.findUnique({ where: { id: validatedData.teacherId } });
  if (!teacher) throw new ErrorResponse("Teacher not found", statusCode.Not_Found);

  const section = await prisma.section.findUnique({ where: { id: validatedData.sectionId } });
  if (!section) throw new ErrorResponse("Section not found", statusCode.Not_Found);

  const academicYear = await prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
  if (!academicYear) throw new ErrorResponse("Academic Year not found", statusCode.Not_Found);

  let subject = null;
  if (validatedData.subjectId) {
    subject = await prisma.subject.findUnique({ where: { id: validatedData.subjectId } });
    if (!subject) throw new ErrorResponse("Subject not found", statusCode.Not_Found);
  }

  // 2. Validate School Consistency
  const schoolId = teacher.schoolId;
  if (section.schoolId !== schoolId || academicYear.schoolId !== schoolId) {
    throw new ErrorResponse("All entities must belong to the same school", statusCode.Bad_Request);
  }
  if (subject && subject.schoolId !== schoolId) {
    throw new ErrorResponse("Subject must belong to the same school", statusCode.Bad_Request);
  }

  // 3. Unique Class Teacher Validation
  // If trying to set as Class Teacher, check if one already exists for this section & year
  if (validatedData.isClassTeacher) {
    const existingClassTeacher = await prisma.teacherClassAssignment.findFirst({
      where: {
        sectionId: validatedData.sectionId,
        academicYearId: validatedData.academicYearId,
        isClassTeacher: true
      }
    });

    if (existingClassTeacher) {
      throw new ErrorResponse(
        "This section already has a class teacher for the selected academic year",
        statusCode.Conflict
      );
    }
  }

  // 4. Duplicate Assignment Check
  const existingAssignment = await prisma.teacherClassAssignment.findFirst({
    where: {
      teacherId: validatedData.teacherId,
      sectionId: validatedData.sectionId,
      academicYearId: validatedData.academicYearId,
      subjectId: validatedData.subjectId || null // Explicitly handle undefined -> null
    }
  });

  if (existingAssignment) {
    throw new ErrorResponse(
      "This assignment already exists for this teacher, section, and subject",
      statusCode.Conflict
    );
  }

  // 5. Create Assignment
  const assignment = await prisma.teacherClassAssignment.create({
    data: {
      teacherId: validatedData.teacherId,
      sectionId: validatedData.sectionId,
      academicYearId: validatedData.academicYearId,
      subjectId: validatedData.subjectId || null,
      isClassTeacher: validatedData.isClassTeacher ?? false
    },
    include: {
      teacher: {
        select: { id: true, firstName: true, lastName: true, employeeId: true }
      },
      section: {
        include: {
          class: { select: { id: true, name: true, grade: true } }
        }
      },
      academicYear: { select: { id: true, name: true } },
      // cannot include subject if it's null in DB, but prisma handles relations well usually.
      // However, we can't conditionally include easily in the result type without casting. 
      // We'll trust Prisma to return null for the relation if ID is null.
    } as any // simple cast to avoid complex conditional type checking for now
  });

  // Re-fetch to get subject if it exists (Prisma include works fine even if null)
  // Or just rely on separate queries if needed, but include is better.
  // Actually, let's refine the include to be safe.
  const result = await prisma.teacherClassAssignment.findUnique({
    where: { id: assignment.id },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      section: { include: { class: { select: { id: true, name: true, grade: true } } } },
      academicYear: { select: { id: true, name: true } }
    }
  });

  return SuccessResponse(
    res,
    "Teacher assigned to class successfully",
    result,
    statusCode.Created
  );
});

/**
 * @route   GET /api/teacher/class-assignment/teacher/:teacherId
 * @desc    Get all class assignments for a teacher
 * @access  Admin/School
 */
export const getAssignmentsByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;
  const { academicYearId } = req.query;

  const where: any = { teacherId: teacherId as string };
  if (academicYearId) {
    where.academicYearId = academicYearId as string;
  }

  const result = await prisma.teacherClassAssignment.findMany({
    where,
    include: {
      section: {
        include: {
          class: { select: { id: true, name: true, grade: true } }
        }
      },
      academicYear: { select: { id: true, name: true } }
    }
  });

  return SuccessResponse(res, "Teacher assignments retrieved successfully", result);
});

/**
 * @route   DELETE /api/teacher/class-assignment/:id
 * @desc    Remove teacher from class assignment
 * @access  Admin/School
 */
export const removeTeacherFromClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const assignment = await prisma.teacherClassAssignment.findUnique({
    where: { id: id as string }
  });

  if (!assignment) {
    throw new ErrorResponse("Assignment not found", statusCode.Not_Found);
  }

  await prisma.teacherClassAssignment.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Teacher removed from class successfully", null);
});
