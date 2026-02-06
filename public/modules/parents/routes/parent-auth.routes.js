"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parent_auth_controller_1 = require("../controllers/parent-auth.controller");
const parent_auth_middleware_1 = require("../middlewares/parent-auth.middleware");
const router = (0, express_1.Router)();
// Public routes
router.post("/login", parent_auth_controller_1.parentLogin);
// Protected routes
router.post("/logout", parent_auth_middleware_1.authenticateParent, parent_auth_controller_1.parentLogout);
router.get("/profile", parent_auth_middleware_1.authenticateParent, parent_auth_controller_1.getParentProfile);
router.put("/fcm-token", parent_auth_middleware_1.authenticateParent, parent_auth_controller_1.updateParentFcmToken);
exports.default = router;
//# sourceMappingURL=parent-auth.routes.js.map