"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const enrollment_controller_1 = require("../controllers/enrollment.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/student/enrollment
 * @desc    Create enrollment (Enroll student to class/year)
 * @access  Admin/School
 */
router.post("/", enrollment_controller_1.createEnrollment);
/**
 * @route   GET /api/student/enrollment/student/:studentId
 * @desc    Get all enrollments (history) for a student
 * @access  Admin/School
 */
router.get("/student/:studentId", enrollment_controller_1.getEnrollmentsByStudent);
/**
 * @route   GET /api/student/enrollment/:id
 * @desc    Get enrollment by ID
 * @access  Admin/School
 */
router.get("/:id", enrollment_controller_1.getEnrollmentById);
/**
 * @route   PUT /api/student/enrollment/:id
 * @desc    Update enrollment details
 * @access  Admin/School
 */
router.put("/:id", enrollment_controller_1.updateEnrollment);
/**
 * @route   DELETE /api/student/enrollment/:id
 * @desc    Delete enrollment
 * @access  Admin
 */
router.delete("/:id", enrollment_controller_1.deleteEnrollment);
exports.default = router;
//# sourceMappingURL=enrollment.routes.js.map