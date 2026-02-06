"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const attendance_controller_1 = require("../controllers/attendance.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/student/attendance/bulk
 * @desc    Mark bulk attendance
 * @access  Admin/Teacher
 */
router.post("/bulk", attendance_controller_1.markBulkAttendance);
/**
 * @route   GET /api/student/attendance/section/:sectionId
 * @desc    Get section attendance (List of students with status)
 * @access  Admin/Teacher
 */
router.get("/section/:sectionId", attendance_controller_1.getAttendanceBySection);
/**
 * @route   GET /api/student/attendance/student/:studentId
 * @desc    Get student attendance history
 * @access  Admin/Teacher/Parent
 */
router.get("/student/:studentId", attendance_controller_1.getAttendanceByStudent);
/**
 * @route   PUT /api/student/attendance/:id
 * @desc    Update single attendance record
 * @access  Admin/Teacher
 */
router.put("/:id", attendance_controller_1.updateAttendance);
exports.default = router;
//# sourceMappingURL=attendance.routes.js.map