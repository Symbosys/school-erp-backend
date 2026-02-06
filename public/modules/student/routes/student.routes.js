"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const student_controller_1 = require("../controllers/student.controller");
const multer_middleware_1 = require("../../../middlewares/multer.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/student/onboard
 * @desc    Onboard a new student
 * @access  Admin/School
 */
router.post("/onboard", multer_middleware_1.Upload.single("profilePicture"), student_controller_1.onboardStudent);
/**
 * @route   GET /api/student/school/:schoolId
 * @desc    Get all students for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", student_controller_1.getStudentsBySchool);
/**
 * @route   GET /api/student/:id
 * @desc    Get student by ID
 * @access  Admin/School
 */
router.get("/:id", student_controller_1.getStudentById);
/**
 * @route   PUT /api/student/:id
 * @desc    Update student details
 * @access  Admin/School
 */
router.put("/:id", multer_middleware_1.Upload.single("profilePicture"), student_controller_1.updateStudent);
/**
 * @route   DELETE /api/student/:id
 * @desc    Delete student
 * @access  Admin
 */
router.delete("/:id", student_controller_1.deleteStudent);
exports.default = router;
//# sourceMappingURL=student.routes.js.map