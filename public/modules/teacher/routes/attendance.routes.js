"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
const teacher_auth_middleware_1 = require("../middlewares/teacher-auth.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/teacher/attendance/bulk
 * @desc    Mark bulk attendance for teachers
 * @access  Admin/School
 */
router.post("/bulk", attendance_controller_1.markBulkTeacherAttendance);
/**
 * @route   GET /api/teacher/attendance/school/:schoolId
 * @desc    Get daily attendance sheet for school
 * @access  Admin/School
 */
router.get("/school/:schoolId", attendance_controller_1.getTeacherAttendanceBySchool);
/**
 * @route   GET /api/teacher/attendance/teacher/:teacherId
 * @desc    Get attendance history for a teacher
 * @access  Admin/School/Teacher
 */
router.get("/teacher/:teacherId", attendance_controller_1.getAttendanceByTeacher);
/**
 * @route   PUT /api/teacher/attendance/:id
 * @desc    Update single attendance record
 * @access  Admin/School
 */
router.put("/:id", attendance_controller_1.updateTeacherAttendance);
/**
 * @route   POST /api/teacher/attendance/punch
 * @desc    Teacher Punch In/Out
 * @access  Teacher
 */
router.post("/punch", teacher_auth_middleware_1.authenticateTeacher, attendance_controller_1.punchAttendance);
exports.default = router;
//# sourceMappingURL=attendance.routes.js.map