"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacher_auth_controller_1 = require("../controllers/teacher-auth.controller");
const teacher_auth_middleware_1 = require("../middlewares/teacher-auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post("/login", teacher_auth_controller_1.teacherLogin);
// Protected routes
router.post("/logout", teacher_auth_middleware_1.authenticateTeacher, teacher_auth_controller_1.teacherLogout);
router.get("/profile", teacher_auth_middleware_1.authenticateTeacher, teacher_auth_controller_1.getTeacherProfile);
router.put("/fcm-token", teacher_auth_middleware_1.authenticateTeacher, teacher_auth_controller_1.updateTeacherFcmToken);
exports.default = router;
//# sourceMappingURL=teacher-auth.routes.js.map