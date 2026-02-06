"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const result_controller_1 = require("../controllers/result.controller");
const router = (0, express_1.Router)();
router.post("/generate", result_controller_1.generateResults);
router.get("/exam/:examId", result_controller_1.getResultsByExam);
router.get("/student/:studentId", result_controller_1.getResultsByStudent);
router.get("/:id", result_controller_1.getResultById);
exports.default = router;
//# sourceMappingURL=result.routes.js.map