import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../config/cloudinary";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  onboardStudentSchema,
  updateStudentSchema,
  enrollStudentSchema,
} from "../validation/student.validation";

/**
 * @route   POST /api/student/onboard
 * @desc    Onboard a new student (with optional initial enrollment)
 * @access  Admin/School
 */
export const onboardStudent = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = onboardStudentSchema.parse(req.body);

  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id: validatedData.schoolId }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Check subscription limits (Max Students)
  const currentStudentCount = await prisma.student.count({
    where: { schoolId: validatedData.schoolId, isActive: true }
  });

  if (currentStudentCount >= school.maxStudents) {
    throw new ErrorResponse(
      `Student limit reached for this school. Max allowed: ${school.maxStudents}`,
      statusCode.Forbidden
    );
  }

  // Check duplicate admission number if provided
  if (validatedData.admissionNumber) {
    const existingStudent = await prisma.student.findUnique({
      where: {
        schoolId_admissionNumber: {
          schoolId: validatedData.schoolId,
          admissionNumber: validatedData.admissionNumber
        }
      }
    });

    if (existingStudent) {
      throw new ErrorResponse(
        `Student with admission number ${validatedData.admissionNumber} already exists`,
        statusCode.Conflict
      );
    }
  }

  // Handle profile picture upload
  let profilePictureData: { public_id: string; secure_url: string } | null = null;
  if (req.file) {
    try {
      profilePictureData = await uploadToCloudinary(req.file.buffer, "schools/students");
    } catch (uploadError) {
      throw new ErrorResponse(
        "Failed to upload profile picture",
        statusCode.Internal_Server_Error
      );
    }
  }

  // Prepare transaction operations
  // We use transaction to ensure both student and enrollment are created, or neither
  const studentData: any = {
    schoolId: validatedData.schoolId,
    admissionNumber: validatedData.admissionNumber || null,
    firstName: validatedData.firstName,
    lastName: validatedData.lastName,
    email: validatedData.email || null,
    phone: validatedData.phone || null,
    dateOfBirth: new Date(validatedData.dateOfBirth),
    gender: validatedData.gender,
    bloodGroup: validatedData.bloodGroup || null,
    address: validatedData.address,
    city: validatedData.city,
    state: validatedData.state,
    pincode: validatedData.pincode,
    admissionDate: new Date(validatedData.admissionDate),
    profilePicture: (profilePictureData || {}) as any,
    medicalInfo: validatedData.medicalInfo || null,
    status: validatedData.status || "ACTIVE",
    isActive: validatedData.isActive ?? true
  };

  // If enrollment data is present, create student with enrollment
  if (validatedData.enrollment) {
    // Verify Section and Academic Year exist
    const section = await prisma.section.findUnique({ where: { id: validatedData.enrollment.sectionId } });
    if (!section) throw new ErrorResponse("Section not found", statusCode.Not_Found);

    const academicYear = await prisma.academicYear.findUnique({ where: { id: validatedData.enrollment.academicYearId } });
    if (!academicYear) throw new ErrorResponse("Academic Year not found", statusCode.Not_Found);

    // Verify school consistency
    if (section.schoolId !== validatedData.schoolId || academicYear.schoolId !== validatedData.schoolId) {
      throw new ErrorResponse("Section and Academic Year must belong to the same school", statusCode.Bad_Request);
    }

    studentData.enrollments = {
      create: {
        academicYearId: validatedData.enrollment.academicYearId,
        sectionId: validatedData.enrollment.sectionId,
        enrollmentDate: validatedData.enrollment.enrollmentDate ? new Date(validatedData.enrollment.enrollmentDate) : new Date(validatedData.admissionDate),
        rollNumber: validatedData.enrollment.rollNumber || null
      }
    };
  }

  const student = await prisma.student.create({
    data: studentData,
    include: {
      enrollments: {
        include: {
          section: {
            include: { class: true }
          },
          academicYear: true
        }
      }
    }
  });

  return SuccessResponse(
    res,
    "Student onboarded successfully",
    student,
    statusCode.Created
  );
});

/**
 * @route   GET /api/student/school/:schoolId
 * @desc    Get all students for a school
 * @access  Admin/School
 */
export const getStudentsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive, status, search, classId, sectionId, academicYearId } = req.query;

  const where: any = { schoolId };

  if (isActive !== undefined) {
    where.isActive = isActive === "true";
  }

  if (status) {
    where.status = status;
  }

  if (search) {
    where.OR = [
      { firstName: { contains: search as string } },
      { lastName: { contains: search as string } },
      { admissionNumber: { contains: search as string } },
      { email: { contains: search as string } }
    ];
  }

  // Filter by enrollment details if provided
  if (classId || sectionId || academicYearId) {
    where.enrollments = {
      some: {
        ...(sectionId && { sectionId: sectionId as string }),
        ...(academicYearId && { academicYearId: academicYearId as string }),
        ...(classId && {
          section: {
            classId: classId as string
          }
        })
      }
    };
  }

  const students = await prisma.student.findMany({
    where,
    orderBy: { firstName: "asc" },
    include: {
      enrollments: {
        orderBy: { enrollmentDate: "desc" },
        take: 1, // Only get current/latest enrollment by default for list view usually
        include: {
          section: {
            include: { class: true }
          },
          academicYear: true
        }
      }
    }
  });

  return SuccessResponse(res, "Students retrieved successfully", students);
});

/**
 * @route   GET /api/student/:id
 * @desc    Get student by ID
 * @access  Admin/School
 */
export const getStudentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const student = await prisma.student.findUnique({
    where: { id: id as string },
    include: {
      school: {
        select: { id: true, name: true, code: true }
      },
      enrollments: {
        orderBy: { enrollmentDate: "desc" },
        include: {
          section: {
            include: { class: true }
          },
          academicYear: true
        }
      },
      parents: {
        include: {
          parent: true
        }
      }
    }
  });

  if (!student) {
    throw new ErrorResponse("Student not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Student retrieved successfully", student);
});

/**
 * @route   PUT /api/student/:id
 * @desc    Update student details
 * @access  Admin/School
 */
export const updateStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateStudentSchema.parse(req.body);

  const existingStudent = await prisma.student.findUnique({
    where: { id: id as string }
  });

  if (!existingStudent) {
    throw new ErrorResponse("Student not found", statusCode.Not_Found);
  }

  // Handle profile picture upload/update
  let profilePictureData: { public_id: string; secure_url: string } | null = null;
  if (req.file) {
    try {
      if (existingStudent.profilePicture && typeof existingStudent.profilePicture === 'object' && 'public_id' in existingStudent.profilePicture) {
        await deleteFromCloudinary((existingStudent.profilePicture as any).public_id);
      }
      profilePictureData = await uploadToCloudinary(req.file.buffer, "schools/students");
    } catch (uploadError) {
      throw new ErrorResponse("Failed to upload profile picture", statusCode.Internal_Server_Error);
    }
  }

  const updateData: any = { ...validatedData };
  if (validatedData.dateOfBirth) updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
  if (validatedData.admissionDate) updateData.admissionDate = new Date(validatedData.admissionDate);
  if (profilePictureData) updateData.profilePicture = profilePictureData;

  const updatedStudent = await prisma.student.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Student updated successfully", updatedStudent);
});

/**
 * @route   DELETE /api/student/:id
 * @desc    Delete student
 * @access  Admin
 */
export const deleteStudent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const student = await prisma.student.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: {
          enrollments: true,
          attendances: true
        }
      }
    }
  });

  if (!student) {
    throw new ErrorResponse("Student not found", statusCode.Not_Found);
  }

  // Check if student has attendance records (Enrollments are cascade deleted usually, but good to check)
  // Schema says Cascade delete for enrollments: onDelete: Cascade. 
  // However, attendances might be critical data we don't want to lose accidentally.
  const attendanceCount = (student as any)._count?.attendances ?? 0;
  
  if (attendanceCount > 0) {
    throw new ErrorResponse(
      "Cannot delete student with existing attendance records",
      statusCode.Bad_Request
    );
  }

  // Delete profile picture
  if (student.profilePicture && typeof student.profilePicture === 'object' && 'public_id' in student.profilePicture) {
    await deleteFromCloudinary((student.profilePicture as any).public_id);
  }

  await prisma.student.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Student deleted successfully", null);
});


