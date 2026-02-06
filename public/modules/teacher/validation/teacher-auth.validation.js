"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.teacherUpdateFcmTokenSchema = exports.teacherLoginSchema = void 0;
const zod_1 = require("zod");
exports.teacherLoginSchema = zod_1.z.object({
    email: zod_1.z.string().min(1, "Email or Employee ID is required"),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters"),
});
exports.teacherUpdateFcmTokenSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().min(1, "FCM token is required"),
});
//# sourceMappingURL=teacher-auth.validation.js.map