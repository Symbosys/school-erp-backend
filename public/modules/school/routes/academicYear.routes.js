"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const academicYear_controller_1 = require("../controllers/academicYear.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/school/academic-year
 * @desc    Create a new academic year
 * @access  Admin/School
 */
router.post("/", academicYear_controller_1.createAcademicYear);
/**
 * @route   GET /api/school/academic-year/school/:schoolId
 * @desc    Get all academic years for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", academicYear_controller_1.getAcademicYearsBySchool);
/**
 * @route   GET /api/school/academic-year/current/:schoolId
 * @desc    Get current academic year for a school
 * @access  Admin/School
 */
router.get("/current/:schoolId", academicYear_controller_1.getCurrentAcademicYear);
/**
 * @route   GET /api/school/academic-year/:id
 * @desc    Get academic year by ID
 * @access  Admin/School
 */
router.get("/:id", academicYear_controller_1.getAcademicYearById);
/**
 * @route   PUT /api/school/academic-year/:id
 * @desc    Update academic year
 * @access  Admin/School
 */
router.put("/:id", academicYear_controller_1.updateAcademicYear);
/**
 * @route   PATCH /api/school/academic-year/:id/set-current
 * @desc    Set academic year as current
 * @access  Admin/School
 */
router.patch("/:id/set-current", academicYear_controller_1.setCurrentAcademicYear);
/**
 * @route   DELETE /api/school/academic-year/:id
 * @desc    Delete academic year
 * @access  Admin
 */
router.delete("/:id", academicYear_controller_1.deleteAcademicYear);
exports.default = router;
//# sourceMappingURL=academicYear.routes.js.map