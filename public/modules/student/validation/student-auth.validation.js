"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.studentUpdateFcmTokenSchema = exports.studentLoginSchema = void 0;
const zod_1 = require("zod");
exports.studentLoginSchema = zod_1.z.object({
    email: zod_1.z.string().email("Invalid email address").trim(),
    password: zod_1.z.string().min(6, "Password must be at least 6 characters").trim(),
});
exports.studentUpdateFcmTokenSchema = zod_1.z.object({
    fcmToken: zod_1.z.string().min(1, "FCM token is required").trim(),
});
//# sourceMappingURL=student-auth.validation.js.map