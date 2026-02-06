"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enrollStudentSchema = exports.updateStudentSchema = exports.onboardStudentSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Student Onboarding
 */
exports.onboardStudentSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    admissionNumber: zod_1.z.string().max(50, "Admission number is too long").optional(),
    firstName: zod_1.z.string().min(1, "First name is required").max(100, "First name is too long"),
    lastName: zod_1.z.string().min(1, "Last name is required").max(100, "Last name is too long"),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long").optional().or(zod_1.z.literal("")),
    phone: zod_1.z.string().max(20, "Phone number is too long").optional().or(zod_1.z.literal("")),
    dateOfBirth: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date of birth format",
    }),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]),
    bloodGroup: zod_1.z.string().max(10, "Blood group is too long").optional(),
    address: zod_1.z.string().min(1, "Address is required"),
    city: zod_1.z.string().min(1, "City is required").max(100, "City is too long"),
    state: zod_1.z.string().min(1, "State is required").max(100, "State is too long"),
    pincode: zod_1.z.string().min(1, "Pincode is required").max(10, "Pincode is too long"),
    admissionDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid admission date format",
    }),
    medicalInfo: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED_OUT"]).optional(),
    isActive: zod_1.z.boolean().optional(),
    // Optional initial enrollment details
    // Optional initial enrollment details
    enrollment: zod_1.z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch (e) {
                return val;
            }
        }
        return val;
    }, zod_1.z.object({
        academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
        sectionId: zod_1.z.string().uuid("Invalid section ID"),
        enrollmentDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
            message: "Invalid enrollment date format",
        }).optional(),
        rollNumber: zod_1.z.string().max(50, "Roll number is too long").optional(),
    }).optional()),
    // Optional parent details (Link existing or Create new)
    parent: zod_1.z.preprocess((val) => {
        if (typeof val === 'string') {
            try {
                return JSON.parse(val);
            }
            catch (e) {
                return val;
            }
        }
        return val;
    }, zod_1.z.object({
        mode: zod_1.z.enum(["EXISTING", "NEW"]),
        relationship: zod_1.z.string().min(1, "Relationship is required"),
        isPrimary: zod_1.z.boolean().default(false),
        // Existing
        existingParentId: zod_1.z.string().uuid().optional(),
        // New
        firstName: zod_1.z.string().min(1, "Parent First Name is required").max(100).optional(),
        lastName: zod_1.z.string().min(1, "Parent Last Name is required").max(100).optional(),
        email: zod_1.z.string().email("Invalid parent email").max(255).optional(),
        phone: zod_1.z.string().min(1, "Parent Phone is required").max(20).optional(),
        occupation: zod_1.z.string().max(100).optional(),
        address: zod_1.z.string().optional(),
        city: zod_1.z.string().max(100).optional(),
        state: zod_1.z.string().max(100).optional(),
        pincode: zod_1.z.string().max(10).optional(),
    }).refine((data) => {
        if (data.mode === "EXISTING" && !data.existingParentId)
            return false;
        if (data.mode === "NEW" && (!data.firstName || !data.lastName || !data.email || !data.phone))
            return false;
        return true;
    }, { message: "Missing required parent fields for selected mode" }).optional()),
});
/**
 * Zod Schema for Student Update
 */
exports.updateStudentSchema = zod_1.z.object({
    admissionNumber: zod_1.z.string().max(50).optional(),
    firstName: zod_1.z.string().max(100).optional(),
    lastName: zod_1.z.string().max(100).optional(),
    email: zod_1.z.string().email().max(255).optional().or(zod_1.z.literal("")),
    password: zod_1.z.string().optional(),
    phone: zod_1.z.string().max(20).optional().or(zod_1.z.literal("")),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    bloodGroup: zod_1.z.string().max(10).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100).optional(),
    state: zod_1.z.string().max(100).optional(),
    pincode: zod_1.z.string().max(10).optional(),
    admissionDate: zod_1.z.string().optional(),
    medicalInfo: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED_OUT"]).optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Student Enrollment (Adding entry for new academic year)
 */
exports.enrollStudentSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
    sectionId: zod_1.z.string().uuid("Invalid section ID"),
    enrollmentDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid enrollment date format",
    }),
    rollNumber: zod_1.z.string().max(50, "Roll number is too long").optional(),
    remarks: zod_1.z.string().optional(),
});
//# sourceMappingURL=student.validation.js.map