"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const dashboard_controller_1 = require("../controllers/dashboard.controller");
const router = (0, express_1.Router)();
router.get("/stats", auth_middleware_1.authenticateSchool, dashboard_controller_1.getSchoolStats);
exports.default = router;
//# sourceMappingURL=dashboard.routes.js.map