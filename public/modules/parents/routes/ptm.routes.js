"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ptm_controller_1 = require("../controllers/ptm.controller");
const parent_auth_middleware_1 = require("../middlewares/parent-auth.middleware");
const router = (0, express_1.Router)();
// Apply auth middleware to all routes
router.use(parent_auth_middleware_1.authenticateParent);
router.get("/my-meetings", ptm_controller_1.getMyPTMs);
exports.default = router;
//# sourceMappingURL=ptm.routes.js.map