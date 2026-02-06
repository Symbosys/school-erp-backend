"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const teacher_controller_1 = require("../controllers/teacher.controller");
const multer_middleware_1 = require("../../../middlewares/multer.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/teacher/onboard
 * @desc    Onboard a new teacher
 * @access  Admin/School
 */
router.post("/onboard", multer_middleware_1.Upload.single("profilePicture"), teacher_controller_1.onboardTeacher);
/**
 * @route   GET /api/teacher/school/:schoolId
 * @desc    Get all teachers for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", teacher_controller_1.getTeachersBySchool);
/**
 * @route   GET /api/teacher/:id
 * @desc    Get teacher by ID
 * @access  Admin/School
 */
router.get("/:id", teacher_controller_1.getTeacherById);
/**
 * @route   PUT /api/teacher/:id
 * @desc    Update teacher details
 * @access  Admin/School
 */
router.put("/:id", multer_middleware_1.Upload.single("profilePicture"), teacher_controller_1.updateTeacher);
/**
 * @route   DELETE /api/teacher/:id
 * @desc    Delete teacher
 * @access  Admin
 */
router.delete("/:id", teacher_controller_1.deleteTeacher);
/**
 * @route   DELETE /api/teacher/:id/profile-picture
 * @desc    Delete teacher profile picture
 * @access  Admin/School
 */
router.delete("/:id/profile-picture", teacher_controller_1.deleteTeacherProfilePicture);
exports.default = router;
//# sourceMappingURL=teacher.routes.js.map