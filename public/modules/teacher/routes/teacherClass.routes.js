"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacherClass_controller_1 = require("../controllers/teacherClass.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/teacher/class-assignment
 * @desc    Assign teacher to class/section
 * @access  Admin/School
 */
router.post("/", teacherClass_controller_1.assignTeacherToClass);
/**
 * @route   GET /api/teacher/class-assignment/teacher/:teacherId
 * @desc    Get assignments by teacher
 * @access  Admin/School
 */
router.get("/teacher/:teacherId", teacherClass_controller_1.getAssignmentsByTeacher);
/**
 * @route   DELETE /api/teacher/class-assignment/:id
 * @desc    Remove teacher from class
 * @access  Admin/School
 */
router.delete("/:id", teacherClass_controller_1.removeTeacherFromClass);
exports.default = router;
//# sourceMappingURL=teacherClass.routes.js.map