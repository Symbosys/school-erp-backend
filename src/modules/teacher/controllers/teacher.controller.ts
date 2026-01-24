import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { uploadToCloudinary, deleteFromCloudinary } from "../../../config/cloudinary";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  onboardTeacherSchema,
  updateTeacherSchema,
} from "../validation/teacher.validation";

/**
 * @route   POST /api/teacher/onboard
 * @desc    Onboard a new teacher
 * @access  Admin/School
 */
export const onboardTeacher = asyncHandler(async (req: Request, res: Response) => {
  // Parse body (multipart/form-data can treat numbers as strings, so we might need manual parsing if not handled by zod with coercing)
  // The schema handles experience transformation from string to number if needed
  const validatedData = onboardTeacherSchema.parse(req.body);

  // Check if school exists
  const school = await prisma.school.findUnique({
    where: { id: validatedData.schoolId }
  });

  if (!school) {
    throw new ErrorResponse("School not found", statusCode.Not_Found);
  }

  // Check subscription limits (Max Teachers)
  const currentTeacherCount = await prisma.teacher.count({
    where: { schoolId: validatedData.schoolId, isActive: true }
  });

  if (currentTeacherCount >= school.maxTeachers) {
    throw new ErrorResponse(
      `Teacher limit reached for this school. Max allowed: ${school.maxTeachers}`,
      statusCode.Forbidden
    );
  }

  // Check if teacher with same email already exists
  const existingTeacherByEmail = await prisma.teacher.findUnique({
    where: { email: validatedData.email }
  });

  if (existingTeacherByEmail) {
    throw new ErrorResponse("Teacher with this email already exists", statusCode.Conflict);
  }

  // Check if teacher with same employeeId exists in the school
  const existingTeacherById = await prisma.teacher.findUnique({
    where: {
      schoolId_employeeId: {
        schoolId: validatedData.schoolId,
        employeeId: validatedData.employeeId
      }
    }
  });

  if (existingTeacherById) {
    throw new ErrorResponse(
      `Teacher with Employee ID ${validatedData.employeeId} already exists in this school`,
      statusCode.Conflict
    );
  }

  // Handle profile picture upload
  let profilePictureData: { public_id: string; secure_url: string } | null = null;
  if (req.file) {
    try {
      profilePictureData = await uploadToCloudinary(req.file.buffer, "schools/teachers");
    } catch (uploadError: any) {
      throw new ErrorResponse(
        uploadError.message as string,
        statusCode.Internal_Server_Error
      );
    }
  }

  // Create teacher
  const teacher = await prisma.teacher.create({
    data: {
      schoolId: validatedData.schoolId,
      employeeId: validatedData.employeeId,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      email: validatedData.email,
      phone: validatedData.phone,
      dateOfBirth: new Date(validatedData.dateOfBirth),
      gender: validatedData.gender,
      address: validatedData.address,
      city: validatedData.city,
      state: validatedData.state,
      pincode: validatedData.pincode,
      qualification: validatedData.qualification,
      specialization: validatedData.specialization || null,
      experience: validatedData.experience,
      joiningDate: new Date(validatedData.joiningDate),
      profilePicture: (profilePictureData || {}) as any,
      status: validatedData.status || "ACTIVE",
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(
    res,
    "Teacher onboarded successfully",
    teacher,
    statusCode.Created
  );
});

/**
 * @route   GET /api/teacher/school/:schoolId
 * @desc    Get all teachers for a school
 * @access  Admin/School
 */
export const getTeachersBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive, status, search } = req.query;

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
      { email: { contains: search as string } },
      { employeeId: { contains: search as string } }
    ];
  }

  const teachers = await prisma.teacher.findMany({
    where,
    orderBy: { firstName: "asc" },
    include: {
      _count: {
        select: {
          classAssignments: true,
          subjects: true
        }
      }
    }
  });

  return SuccessResponse(res, "Teachers retrieved successfully", teachers);
});

/**
 * @route   GET /api/teacher/:id
 * @desc    Get teacher by ID
 * @access  Admin/School
 */
export const getTeacherById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const teacher = await prisma.teacher.findUnique({
    where: { id: id as string },
    include: {
      school: {
        select: {
          id: true,
          name: true,
          code: true
        }
      },
      classAssignments: {
        include: {
          section: {
            include: {
              class: true
            }
          }
        }
      },
      subjects: {
        include: {
          subject: true
        }
      }
    }
  });

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", statusCode.Not_Found);
  }

  return SuccessResponse(res, "Teacher retrieved successfully", teacher);
});

/**
 * @route   PUT /api/teacher/:id
 * @desc    Update teacher details
 * @access  Admin/School
 */
export const updateTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTeacherSchema.parse(req.body);

  const existingTeacher = await prisma.teacher.findUnique({
    where: { id: id as string }
  });

  if (!existingTeacher) {
    throw new ErrorResponse("Teacher not found", statusCode.Not_Found);
  }

  // Handle profile picture upload/update
  let profilePictureData: { public_id: string; secure_url: string } | null = null;
  if (req.file) {
    try {
      // Delete old profile picture if exists
      if (existingTeacher.profilePicture && typeof existingTeacher.profilePicture === 'object' && 'public_id' in existingTeacher.profilePicture) {
        await deleteFromCloudinary((existingTeacher.profilePicture as any).public_id);
      }

      // Upload new profile picture
      profilePictureData = await uploadToCloudinary(req.file.buffer, "schools/teachers");
    } catch (uploadError) {
      throw new ErrorResponse(
        "Failed to upload profile picture",
        statusCode.Internal_Server_Error
      );
    }
  }

  const updateData: any = {};
  if (validatedData.firstName) updateData.firstName = validatedData.firstName;
  if (validatedData.lastName) updateData.lastName = validatedData.lastName;
  if (validatedData.email) updateData.email = validatedData.email;
  if (validatedData.phone) updateData.phone = validatedData.phone;
  if (validatedData.dateOfBirth) updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
  if (validatedData.gender) updateData.gender = validatedData.gender;
  if (validatedData.address) updateData.address = validatedData.address;
  if (validatedData.city) updateData.city = validatedData.city;
  if (validatedData.state) updateData.state = validatedData.state;
  if (validatedData.pincode) updateData.pincode = validatedData.pincode;
  if (validatedData.qualification) updateData.qualification = validatedData.qualification;
  if (validatedData.specialization !== undefined) updateData.specialization = validatedData.specialization;
  if (validatedData.experience !== undefined) updateData.experience = validatedData.experience;
  if (validatedData.joiningDate) updateData.joiningDate = new Date(validatedData.joiningDate);
  if (validatedData.status) updateData.status = validatedData.status;
  if (validatedData.isActive !== undefined) updateData.isActive = validatedData.isActive;
  if (profilePictureData) updateData.profilePicture = profilePictureData;

  const updatedTeacher = await prisma.teacher.update({
    where: { id: id as string },
    data: updateData
  });

  return SuccessResponse(res, "Teacher updated successfully", updatedTeacher);
});

/**
 * @route   DELETE /api/teacher/:id
 * @desc    Delete teacher
 * @access  Admin
 */
export const deleteTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const teacher = await prisma.teacher.findUnique({
    where: { id: id as string },
    include: {
      _count: {
        select: {
          classAssignments: true,
          subjects: true,
          attendances: true
        }
      }
    }
  });

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", statusCode.Not_Found);
  }

  // Check if teacher has associated data
  const hasData = 
    teacher._count.classAssignments > 0 ||
    teacher._count.subjects > 0 ||
    teacher._count.attendances > 0;

  if (hasData) {
    throw new ErrorResponse(
      "Cannot delete teacher with existing class assignments, subject assignments, or attendance records",
      statusCode.Bad_Request
    );
  }

  // Delete profile picture from Cloudinary
  if (teacher.profilePicture && typeof teacher.profilePicture === 'object' && 'public_id' in teacher.profilePicture) {
    await deleteFromCloudinary((teacher.profilePicture as any).public_id);
  }

  await prisma.teacher.delete({
    where: { id: id as string }
  });

  return SuccessResponse(res, "Teacher deleted successfully", null);
});

/**
 * @route   DELETE /api/teacher/:id/profile-picture
 * @desc    Delete teacher profile picture
 * @access  Admin/School
 */
export const deleteTeacherProfilePicture = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const teacher = await prisma.teacher.findUnique({
    where: { id: id as string }
  });

  if (!teacher) {
    throw new ErrorResponse("Teacher not found", statusCode.Not_Found);
  }

  if (!teacher.profilePicture) {
    throw new ErrorResponse("Teacher has no profile picture to delete", statusCode.Bad_Request);
  }

  // Delete from Cloudinary
  if (typeof teacher.profilePicture === 'object' && 'public_id' in teacher.profilePicture) {
    await deleteFromCloudinary((teacher.profilePicture as any).public_id);
  }

  // Update database
  const updatedTeacher = await prisma.teacher.update({
    where: { id: id as string },
    data: { profilePicture: {} as any }
  });

  return SuccessResponse(res, "Profile picture deleted successfully", updatedTeacher);
});
