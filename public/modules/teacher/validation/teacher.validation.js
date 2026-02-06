"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTeacherSchema = exports.onboardTeacherSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Teacher Onboarding
 */
exports.onboardTeacherSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    employeeId: zod_1.z.string().min(1, "Employee ID is required").max(50, "Employee ID is too long"),
    firstName: zod_1.z.string().min(1, "First name is required").max(100, "First name is too long"),
    lastName: zod_1.z.string().min(1, "Last name is required").max(100, "Last name is too long"),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long"),
    phone: zod_1.z.string().min(1, "Phone number is required").max(20, "Phone number is too long"),
    dateOfBirth: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date of birth format",
    }),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]),
    address: zod_1.z.string().min(1, "Address is required"),
    city: zod_1.z.string().min(1, "City is required").max(100, "City is too long"),
    state: zod_1.z.string().min(1, "State is required").max(100, "State is too long"),
    pincode: zod_1.z.string().min(1, "Pincode is required").max(10, "Pincode is too long"),
    qualification: zod_1.z.string().min(1, "Qualification is required").max(255, "Qualification is too long"),
    specialization: zod_1.z.string().max(255, "Specialization is too long").optional(),
    experience: zod_1.z.string().transform((val) => parseInt(val, 10)).or(zod_1.z.number()).pipe(zod_1.z.number().int().min(0, "Experience cannot be negative")),
    joiningDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid joining date format",
    }),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
    monthlySalary: zod_1.z.string().transform((val) => parseFloat(val)).or(zod_1.z.number()).pipe(zod_1.z.number().min(0, "Salary cannot be negative")).optional(),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Teacher Update
 */
exports.updateTeacherSchema = zod_1.z.object({
    firstName: zod_1.z.string().max(100, "First name is too long").optional(),
    lastName: zod_1.z.string().max(100, "Last name is too long").optional(),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long").optional(),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters long").optional(),
    phone: zod_1.z.string().max(20, "Phone number is too long").optional(),
    dateOfBirth: zod_1.z.string().optional(),
    gender: zod_1.z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100, "City is too long").optional(),
    state: zod_1.z.string().max(100, "State is too long").optional(),
    pincode: zod_1.z.string().max(10, "Pincode is too long").optional(),
    qualification: zod_1.z.string().max(255, "Qualification is too long").optional(),
    specialization: zod_1.z.string().max(255, "Specialization is too long").optional(),
    experience: zod_1.z.string().transform((val) => parseInt(val, 10)).or(zod_1.z.number()).pipe(zod_1.z.number().int().min(0, "Experience cannot be negative")).optional(),
    joiningDate: zod_1.z.string().optional(),
    status: zod_1.z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).optional(),
    monthlySalary: zod_1.z.string().transform((val) => parseFloat(val)).or(zod_1.z.number()).pipe(zod_1.z.number().min(0, "Salary cannot be negative")).optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=teacher.validation.js.map