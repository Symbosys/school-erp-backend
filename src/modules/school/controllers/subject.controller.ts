import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createSubjectSchema,
  updateSubjectSchema,
  assignSubjectToClassSchema,
  updateClassSubjectSchema,
} from "../validation/subject.validation";

/**
 * @route   POST /api/school/subject
 * @desc    Create a new subject
 * @access  Admin/School
 */
export const createSubject = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createSubjectSchema.parse(req.body);

  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id: validatedData.schoolId as string }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Check if subject with same code already exists for this school
  const existingSubject = await prisma.subject.findFirst({
    where: {
      schoolId: validatedData.schoolId,
      code: validatedData.code
    }
  });

  if (existingSubject) {
    throw new ErrorResponse(
      `Subject with code ${validatedData.code} already exists for this school`,
      statusCode.Conflict
    );
  }

  // Create subject
  const subject = await prisma.subject.create({
    data: {
      schoolId: validatedData.schoolId,
      name: validatedData.name,
      code: validatedData.code,
      description: validatedData.description || null,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(
    res,
    "Subject created successfully",
    subject,
    statusCode.Created
  );
});

/**
 * @route   GET /api/school/subject/school/:schoolId
 * @desc    Get all subjects for a school
 * @access  Admin/School
 */
export const getSubjectsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive } = req.query;

  const where: any = { schoolId: schoolId as string };

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  const subjects = await prisma.subject.findMany({
    where,
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: {
          classSubjects: true,
          teacherSubjects: true
        }
      }
    }
  });

  return SuccessResponse(res, "Subjects retrieved successfully", subjects);
});

/**
 * @route   GET /api/school/subject/:id
 * @desc    Get subject by ID
 * @access  Admin/School
 */
export const getSubjectById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const subject = await prisma.subject.findUnique({
    where: { id: id as string },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      classSubjects: {
        include: {
          class: {
            select: {
              id: true,
              name: true,
              grade: true
            }
          }
        }
      },
      _count: {
        select: {
          classSubjects: true,
          teacherSubjects: true
        }
      }
    }
  });

  if (!subject) {
    throw new ErrorResponse("Subject not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Subject retrieved successfully", subject);
});

/**
 * @route   PUT /api/school/subject/:id
 * @desc    Update subject
 * @access  Admin/School
 */
export const updateSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateSubjectSchema.parse(req.body);

  const existingSubject = await prisma.subject.findUnique({
    where: { id: id as string }
  });

  if (!existingSubject) {
    throw new ErrorResponse("Subject not found", statusCode.Not_Found);
  }

  const updateData: any = {};
  if (validatedData.name) updateData.name = validatedData.name;
  if (validatedData.description !== undefined) updateData.description = validatedData.description;
  if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;

  const updatedSubject = await prisma.subject.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Subject updated successfully", updatedSubject);
});

/**
 * @route   DELETE /api/school/subject/:id
 * @desc    Delete subject
 * @access  Admin
 */
export const deleteSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const subject = await prisma.subject.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: {
          classSubjects: true,
          teacherSubjects: true
        }
      }
    }
  });

  if (!subject) {
    throw new ErrorResponse("Subject not found", statusCode.Not_Found);
  }

  // Check if subject has assignments
  const hasAssignments = 
    subject._count.classSubjects > 0 ||
    subject._count.teacherSubjects > 0;

  if (hasAssignments) {
    throw new ErrorResponse(
      "Cannot delete subject with existing class or teacher assignments",
      statusCode.Bad_Request
    );
  }

  await prisma.subject.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Subject deleted successfully", null);
});

/**
 * @route   POST /api/school/subject/assign-to-class
 * @desc    Assign subject to a class
 * @access  Admin/School
 */
export const assignSubjectToClass = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = assignSubjectToClassSchema.parse(req.body);

  // Check if class exists
  const classData = await prisma.class.findUnique({
    where: { id: validatedData.classId as string }
  });

  if (!classData) {
    throw new ErrorResponse("Class not found", statusCode.Not_Found);
  }

  // Check if subject exists
  const subject = await prisma.subject.findUnique({
    where: { id: validatedData.subjectId as string }
  });

  if (!subject) {
    throw new ErrorResponse("Subject not found", statusCode.Not_Found);
  }

  // Verify subject belongs to the same school as class
  if (subject.schoolId !== classData.schoolId) {
    throw new ErrorResponse("Subject and class must belong to the same school", statusCode.Bad_Request);
  }

  // Check if assignment already exists
  const existingAssignment = await prisma.classSubject.findFirst({
    where: {
      classId: validatedData.classId,
      subjectId: validatedData.subjectId
    }
  });

  if (existingAssignment) {
    throw new ErrorResponse(
      "This subject is already assigned to this class",
      statusCode.Conflict
    );
  }

  // Create assignment
  const classSubject = await prisma.classSubject.create({
    data: {
      classId: validatedData.classId,
      subjectId: validatedData.subjectId,
      isCompulsory: validatedData.isCompulsory ?? true
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          grade: true
        }
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });

  return SuccessResponse(
    res,
    "Subject assigned to class successfully",
    classSubject,
    statusCode.Created
  );
});

/**
 * @route   GET /api/school/subject/class/:classId
 * @desc    Get all subjects for a class
 * @access  Admin/School
 */
export const getSubjectsByClass = asyncHandler(async (req: Request, res: Response) => {
  const { classId } = req.params;

  const classSubjects = await prisma.classSubject.findMany({
    where: { classId: classId as string },
    include: {
      subject: true,
      class: {
        select: {
          id: true,
          name: true,
          grade: true
        }
      }
    },
    orderBy: {
      subject: {
        name: "asc"
      }
    }
  });

  return SuccessResponse(res, "Class subjects retrieved successfully", classSubjects);
});

/**
 * @route   PUT /api/school/subject/class-subject/:id
 * @desc    Update class subject assignment
 * @access  Admin/School
 */
export const updateClassSubject = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateClassSubjectSchema.parse(req.body);

  const existingAssignment = await prisma.classSubject.findUnique({
    where: { id: id as string }
  });

  if (!existingAssignment) {
    throw new ErrorResponse("Class subject assignment not found", statusCode.Not_Found);
  }

  const updatedAssignment = await prisma.classSubject.update({
    where: { id: id as string },
    data: {
      isCompulsory: validatedData.isCompulsory
    },
    include: {
      class: {
        select: {
          id: true,
          name: true,
          grade: true
        }
      },
      subject: {
        select: {
          id: true,
          name: true,
          code: true
        }
      }
    }
  });

  return SuccessResponse(res, "Class subject assignment updated successfully", updatedAssignment);
});

/**
 * @route   DELETE /api/school/subject/class-subject/:id
 * @desc    Remove subject from class
 * @access  Admin
 */
export const removeSubjectFromClass = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const classSubject = await prisma.classSubject.findUnique({
    where: { id: id as string }
  });

  if (!classSubject) {
    throw new ErrorResponse("Class subject assignment not found", statusCode.Not_Found);
  }

  await prisma.classSubject.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Subject removed from class successfully", null);
});
