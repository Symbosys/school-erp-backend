"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parentUpdateFcmTokenSchema = exports.parentLoginSchema = void 0;
const zod_1 = require("zod");
exports.parentLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
exports.parentUpdateFcmTokenSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().min(1, "FCM token is required"),
});
//# sourceMappingURL=parent-auth.validation.js.map