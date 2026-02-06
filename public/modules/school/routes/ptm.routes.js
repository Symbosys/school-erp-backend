"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ptm_controller_1 = require("../controllers/ptm.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = (0, express_1.Router)();
// Protect all routes
router.use(auth_middleware_1.authenticateSchool);
router.post("/", ptm_controller_1.createPTM);
router.get("/:schoolId", ptm_controller_1.getAllPTMs);
router.get("/:id", ptm_controller_1.getPTMById);
router.patch("/:id", ptm_controller_1.updatePTM);
router.delete("/:id", ptm_controller_1.deletePTM);
exports.default = router;
//# sourceMappingURL=ptm.routes.js.map