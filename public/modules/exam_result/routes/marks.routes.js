"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const marks_controller_1 = require("../controllers/marks.controller");
const router = (0, express_1.Router)();
router.post("/", marks_controller_1.enterMarks);
router.get("/subject/:examSubjectId", marks_controller_1.getMarksBySubject);
router.get("/student/:studentId", marks_controller_1.getMarksByStudent);
router.get("/exam/:examId", marks_controller_1.getMarksByExam);
router.put("/:id", marks_controller_1.updateMark);
router.delete("/:id", marks_controller_1.deleteMark);
exports.default = router;
//# sourceMappingURL=marks.routes.js.map