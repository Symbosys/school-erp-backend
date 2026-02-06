"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const subject_controller_1 = require("../controllers/subject.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/school/subject
 * @desc    Create a new subject
 * @access  Admin/School
 */
router.post("/", subject_controller_1.createSubject);
/**
 * @route   POST /api/school/subject/assign-to-class
 * @desc    Assign subject to a class
 * @access  Admin/School
 */
router.post("/assign-to-class", subject_controller_1.assignSubjectToClass);
/**
 * @route   GET /api/school/subject/school/:schoolId
 * @desc    Get all subjects for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", subject_controller_1.getSubjectsBySchool);
/**
 * @route   GET /api/school/subject/class/:classId
 * @desc    Get all subjects for a class
 * @access  Admin/School
 */
router.get("/class/:classId", subject_controller_1.getSubjectsByClass);
/**
 * @route   GET /api/school/subject/:id
 * @desc    Get subject by ID
 * @access  Admin/School
 */
router.get("/:id", subject_controller_1.getSubjectById);
/**
 * @route   PUT /api/school/subject/:id
 * @desc    Update subject
 * @access  Admin/School
 */
router.put("/:id", subject_controller_1.updateSubject);
/**
 * @route   PUT /api/school/subject/class-subject/:id
 * @desc    Update class subject assignment
 * @access  Admin/School
 */
router.put("/class-subject/:id", subject_controller_1.updateClassSubject);
/**
 * @route   DELETE /api/school/subject/:id
 * @desc    Delete subject
 * @access  Admin
 */
router.delete("/:id", subject_controller_1.deleteSubject);
/**
 * @route   DELETE /api/school/subject/class-subject/:id
 * @desc    Remove subject from class
 * @access  Admin
 */
router.delete("/class-subject/:id", subject_controller_1.removeSubjectFromClass);
exports.default = router;
//# sourceMappingURL=subject.routes.js.map