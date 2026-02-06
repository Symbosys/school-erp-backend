"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSchoolLogo = exports.updateSubscription = exports.toggleSchoolStatus = exports.updateSchool = exports.getAllSchools = exports.getSchoolById = exports.onboardSchool = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const cloudinary_1 = require("../../../config/cloudinary");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const school_validation_1 = require("../validation/school.validation");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
/**
 * @route   POST /api/school/onboard
 * @desc    Onboard a new school to the platform
 * @access  Admin
 */
exports.onboardSchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    // Validate request body with Zod
    const validatedData = school_validation_1.onboardSchoolSchema.parse(req.body);
    // Check if school code or email already exists
    const existingSchool = await prisma_1.prisma.school.findFirst({
        where: {
            OR: [
                { code: validatedData.code },
                { email: validatedData.email }
            ]
        }
    });
    if (existingSchool) {
        throw new response_util_1.ErrorResponse(existingSchool.code === validatedData.code
            ? "School with this code already exists"
            : "School with this email already exists", types_1.statusCode.Conflict);
    }
    // Handle logo upload if provided
    let logoData = null;
    if (req.file) {
        try {
            logoData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/logos");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse("Failed to upload school logo", types_1.statusCode.Internal_Server_Error);
        }
    }
    // Create school in database
    const school = await prisma_1.prisma.school.create({
        data: {
            name: validatedData.name,
            code: validatedData.code,
            email: validatedData.email,
            phone: validatedData.phone,
            address: validatedData.address,
            city: validatedData.city,
            state: validatedData.state,
            country: validatedData.country,
            pincode: validatedData.pincode,
            establishedDate: new Date(validatedData.establishedDate),
            website: validatedData.website || null,
            logoUrl: (logoData || {}),
            subscriptionStatus: "ACTIVE",
            subscriptionPlan: validatedData.subscriptionPlan || "BASIC",
            subscriptionStart: validatedData.subscriptionStart
                ? new Date(validatedData.subscriptionStart)
                : new Date(),
            subscriptionEnd: validatedData.subscriptionEnd
                ? new Date(validatedData.subscriptionEnd)
                : null,
            maxStudents: validatedData.maxStudents || 100,
            maxTeachers: validatedData.maxTeachers || 10,
            isActive: true
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "School onboarded successfully", {
        id: school.id,
        name: school.name,
        code: school.code,
        email: school.email,
        subscriptionStatus: school.subscriptionStatus,
        subscriptionPlan: school.subscriptionPlan,
        establishedDate: school.establishedDate,
        createdAt: school.createdAt
    }, types_1.statusCode.Created);
});
/**
 * @route   GET /api/school/:id
 * @desc    Get school by ID
 * @access  Admin/School
 */
exports.getSchoolById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: id },
        include: {
            _count: {
                select: {
                    students: true,
                    teachers: true,
                    academicYears: true,
                    classes: true
                }
            }
        }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    return (0, response_util_1.SuccessResponse)(res, "School retrieved successfully", school);
});
/**
 * @route   GET /api/school
 * @desc    Get all schools with pagination and filters
 * @access  Admin
 */
exports.getAllSchools = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { page = "1", limit = "10", search, subscriptionStatus, subscriptionPlan, isActive } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
    // Build where clause
    const where = {};
    if (search) {
        where.OR = [
            { name: { contains: search } },
            { code: { contains: search } },
            { email: { contains: search } },
            { city: { contains: search } }
        ];
    }
    if (subscriptionStatus) {
        where.subscriptionStatus = subscriptionStatus;
    }
    if (subscriptionPlan) {
        where.subscriptionPlan = subscriptionPlan;
    }
    if (isActive !== undefined) {
        where.isActive = isActive === "true";
    }
    // Get total count
    const total = await prisma_1.prisma.school.count({ where });
    // Get schools
    const schools = await prisma_1.prisma.school.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
            _count: {
                select: {
                    students: true,
                    teachers: true,
                    academicYears: true
                }
            }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Schools retrieved successfully", {
        schools,
        pagination: {
            total,
            page: pageNum,
            limit: limitNum,
            totalPages: Math.ceil(total / limitNum)
        }
    });
});
/**
 * @route   PUT /api/school/:id
 * @desc    Update school details
 * @access  Admin/School
 */
exports.updateSchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate request body with Zod
    const validatedData = school_validation_1.updateSchoolSchema.parse(req.body);
    // Check if school exists
    const existingSchool = await prisma_1.prisma.school.findUnique({
        where: { id: id }
    });
    if (!existingSchool) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    // Handle logo upload/update if provided
    let logoData = null;
    if (req.file) {
        try {
            // Delete old logo if exists
            if (existingSchool.logoUrl && typeof existingSchool.logoUrl === 'object' && 'public_id' in existingSchool.logoUrl) {
                await (0, cloudinary_1.deleteFromCloudinary)(existingSchool.logoUrl.public_id);
            }
            // Upload new logo
            logoData = await (0, cloudinary_1.uploadToCloudinary)(req.file.buffer, "schools/logos");
        }
        catch (uploadError) {
            throw new response_util_1.ErrorResponse("Failed to upload school logo", types_1.statusCode.Internal_Server_Error);
        }
    }
    // Prepare update data
    const updateData = {};
    if (validatedData.name)
        updateData.name = validatedData.name;
    if (validatedData.email)
        updateData.email = validatedData.email;
    if (validatedData.phone)
        updateData.phone = validatedData.phone;
    if (validatedData.address)
        updateData.address = validatedData.address;
    if (validatedData.city)
        updateData.city = validatedData.city;
    if (validatedData.state)
        updateData.state = validatedData.state;
    if (validatedData.country)
        updateData.country = validatedData.country;
    if (validatedData.pincode)
        updateData.pincode = validatedData.pincode;
    if (validatedData.website !== undefined)
        updateData.website = validatedData.website || null;
    if (validatedData.subscriptionPlan)
        updateData.subscriptionPlan = validatedData.subscriptionPlan;
    if (validatedData.subscriptionStart)
        updateData.subscriptionStart = new Date(validatedData.subscriptionStart);
    if (validatedData.subscriptionEnd)
        updateData.subscriptionEnd = new Date(validatedData.subscriptionEnd);
    if (validatedData.maxStudents !== undefined)
        updateData.maxStudents = validatedData.maxStudents;
    if (validatedData.maxTeachers !== undefined)
        updateData.maxTeachers = validatedData.maxTeachers;
    if (logoData)
        updateData.logoUrl = logoData;
    if (validatedData.password) {
        // hash password
        const hashedPassword = await bcryptjs_1.default.hash(validatedData.password, 10);
        updateData.password = hashedPassword;
    }
    // Update school
    const updatedSchool = await prisma_1.prisma.school.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "School updated successfully", updatedSchool);
});
/**
 * @route   PATCH /api/school/:id/status
 * @desc    Activate/Deactivate school
 * @access  Admin
 */
exports.toggleSchoolStatus = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate request body with Zod
    const validatedData = school_validation_1.toggleStatusSchema.parse(req.body);
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: id }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    const updatedSchool = await prisma_1.prisma.school.update({
        where: { id: id },
        data: { isActive: validatedData.isActive }
    });
    return (0, response_util_1.SuccessResponse)(res, `School ${updatedSchool.isActive ? "activated" : "deactivated"} successfully`, updatedSchool);
});
/**
 * @route   PATCH /api/school/:id/subscription
 * @desc    Update school subscription
 * @access  Admin
 */
exports.updateSubscription = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    // Validate request body with Zod
    const validatedData = school_validation_1.updateSubscriptionSchema.parse(req.body);
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: id }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    const updateData = {};
    if (validatedData.subscriptionStatus)
        updateData.subscriptionStatus = validatedData.subscriptionStatus;
    if (validatedData.subscriptionPlan)
        updateData.subscriptionPlan = validatedData.subscriptionPlan;
    if (validatedData.subscriptionStart)
        updateData.subscriptionStart = new Date(validatedData.subscriptionStart);
    if (validatedData.subscriptionEnd)
        updateData.subscriptionEnd = new Date(validatedData.subscriptionEnd);
    if (validatedData.maxStudents !== undefined)
        updateData.maxStudents = validatedData.maxStudents;
    if (validatedData.maxTeachers !== undefined)
        updateData.maxTeachers = validatedData.maxTeachers;
    const updatedSchool = await prisma_1.prisma.school.update({
        where: { id: id },
        data: updateData
    });
    return (0, response_util_1.SuccessResponse)(res, "Subscription updated successfully", updatedSchool);
});
/**
 * @route   DELETE /api/school/:id/logo
 * @desc    Delete school logo
 * @access  Admin/School
 */
exports.deleteSchoolLogo = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const school = await prisma_1.prisma.school.findUnique({
        where: { id: id }
    });
    if (!school) {
        throw new response_util_1.ErrorResponse("School not found", types_1.statusCode.Not_Found);
    }
    if (!school.logoUrl) {
        throw new response_util_1.ErrorResponse("School has no logo to delete", types_1.statusCode.Bad_Request);
    }
    // Delete from Cloudinary
    if (typeof school.logoUrl === 'object' && 'public_id' in school.logoUrl) {
        await (0, cloudinary_1.deleteFromCloudinary)(school.logoUrl.public_id);
    }
    // Update database
    const updatedSchool = await prisma_1.prisma.school.update({
        where: { id: id },
        data: { logoUrl: {} }
    });
    return (0, response_util_1.SuccessResponse)(res, "School logo deleted successfully", updatedSchool);
});
//# sourceMappingURL=school.controller.js.map