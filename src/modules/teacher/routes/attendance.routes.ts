import { Router } from "express";
import {
  markBulkTeacherAttendance,
  getTeacherAttendanceBySchool,
  getAttendanceByTeacher,
  updateTeacherAttendance,
  punchAttendance,
} from "../controllers/attendance.controller";
import { authenticateTeacher } from "../middlewares/teacher-auth.middleware";

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

/**
 * @route   POST /api/teacher/attendance/punch
 * @desc    Teacher Punch In/Out
 * @access  Teacher
 */
router.post("/punch", authenticateTeacher, punchAttendance);

export default router;
