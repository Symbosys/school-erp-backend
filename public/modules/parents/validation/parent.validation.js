"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateParentSchema = exports.createParentSchema = void 0;
const zod_1 = require("zod");
/**
 * Zod Schema for Creating Parent
 */
exports.createParentSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    firstName: zod_1.z.string().min(1, "First name is required").max(100, "First name is too long"),
    lastName: zod_1.z.string().min(1, "Last name is required").max(100, "Last name is too long"),
    email: zod_1.z.string().email("Invalid email format").max(255, "Email is too long"),
    phone: zod_1.z.string().min(1, "Phone number is required").max(20, "Phone number is too long"),
    occupation: zod_1.z.string().max(100, "Occupation is too long").optional(),
    address: zod_1.z.string().min(1, "Address is required"),
    city: zod_1.z.string().min(1, "City is required").max(100, "City is too long"),
    state: zod_1.z.string().min(1, "State is required").max(100, "State is too long"),
    pincode: zod_1.z.string().min(1, "Pincode is required").max(10, "Pincode is too long"),
    isActive: zod_1.z.boolean().optional(),
});
/**
 * Zod Schema for Updating Parent
 */
exports.updateParentSchema = zod_1.z.object({
    firstName: zod_1.z.string().max(100).optional(),
    lastName: zod_1.z.string().max(100).optional(),
    email: zod_1.z.string().email().max(255).optional(),
    password: zod_1.z.string().optional(),
    phone: zod_1.z.string().max(20).optional(),
    occupation: zod_1.z.string().max(100).optional(),
    address: zod_1.z.string().optional(),
    city: zod_1.z.string().max(100).optional(),
    state: zod_1.z.string().max(100).optional(),
    pincode: zod_1.z.string().max(10).optional(),
    isActive: zod_1.z.boolean().optional(),
});
//# sourceMappingURL=parent.validation.js.map