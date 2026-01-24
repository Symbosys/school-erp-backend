import { Router } from "express";
import {
  markBulkTeacherAttendance,
  getTeacherAttendanceBySchool,
  getAttendanceByTeacher,
  updateTeacherAttendance,
} from "../controllers/attendance.controller";

const router = Router();

/**
 * @route   POST /api/teacher/attendance/bulk
 * @desc    Mark bulk attendance for teachers
 * @access  Admin/School
 */
router.post("/bulk", markBulkTeacherAttendance);

/**
 * @route   GET /api/teacher/attendance/school/:schoolId
 * @desc    Get daily attendance sheet for school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getTeacherAttendanceBySchool);

/**
 * @route   GET /api/teacher/attendance/teacher/:teacherId
 * @desc    Get attendance history for a teacher
 * @access  Admin/School/Teacher
 */
router.get("/teacher/:teacherId", getAttendanceByTeacher);

/**
 * @route   PUT /api/teacher/attendance/:id
 * @desc    Update single attendance record
 * @access  Admin/School
 */
router.put("/:id", updateTeacherAttendance);

export default router;
