"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const exam_controller_1 = require("../controllers/exam.controller");
const router = (0, express_1.Router)();
router.post("/", exam_controller_1.createExam);
router.get("/school/:schoolId", exam_controller_1.getExamsBySchool);
router.get("/:id", exam_controller_1.getExamById);
router.put("/:id", exam_controller_1.updateExam);
router.delete("/:id", exam_controller_1.deleteExam);
// Exam Subjects
router.post("/subject", exam_controller_1.addExamSubject);
router.delete("/subject/:id", exam_controller_1.removeExamSubject);
exports.default = router;
//# sourceMappingURL=exam.routes.js.map