import { Router } from "express";
import {
  createEnrollment,
  getEnrollmentsByStudent,
  getEnrollmentById,
  updateEnrollment,
  deleteEnrollment,
} from "../controllers/enrollment.controller";

const router = Router();

/**
 * @route   POST /api/student/enrollment
 * @desc    Create enrollment (Enroll student to class/year)
 * @access  Admin/School
 */
router.post("/", createEnrollment);

/**
 * @route   GET /api/student/enrollment/student/:studentId
 * @desc    Get all enrollments (history) for a student
 * @access  Admin/School
 */
router.get("/student/:studentId", getEnrollmentsByStudent);

/**
 * @route   GET /api/student/enrollment/:id
 * @desc    Get enrollment by ID
 * @access  Admin/School
 */
router.get("/:id", getEnrollmentById);

/**
 * @route   PUT /api/student/enrollment/:id
 * @desc    Update enrollment details
 * @access  Admin/School
 */
router.put("/:id", updateEnrollment);

/**
 * @route   DELETE /api/student/enrollment/:id
 * @desc    Delete enrollment
 * @access  Admin
 */
router.delete("/:id", deleteEnrollment);

export default router;
