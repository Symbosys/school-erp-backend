"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteStudent = exports.updateStudent = exports.getStudentById = exports.getStudentsBySchool = exports.onboardStudent = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const cloudinary_1 = require("../../../config/cloudinary");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const student_validation_1 = require("../validation/student.validation");
const studentFee_controller_1 = require("../../fee/controllers/studentFee.controller");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * @route   POST /api/student/onboard
 * @desc    Onboard a new student (with optional initial enrollment)
 * @access  Admin/School
 */
exports.onboardStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = student_validation_1.onboardStudentSchema.parse(req.body);
    // Check if school exists
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: validatedData.schoolId }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Check subscription limits (Max Students)
    const currentStudentCount = await prisma_1.prisma.student.count({
        where: { schoolId: validatedData.schoolId, isActive: true }
    });
    if (currentStudentCount >= school.maxStudents) {
        throw new response_util_1.ErrorResponse(`Student limit reached for this school. Max allowed: ${school.maxStudents}`, types_1.statusCode.Forbidden);
    }
    // Check duplicate admission number if provided
    if (validatedData.admissionNumber) {
        const existingStudent = await prisma_1.prisma.student.findUnique({
            where: {
                schoolId_admissionNumber: {
                    schoolId: validatedData.schoolId,
                    admissionNumber: validatedData.admissionNumber
                }
            }
        });
        if (existingStudent) {
            throw new response_util_1.ErrorResponse(`Student with admission number ${validatedData.admissionNumber} already exists`, types_1.statusCode.Conflict);
        }
    }
    // Handle profile picture upload
    let profilePictureData = null;
    if (req.file) {
        try {
            profilePictureData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/students");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse("Failed to upload profile picture", types_1.statusCode.Internal_Server_Error);
        }
    }
    // Prepare transaction operations
    // We use transaction to ensure both student and enrollment are created, or neither
    const studentData = {
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
        profilePicture: (profilePictureData || {}),
        medicalInfo: validatedData.medicalInfo || null,
        status: validatedData.status || "ACTIVE",
        isActive: validatedData.isActive ?? true
    };
    // Prepare variables for Fee Assignment
    let feeStructure = null;
    // If enrollment data is present, create student with enrollment
    if (validatedData.enrollment) {
        // Verify Section and Academic Year exist
        const section = await prisma_1.prisma.section.findUnique({
            where: { id: validatedData.enrollment.sectionId },
            include: { class: true }
        });
        if (!section)
            throw new response_util_1.ErrorResponse("Section not found", types_1.statusCode.Not_Found);
        const academicYear = await prisma_1.prisma.academicYear.findUnique({ where: { id: validatedData.enrollment.academicYearId } });
        if (!academicYear)
            throw new response_util_1.ErrorResponse("Academic Year not found", types_1.statusCode.Not_Found);
        // Verify school consistency
        if (section.schoolId !== validatedData.schoolId || academicYear.schoolId !== validatedData.schoolId) {
            throw new response_util_1.ErrorResponse("Section and Academic Year must belong to the same school", types_1.statusCode.Bad_Request);
        }
        // CHECK FEE STRUCTURE
        feeStructure = await prisma_1.prisma.feeStructure.findFirst({
            where: {
                schoolId: validatedData.schoolId,
                academicYearId: validatedData.enrollment.academicYearId,
                classId: section.classId,
                isActive: true
            },
            include: { items: true, academicYear: true } // Include items for generation
        });
        if (!feeStructure) {
            throw new response_util_1.ErrorResponse(`No active fee structure found for Class ${section.class.name}. Please create a fee structure before enrolling students.`, types_1.statusCode.Bad_Request);
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
    // Handle Parent Linking/Creation
    if (validatedData.parent) {
        if (validatedData.parent.mode === "EXISTING" && validatedData.parent.existingParentId) {
            studentData.parents = {
                create: {
                    parentId: validatedData.parent.existingParentId,
                    relationship: validatedData.parent.relationship,
                    isPrimary: validatedData.parent.isPrimary
                }
            };
        }
        else if (validatedData.parent.mode === "NEW") {
            studentData.parents = {
                create: {
                    relationship: validatedData.parent.relationship,
                    isPrimary: validatedData.parent.isPrimary,
                    parent: {
                        create: {
                            schoolId: validatedData.schoolId,
                            firstName: validatedData.parent.firstName, // validated by refine
                            lastName: validatedData.parent.lastName,
                            email: validatedData.parent.email,
                            phone: validatedData.parent.phone,
                            occupation: validatedData.parent.occupation,
                            address: validatedData.parent.address || validatedData.address,
                            city: validatedData.parent.city || validatedData.city,
                            state: validatedData.parent.state || validatedData.state,
                            pincode: validatedData.parent.pincode || validatedData.pincode,
                        }
                    }
                }
            };
        }
    }
    const student = await prisma_1.prisma.student.create({
        data: studentData,
        include: {
            enrollments: {
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
    // Assign Fee Structure if applicable
    if (validatedData.enrollment && feeStructure) {
        // Create Student Fee Record
        // Assumption: New student has no specific fee discounts yet.
        const totalAmount = Number(feeStructure.totalAmount);
        const studentFee = await prisma_1.prisma.studentFee.create({
            data: {
                studentId: student.id,
                feeStructureId: feeStructure.id,
                academicYearId: validatedData.enrollment.academicYearId,
                totalAmount: totalAmount,
                discountAmount: 0,
                paidAmount: 0,
                balanceAmount: totalAmount,
                status: "PENDING"
            }
        });
        // Generate Installments
        await (0, studentFee_controller_1.generateMonthlyDetails)(studentFee.id, feeStructure, feeStructure.academicYear);
    }
    return (0, response_util_1.SuccessResponse)(res, "Student onboarded successfully", student, types_1.statusCode.Created);
});
/**
 * @route   GET /api/student/school/:schoolId
 * @desc    Get all students for a school
 * @access  Admin/School
 */
exports.getStudentsBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { page = 1, limit = 10, isActive, status, search, classId, sectionId, academicYearId } = req.query;
    const where = { schoolId };
    const skip = (Number(page) - 1) * Number(limit);
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
            { admissionNumber: { contains: search } },
            { email: { contains: search } }
        ];
    }
    // Filter by enrollment details if provided
    if (classId || sectionId || academicYearId) {
        where.enrollments = {
            some: {
                ...(sectionId && { sectionId: sectionId }),
                ...(academicYearId && { academicYearId: academicYearId }),
                ...(classId && {
                    section: {
                        classId: classId
                    }
                })
            }
        };
    }
    const [students, totalStudents] = await Promise.all([
        prisma_1.prisma.student.findMany({
            where,
            orderBy: { firstName: "asc" },
            skip,
            take: Number(limit),
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
        }),
        prisma_1.prisma.student.count({ where })
    ]);
    return (0, response_util_1.SuccessResponse)(res, "Students retrieved successfully", {
        students,
        pagination: {
            total: totalStudents,
            currentPage: Number(page),
            totalPages: Math.ceil(totalStudents / Number(limit)),
            limit: Number(limit),
            count: students.length
        }
    });
});
/**
 * @route   GET /api/student/:id
 * @desc    Get student by ID
 * @access  Admin/School
 */
exports.getStudentById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const student = await prisma_1.prisma.student.findUnique({
        where: { id: id },
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
        throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "Student retrieved successfully", student);
});
/**
 * @route   PUT /api/student/:id
 * @desc    Update student details
 * @access  Admin/School
 */
exports.updateStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = student_validation_1.updateStudentSchema.parse(req.body);
    const existingStudent = await prisma_1.prisma.student.findUnique({
        where: { id: id }
    });
    if (!existingStudent) {
        throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    }
    // Handle profile picture upload/update
    let profilePictureData = null;
    if (req.file) {
        try {
            if (existingStudent.profilePicture && typeof existingStudent.profilePicture === 'object' && 'public_id' in existingStudent.profilePicture) {
                await (0, cloudinary_1.deleteFromCloudinary)(existingStudent.profilePicture.public_id);
            }
            profilePictureData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/students");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse("Failed to upload profile picture", types_1.statusCode.Internal_Server_Error);
        }
    }
    const updateData = { ...validatedData };
    if (validatedData.dateOfBirth)
        updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
    if (validatedData.admissionDate)
        updateData.admissionDate = new Date(validatedData.admissionDate);
    if (profilePictureData)
        updateData.profilePicture = profilePictureData;
    if (validatedData.password) {
        // hash password
        updateData.password = await bcryptjs_1.default.hash(validatedData.password, 10);
    }
    const updatedStudent = await prisma_1.prisma.student.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Student updated successfully", updatedStudent);
});
/**
 * @route   DELETE /api/student/:id
 * @desc    Delete student
 * @access  Admin
 */
exports.deleteStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const student = await prisma_1.prisma.student.findUnique({
        where: { id: id },
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
        throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    }
    // Check if student has attendance records (Enrollments are cascade deleted usually, but good to check)
    // Schema says Cascade delete for enrollments: onDelete: Cascade. 
    // However, attendances might be critical data we don't want to lose accidentally.
    const attendanceCount = student._count?.attendances ?? 0;
    if (attendanceCount > 0) {
        throw new response_util_1.ErrorResponse("Cannot delete student with existing attendance records", types_1.statusCode.Bad_Request);
    }
    // Delete profile picture
    if (student.profilePicture && typeof student.profilePicture === 'object' && 'public_id' in student.profilePicture) {
        await (0, cloudinary_1.deleteFromCloudinary)(student.profilePicture.public_id);
    }
    await prisma_1.prisma.student.delete({
        where: { id: id }
    });
    return (0, response_util_1.SuccessResponse)(res, "Student deleted successfully", null);
});
//# sourceMappingURL=student.controller.js.map