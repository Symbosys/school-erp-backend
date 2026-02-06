"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleStatusSchema = exports.updateSubscriptionSchema = exports.updateSchoolSchema = exports.onboardSchoolSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for School Onboarding
 */
exports.onboardSchoolSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "School name is required").max(255, "School name is too long"),
    code: zod_1.z.string().min(1, "School code is required").max(50, "School code is too long"),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long"),
    phone: zod_1.z.string().min(1, "Phone number is required").max(20, "Phone number is too long"),
    address: zod_1.z.string().min(1, "Address is required"),
    city: zod_1.z.string().min(1, "City is required").max(100, "City name is too long"),
    state: zod_1.z.string().min(1, "State is required").max(100, "State name is too long"),
    country: zod_1.z.string().min(1, "Country is required").max(100, "Country name is too long"),
    pincode: zod_1.z.string().min(1, "Pincode is required").max(10, "Pincode is too long"),
    establishedDate: zod_1.z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: "Invalid date format",
    }),
    website: zod_1.z.string().url("Invalid website URL").optional().or(zod_1.z.literal("")),
    subscriptionPlan: zod_1.z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).optional(),
    subscriptionStart: zod_1.z.string().optional(),
    subscriptionEnd: zod_1.z.string().optional(),
    maxStudents: zod_1.z.number().int().positive("Max students must be positive").optional(),
    maxTeachers: zod_1.z.number().int().positive("Max teachers must be positive").optional(),
});
/**
 * Zod Schema for School Update
 */
exports.updateSchoolSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "School name is required").max(255, "School name is too long").optional(),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long").optional(),
    password: zod_1.z.string().min(8, "Password must be at least 8 characters long").optional(),
    phone: zod_1.z.string().max(20, "Phone number is too long").optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100, "City name is too long").optional(),
    state: zod_1.z.string().max(100, "State name is too long").optional(),
    country: zod_1.z.string().max(100, "Country name is too long").optional(),
    pincode: zod_1.z.string().max(10, "Pincode is too long").optional(),
    website: zod_1.z.string().url("Invalid website URL").optional().or(zod_1.z.literal("")),
    subscriptionPlan: zod_1.z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).optional(),
    subscriptionStart: zod_1.z.string().optional(),
    subscriptionEnd: zod_1.z.string().optional(),
    maxStudents: zod_1.z.number().int().positive("Max students must be positive").optional(),
    maxTeachers: zod_1.z.number().int().positive("Max teachers must be positive").optional(),
});
/**
 * Zod Schema for Subscription Update
 */
exports.updateSubscriptionSchema = zod_1.z.object({
    subscriptionStatus: zod_1.z.enum(["ACTIVE", "INACTIVE", "SUSPENDED", "TRIAL", "EXPIRED"]).optional(),
    subscriptionPlan: zod_1.z.enum(["BASIC", "STANDARD", "PREMIUM", "ENTERPRISE"]).optional(),
    subscriptionStart: zod_1.z.string().optional(),
    subscriptionEnd: zod_1.z.string().optional(),
    maxStudents: zod_1.z.number().int().positive("Max students must be positive").optional(),
    maxTeachers: zod_1.z.number().int().positive("Max teachers must be positive").optional(),
});
/**
 * Zod Schema for Toggle Status
 */
exports.toggleStatusSchema = zod_1.z.object({
    isActive: zod_1.z.boolean(),
});
//# sourceMappingURL=school.validation.js.map