"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const homework_controller_1 = require("../controllers/homework.controller");
const router = (0, express_1.Router)();
// ==========================================
// HOMEWORK ASSIGNMENT
// ==========================================
/**
 * @route   POST /api/homework
 * @desc    Create homework
 * @access  Teacher/Admin
 */
router.post("/", homework_controller_1.createHomework);
/**
 * @route   GET /api/homework/section/:sectionId
 * @desc    Get homework for a section
 * @query   date, subjectId
 * @access  All
 */
router.get("/section/:sectionId", homework_controller_1.getHomeworkBySection);
/**
 * @route   GET /api/homework/student/:studentId
 * @desc    Get homework for a student (with submission status)
 * @query   date, status
 * @access  Student
 */
router.get("/student/:studentId", homework_controller_1.getHomeworkForStudent);
/**
 * @route   GET /api/homework/:id
 * @desc    Get homework details
 * @access  All
 */
router.get("/:id", homework_controller_1.getHomeworkById);
/**
 * @route   PUT /api/homework/:id
 * @desc    Update homework
 * @access  Teacher/Admin
 */
router.put("/:id", homework_controller_1.updateHomework);
/**
 * @route   DELETE /api/homework/:id
 * @desc    Delete homework
 * @access  Teacher/Admin
 */
router.delete("/:id", homework_controller_1.deleteHomework);
// ==========================================
// SUBMISSIONS
// ==========================================
/**
 * @route   POST /api/homework/:id/submit
 * @desc    Submit homework
 * @access  Student
 */
router.post("/:id/submit", homework_controller_1.submitHomework);
/**
 * @route   GET /api/homework/:id/submissions
 * @desc    Get all submissions for an assignment
 * @access  Teacher
 */
router.get("/:id/submissions", homework_controller_1.getSubmissions);
/**
 * @route   PUT /api/homework/submission/:id/grade
 * @desc    Grade a submission
 * @access  Teacher
 */
router.put("/submission/:id/grade", homework_controller_1.gradeSubmission);
/**
 * @route   DELETE /api/homework/submission/:id
 * @desc    Delete a submission
 * @access  Teacher/Admin
 */
router.delete("/submission/:id", homework_controller_1.deleteSubmission);
exports.default = router;
//# sourceMappingURL=homework.routes.js.map