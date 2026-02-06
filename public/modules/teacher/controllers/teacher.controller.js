"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteTeacherProfilePicture = exports.deleteTeacher = exports.updateTeacher = exports.getTeacherById = exports.getTeachersBySchool = exports.onboardTeacher = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const cloudinary_1 = require("../../../config/cloudinary");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const teacher_validation_1 = require("../validation/teacher.validation");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * @route   POST /api/teacher/onboard
 * @desc    Onboard a new teacher
 * @access  Admin/School
 */
exports.onboardTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    // Parse body (multipart/form-data can treat numbers as strings, so we might need manual parsing if not handled by zod with coercing)
    // The schema handles experience transformation from string to number if needed
    const validatedData = teacher_validation_1.onboardTeacherSchema.parse(req.body);
    // Check if school exists
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: validatedData.schoolId }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Check subscription limits (Max Teachers)
    const currentTeacherCount = await prisma_1.prisma.teacher.count({
        where: { schoolId: validatedData.schoolId, isActive: true }
    });
    if (currentTeacherCount >= school.maxTeachers) {
        throw new response_util_1.ErrorResponse(`Teacher limit reached for this school. Max allowed: ${school.maxTeachers}`, types_1.statusCode.Forbidden);
    }
    // Check if teacher with same email already exists
    const existingTeacherByEmail = await prisma_1.prisma.teacher.findUnique({
        where: { email: validatedData.email }
    });
    if (existingTeacherByEmail) {
        throw new response_util_1.ErrorResponse("Teacher with this email already exists", types_1.statusCode.Conflict);
    }
    // Check if teacher with same employeeId exists in the school
    const existingTeacherById = await prisma_1.prisma.teacher.findUnique({
        where: {
            schoolId_employeeId: {
                schoolId: validatedData.schoolId,
                employeeId: validatedData.employeeId
            }
        }
    });
    if (existingTeacherById) {
        throw new response_util_1.ErrorResponse(`Teacher with Employee ID ${validatedData.employeeId} already exists in this school`, types_1.statusCode.Conflict);
    }
    // Handle profile picture upload
    let profilePictureData = null;
    if (req.file) {
        try {
            profilePictureData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/teachers");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse(uploadError.message, types_1.statusCode.Internal_Server_Error);
        }
    }
    // Create teacher
    const teacher = await prisma_1.prisma.teacher.create({
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
            monthlySalary: validatedData.monthlySalary || 0.00,
            joiningDate: new Date(validatedData.joiningDate),
            profilePicture: (profilePictureData || {}),
            status: validatedData.status || "ACTIVE",
            isActive: validatedData.isActive ?? true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher onboarded successfully", teacher, types_1.statusCode.Created);
});
/**
 * @route   GET /api/teacher/school/:schoolId
 * @desc    Get all teachers for a school
 * @access  Admin/School
 */
exports.getTeachersBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { isActive, status, search } = req.query;
    const where = { schoolId };
    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }
    if (status) {
        where.status = status;
    }
    if (search) {
        where.OR = [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
            { employeeId: { contains: search } }
        ];
    }
    const teachers = await prisma_1.prisma.teacher.findMany({
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
    return (0, response_util_1.SuccessResponse)(res, "Teachers retrieved successfully", teachers);
});
/**
 * @route   GET /api/teacher/:id
 * @desc    Get teacher by ID
 * @access  Admin/School
 */
exports.getTeacherById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const teacher = await prisma_1.prisma.teacher.findUnique({
        where: { id: id },
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
        throw new response_util_1.ErrorResponse("Teacher not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Teacher retrieved successfully", teacher);
});
/**
 * @route   PUT /api/teacher/:id
 * @desc    Update teacher details
 * @access  Admin/School
 */
exports.updateTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = teacher_validation_1.updateTeacherSchema.parse(req.body);
    const existingTeacher = await prisma_1.prisma.teacher.findUnique({
        where: { id: id }
    });
    if (!existingTeacher) {
        throw new response_util_1.ErrorResponse("Teacher not found", types_1.statusCode.Not_Found);
    }
    // Handle profile picture upload/update
    let profilePictureData = null;
    if (req.file) {
        try {
            // Delete old profile picture if exists
            if (existingTeacher.profilePicture && typeof existingTeacher.profilePicture === 'object' && 'public_id' in existingTeacher.profilePicture) {
                await (0, cloudinary_1.deleteFromCloudinary)(existingTeacher.profilePicture.public_id);
            }
            // Upload new profile picture
            profilePictureData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/teachers");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse("Failed to upload profile picture", types_1.statusCode.Internal_Server_Error);
        }
    }
    const updateData = {};
    if (validatedData.firstName)
        updateData.firstName = validatedData.firstName;
    if (validatedData.lastName)
        updateData.lastName = validatedData.lastName;
    if (validatedData.email)
        updateData.email = validatedData.email;
    if (validatedData.phone)
        updateData.phone = validatedData.phone;
    if (validatedData.dateOfBirth)
        updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
    if (validatedData.gender)
        updateData.gender = validatedData.gender;
    if (validatedData.address)
        updateData.address = validatedData.address;
    if (validatedData.city)
        updateData.city = validatedData.city;
    if (validatedData.state)
        updateData.state = validatedData.state;
    if (validatedData.pincode)
        updateData.pincode = validatedData.pincode;
    if (validatedData.qualification)
        updateData.qualification = validatedData.qualification;
    if (validatedData.specialization !== undefined)
        updateData.specialization = validatedData.specialization;
    if (validatedData.experience !== undefined)
        updateData.experience = validatedData.experience;
    if (validatedData.joiningDate)
        updateData.joiningDate = new Date(validatedData.joiningDate);
    if (validatedData.status)
        updateData.status = validatedData.status;
    if (validatedData.monthlySalary !== undefined)
        updateData.monthlySalary = validatedData.monthlySalary;
    if (validatedData.isActive !== undefined)
        updateData.isActive = validatedData.isActive;
    if (profilePictureData)
        updateData.profilePicture = profilePictureData;
    if (validatedData.password) {
        // hash password
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, 10);
        updateData.password = hashedPassword;
    }
    const updatedTeacher = await prisma_1.prisma.teacher.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher updated successfully", updatedTeacher);
});
/**
 * @route   DELETE /api/teacher/:id
 * @desc    Delete teacher
 * @access  Admin
 */
exports.deleteTeacher = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const teacher = await prisma_1.prisma.teacher.findUnique({
        where: { id: id },
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
        throw new response_util_1.ErrorResponse("Teacher not found", types_1.statusCode.Not_Found);
    }
    // Check if teacher has associated data
    const hasData = teacher._count.classAssignments > 0 ||
        teacher._count.subjects > 0 ||
        teacher._count.attendances > 0;
    if (hasData) {
        throw new response_util_1.ErrorResponse("Cannot delete teacher with existing class assignments, subject assignments, or attendance records", types_1.statusCode.Bad_Request);
    }
    // Delete profile picture from Cloudinary
    if (teacher.profilePicture && typeof teacher.profilePicture === 'object' && 'public_id' in teacher.profilePicture) {
        await (0, cloudinary_1.deleteFromCloudinary)(teacher.profilePicture.public_id);
    }
    await prisma_1.prisma.teacher.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Teacher deleted successfully", null);
});
/**
 * @route   DELETE /api/teacher/:id/profile-picture
 * @desc    Delete teacher profile picture
 * @access  Admin/School
 */
exports.deleteTeacherProfilePicture = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const teacher = await prisma_1.prisma.teacher.findUnique({
        where: { id: id }
    });
    if (!teacher) {
        throw new response_util_1.ErrorResponse("Teacher not found", types_1.statusCode.Not_Found);
    }
    if (!teacher.profilePicture) {
        throw new response_util_1.ErrorResponse("Teacher has no profile picture to delete", types_1.statusCode.Bad_Request);
    }
    // Delete from Cloudinary
    if (typeof teacher.profilePicture === 'object' && 'public_id' in teacher.profilePicture) {
        await (0, cloudinary_1.deleteFromCloudinary)(teacher.profilePicture.public_id);
    }
    // Update database
    const updatedTeacher = await prisma_1.prisma.teacher.update({
        where: { id: id },
        data: { profilePicture: {} }
    });
    return (0, response_util_1.SuccessResponse)(res, "Profile picture deleted successfully", updatedTeacher);
});
//# sourceMappingURL=teacher.controller.js.map