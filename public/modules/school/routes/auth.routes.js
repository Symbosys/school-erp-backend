"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
router.post("/login", auth_controller_1.schoolLogin);
router.post("/set-password/:schoolId", auth_controller_1.setPassword);
router.get("/profile", auth_middleware_1.authenticateSchool, auth_controller_1.getSchoolProfile);
router.post("/logout", auth_middleware_1.authenticateSchool, auth_controller_1.schoolLogout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map