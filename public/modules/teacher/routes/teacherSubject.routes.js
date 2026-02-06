"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacherSubject_controller_1 = require("../controllers/teacherSubject.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/teacher/subject
 * @desc    Assign subject to teacher
 * @access  Admin/School
 */
router.post("/", teacherSubject_controller_1.assignSubjectToTeacher);
/**
 * @route   GET /api/teacher/subject/teacher/:teacherId
 * @desc    Get all subjects for a teacher
 * @access  Admin/School
 */
router.get("/teacher/:teacherId", teacherSubject_controller_1.getSubjectsByTeacher);
/**
 * @route   GET /api/teacher/subject/subject/:subjectId
 * @desc    Get all teachers for a subject
 * @access  Admin/School
 */
router.get("/subject/:subjectId", teacherSubject_controller_1.getTeachersBySubject);
/**
 * @route   PUT /api/teacher/subject/:id
 * @desc    Update assignment (isPrimary)
 * @access  Admin/School
 */
router.put("/:id", teacherSubject_controller_1.updateTeacherSubject);
/**
 * @route   DELETE /api/teacher/subject/:id
 * @desc    Remove subject from teacher
 * @access  Admin/School
 */
router.delete("/:id", teacherSubject_controller_1.removeSubjectFromTeacher);
exports.default = router;
//# sourceMappingURL=teacherSubject.routes.js.map