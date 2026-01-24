import { Router } from "express";
import {
  markBulkAttendance,
  getAttendanceBySection,
  getAttendanceByStudent,
  updateAttendance,
} from "../controllers/attendance.controller";

const router = Router();

/**
 * @route   POST /api/student/attendance/bulk
 * @desc    Mark bulk attendance
 * @access  Admin/Teacher
 */
router.post("/bulk", markBulkAttendance);

/**
 * @route   GET /api/student/attendance/section/:sectionId
 * @desc    Get section attendance (List of students with status)
 * @access  Admin/Teacher
 */
router.get("/section/:sectionId", getAttendanceBySection);

/**
 * @route   GET /api/student/attendance/student/:studentId
 * @desc    Get student attendance history
 * @access  Admin/Teacher/Parent
 */
router.get("/student/:studentId", getAttendanceByStudent);

/**
 * @route   PUT /api/student/attendance/:id
 * @desc    Update single attendance record
 * @access  Admin/Teacher
 */
router.put("/:id", updateAttendance);

export default router;
