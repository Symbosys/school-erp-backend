"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_auth_controller_1 = require("../controllers/student-auth.controller");
const student_auth_middleware_1 = require("../middlewares/student-auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post("/login", student_auth_controller_1.studentLogin);
// Protected routes
router.post("/logout", student_auth_middleware_1.authenticateStudent, student_auth_controller_1.studentLogout);
router.get("/profile", student_auth_middleware_1.authenticateStudent, student_auth_controller_1.getStudentProfile);
router.put("/fcm-token", student_auth_middleware_1.authenticateStudent, student_auth_controller_1.updateStudentFcmToken);
exports.default = router;
//# sourceMappingURL=student-auth.routes.js.map