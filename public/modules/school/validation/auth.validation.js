"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setPasswordSchema = exports.schoolLoginSchema = void 0;
const zod_1 = require("zod");
/**
 * Schema for School Login
 */
exports.schoolLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(1, "Password is required"),
});
/**
 * Schema for Setting/Updating Password
 */
exports.setPasswordSchema = zod_1.z.object({
    password: zod_1.z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: zod_1.z.string().min(1, "Confirm password is required"),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
});
//# sourceMappingURL=auth.validation.js.map