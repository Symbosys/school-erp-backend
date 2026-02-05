import { Router } from "express";
import {
  createHomework,
  getHomeworkBySection,
  getHomeworkForStudent,
  getHomeworkById,
  updateHomework,
  deleteHomework,
  submitHomework,
  getSubmissions,
  gradeSubmission,
  deleteSubmission,
} from "../controllers/homework.controller";

const router = Router();

// ==========================================
// HOMEWORK ASSIGNMENT
// ==========================================

/**
 * @route   POST /api/homework
 * @desc    Create homework
 * @access  Teacher/Admin
 */
router.post("/", createHomework);

/**
 * @route   GET /api/homework/section/:sectionId
 * @desc    Get homework for a section
 * @query   date, subjectId
 * @access  All
 */
router.get("/section/:sectionId", getHomeworkBySection);

/**
 * @route   GET /api/homework/student/:studentId
 * @desc    Get homework for a student (with submission status)
 * @query   date, status
 * @access  Student
 */
router.get("/student/:studentId", getHomeworkForStudent);

/**
 * @route   GET /api/homework/:id
 * @desc    Get homework details
 * @access  All
 */
router.get("/:id", getHomeworkById);

/**
 * @route   PUT /api/homework/:id
 * @desc    Update homework
 * @access  Teacher/Admin
 */
router.put("/:id", updateHomework);

/**
 * @route   DELETE /api/homework/:id
 * @desc    Delete homework
 * @access  Teacher/Admin
 */
router.delete("/:id", deleteHomework);

// ==========================================
// SUBMISSIONS
// ==========================================

/**
 * @route   POST /api/homework/:id/submit
 * @desc    Submit homework
 * @access  Student
 */
router.post("/:id/submit", submitHomework);

/**
 * @route   GET /api/homework/:id/submissions
 * @desc    Get all submissions for an assignment
 * @access  Teacher
 */
router.get("/:id/submissions", getSubmissions);

/**
 * @route   PUT /api/homework/submission/:id/grade
 * @desc    Grade a submission
 * @access  Teacher
 */
router.put("/submission/:id/grade", gradeSubmission);

/**
 * @route   DELETE /api/homework/submission/:id
 * @desc    Delete a submission
 * @access  Teacher/Admin
 */
router.delete("/submission/:id", deleteSubmission);

export default router;
