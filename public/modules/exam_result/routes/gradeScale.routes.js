"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const gradeScale_controller_1 = require("../controllers/gradeScale.controller");
const router = (0, express_1.Router)();
router.post("/", gradeScale_controller_1.createGradeScale);
router.get("/school/:schoolId", gradeScale_controller_1.getGradeScalesBySchool);
router.get("/:id", gradeScale_controller_1.getGradeScaleById);
router.put("/:id", gradeScale_controller_1.updateGradeScale);
router.delete("/:id", gradeScale_controller_1.deleteGradeScale);
exports.default = router;
//# sourceMappingURL=gradeScale.routes.js.map