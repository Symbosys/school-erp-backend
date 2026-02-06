"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const studentParent_controller_1 = require("../controllers/studentParent.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/parents/relation
 * @desc    Assign parent to student
 * @access  Admin/School
 */
router.post("/", studentParent_controller_1.assignParentToStudent);
/**
 * @route   GET /api/parents/relation/student/:studentId
 * @desc    Get all parents for a student
 * @access  Admin/School
 */
router.get("/student/:studentId", studentParent_controller_1.getParentsByStudent);
/**
 * @route   PUT /api/parents/relation/:id
 * @desc    Update relationship details
 * @access  Admin/School
 */
router.put("/:id", studentParent_controller_1.updateStudentParentRelation);
/**
 * @route   DELETE /api/parents/relation/:id
 * @desc    Remove parent from student
 * @access  Admin/School
 */
router.delete("/:id", studentParent_controller_1.removeParentFromStudent);
exports.default = router;
//# sourceMappingURL=studentParent.routes.js.map