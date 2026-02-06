"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentFee_controller_1 = require("../controllers/studentFee.controller");
const router = (0, express_1.Router)();
router.post("/", studentFee_controller_1.assignStudentFee);
router.post("/bulk", studentFee_controller_1.bulkAssignStudentFee);
router.get("/school/:schoolId", studentFee_controller_1.getStudentFeesBySchool);
router.get("/student/:studentId", studentFee_controller_1.getFeesByStudent);
router.get("/:id", studentFee_controller_1.getStudentFeeById);
router.put("/:id", studentFee_controller_1.updateStudentFee);
exports.default = router;
//# sourceMappingURL=studentFee.routes.js.map