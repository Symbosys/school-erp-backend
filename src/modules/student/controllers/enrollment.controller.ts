import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createEnrollmentSchema,
  updateEnrollmentSchema,
} from "../validation/enrollment.validation";

/**
 * @route   POST /api/student/enrollment
 * @desc    Create a new enrollment (Enroll existing student to a class/year)
 * @access  Admin/School
 */
export const createEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createEnrollmentSchema.parse(req.body);

  // 1. Fetch Student, Section, AcademicYear
  const student = await prisma.student.findUnique({ where: { id: validatedData.studentId } });
  if (!student) throw new ErrorResponse("Student not found", statusCode.Not_Found);

  const section = await prisma.section.findUnique({ where: { id: validatedData.sectionId } });
  if (!section) throw new ErrorResponse("Section not found", statusCode.Not_Found);

  const academicYear = await prisma.academicYear.findUnique({ where: { id: validatedData.academicYearId } });
  if (!academicYear) throw new ErrorResponse("Academic Year not found", statusCode.Not_Found);

  // 2. Validate School Consistency
  const schoolId = student.schoolId;
  if (section.schoolId !== schoolId || academicYear.schoolId !== schoolId) {
    throw new ErrorResponse("Student, Section, and Academic Year must belong to the same school", statusCode.Bad_Request);
  }

  // 3. Check Duplicate Enrollment for same Academic Year
  const existingEnrollment = await prisma.studentEnrollment.findUnique({
    where: {
      studentId_academicYearId: {
        studentId: validatedData.studentId,
        academicYearId: validatedData.academicYearId
      }
    }
  });

  if (existingEnrollment) {
    throw new ErrorResponse("Student is already enrolled in this academic year", statusCode.Conflict);
  }

  // 4. Create Enrollment
  const enrollment = await prisma.studentEnrollment.create({
    data: {
      studentId: validatedData.studentId,
      academicYearId: validatedData.academicYearId,
      sectionId: validatedData.sectionId,
      enrollmentDate: new Date(validatedData.enrollmentDate),
      rollNumber: validatedData.rollNumber || null,
      remarks: validatedData.remarks || null,
      isPromoted: false
    },
    include: {
      section: {
        include: { class: true }
      },
      academicYear: true,
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true
        }
      }
    }
  });

  return SuccessResponse(res, "Student enrolled successfully", enrollment, statusCode.Created);
});

/**
 * @route   GET /api/student/enrollment/student/:studentId
 * @desc    Get all enrollments for a student (History)
 * @access  Admin/School
 */
export const getEnrollmentsByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const enrollments = await prisma.studentEnrollment.findMany({
    where: { studentId: studentId as string },
    orderBy: { enrollmentDate: "desc" },
    include: {
      section: {
        include: { class: true }
      },
      academicYear: true
    }
  });

  return SuccessResponse(res, "Student enrollments retrieved successfully", enrollments);
});

/**
 * @route   GET /api/student/enrollment/:id
 * @desc    Get enrollment by ID
 * @access  Admin/School
 */
export const getEnrollmentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: id as string },
    include: {
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          admissionNumber: true,
          profilePicture: true
        }
      },
      section: {
        include: { class: true }
      },
      academicYear: true
    }
  });

  if (!enrollment) {
    throw new ErrorResponse("Enrollment not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Enrollment retrieved successfully", enrollment);
});

/**
 * @route   PUT /api/student/enrollment/:id
 * @desc    Update enrollment details (e.g. change section, update roll number)
 * @access  Admin/School
 */
export const updateEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateEnrollmentSchema.parse(req.body);

  const existingEnrollment = await prisma.studentEnrollment.findUnique({
    where: { id: id as string }
  });

  if (!existingEnrollment) {
    throw new ErrorResponse("Enrollment not found", statusCode.Not_Found);
  }

  // If changing section, verify new section exists and belongs to same school
  if (validatedData.sectionId) {
    const section = await prisma.section.findUnique({ 
      where: { id: validatedData.sectionId },
      include: {
        school: { select: { id: true } }
      }
    });

    if (!section) throw new ErrorResponse("Section not found", statusCode.Not_Found);
    
    // We need to check if the section belongs to the same school as the student
    // Fetch student's schoolId via original enrollment
    const student = await prisma.student.findUnique({ where: { id: existingEnrollment.studentId } });
    if (student && student.schoolId !== section.schoolId) {
       throw new ErrorResponse("New section must belong to the same school", statusCode.Bad_Request);
    }
  }

  const updateData: any = {};
  if (validatedData.sectionId) updateData.sectionId = validatedData.sectionId;
  if (validatedData.enrollmentDate) updateData.enrollmentDate = new Date(validatedData.enrollmentDate);
  if (validatedData.rollNumber !== undefined) updateData.rollNumber = validatedData.rollNumber;
  if (validatedData.isPromoted !== undefined) updateData.isPromoted = validatedData.isPromoted;
  if (validatedData.remarks !== undefined) updateData.remarks = validatedData.remarks;

  const updatedEnrollment = await prisma.studentEnrollment.update({
    where: { id: id as string },
    data: updateData,
    include: {
      section: {
        include: { class: true }
      },
      academicYear: true
    }
  });

  return SuccessResponse(res, "Enrollment updated successfully", updatedEnrollment);
});

/**
 * @route   DELETE /api/student/enrollment/:id
 * @desc    Delete enrollment
 * @access  Admin
 */
export const deleteEnrollment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const enrollment = await prisma.studentEnrollment.findUnique({
    where: { id: id as string }
  });

  if (!enrollment) {
    throw new ErrorResponse("Enrollment not found", statusCode.Not_Found);
  }

  await prisma.studentEnrollment.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Enrollment deleted successfully", null);
});
