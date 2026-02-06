"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timetable_controller_1 = require("../controllers/timetable.controller");
const router = (0, express_1.Router)();
// ==========================================
// TIMETABLE MANAGEMENT
// ==========================================
/**
 * @route   POST /api/school/timetable
 * @desc    Create class-level timetable
 * @access  Admin/School
 */
router.post("/", timetable_controller_1.createTimetable);
/**
 * @route   POST /api/school/timetable/override
 * @desc    Create section-specific override
 * @access  Admin/School
 */
router.post("/override", timetable_controller_1.createSectionOverride);
/**
 * @route   GET /api/school/timetable/class/:classId
 * @desc    Get class-level default timetable
 * @query   academicYearId (required)
 * @access  Admin/School
 */
router.get("/class/:classId", timetable_controller_1.getClassTimetable);
/**
 * @route   GET /api/school/timetable/section/:sectionId
 * @desc    Get timetable for section (with override logic)
 * @query   academicYearId (required)
 * @access  Admin/School
 */
router.get("/section/:sectionId", timetable_controller_1.getSectionTimetable);
/**
 * @route   GET /api/school/timetable/teacher/:teacherId
 * @desc    Get timetable for teacher
 * @query   academicYearId (required)
 * @access  Teacher/Admin
 */
router.get("/teacher/:teacherId", timetable_controller_1.getTeacherTimetable);
/**
 * @route   GET /api/school/timetable/:id
 * @desc    Get timetable details
 * @access  Admin/School
 */
router.get("/:id", timetable_controller_1.getTimetableById);
/**
 * @route   PUT /api/school/timetable/:id
 * @desc    Update timetable
 * @access  Admin/School
 */
router.put("/:id", timetable_controller_1.updateTimetable);
/**
 * @route   DELETE /api/school/timetable/:id
 * @desc    Delete timetable
 * @access  Admin
 */
router.delete("/:id", timetable_controller_1.deleteTimetable);
// ==========================================
// ENTRY MANAGEMENT
// ==========================================
/**
 * @route   POST /api/school/timetable/entry
 * @desc    Add single entry
 * @access  Admin/School
 */
router.post("/entry", timetable_controller_1.addTimetableEntry);
/**
 * @route   PUT /api/school/timetable/entry/:id
 * @desc    Update entry
 * @access  Admin/School
 */
router.put("/entry/:id", timetable_controller_1.updateTimetableEntry);
/**
 * @route   DELETE /api/school/timetable/entry/:id
 * @desc    Delete entry
 * @access  Admin
 */
router.delete("/entry/:id", timetable_controller_1.deleteTimetableEntry);
exports.default = router;
//# sourceMappingURL=timetable.routes.js.map