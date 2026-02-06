"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const section_controller_1 = require("../controllers/section.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/school/section
 * @desc    Create a new section
 * @access  Admin/School
 */
router.post("/", section_controller_1.createSection);
/**
 * @route   GET /api/school/section/class/:classId
 * @desc    Get all sections for a class
 * @access  Admin/School
 */
router.get("/class/:classId", section_controller_1.getSectionsByClass);
/**
 * @route   GET /api/school/section/school/:schoolId
 * @desc    Get all sections for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", section_controller_1.getSectionsBySchool);
/**
 * @route   GET /api/school/section/:id
 * @desc    Get section by ID
 * @access  Admin/School
 */
router.get("/:id", section_controller_1.getSectionById);
/**
 * @route   PUT /api/school/section/:id
 * @desc    Update section
 * @access  Admin/School
 */
router.put("/:id", section_controller_1.updateSection);
/**
 * @route   DELETE /api/school/section/:id
 * @desc    Delete section
 * @access  Admin
 */
router.delete("/:id", section_controller_1.deleteSection);
exports.default = router;
//# sourceMappingURL=section.routes.js.map