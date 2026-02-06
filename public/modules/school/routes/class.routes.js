"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const class_controller_1 = require("../controllers/class.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/school/class
 * @desc    Create a new class
 * @access  Admin/School
 */
router.post("/", class_controller_1.createClass);
/**
 * @route   GET /api/school/class/school/:schoolId
 * @desc    Get all classes for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", class_controller_1.getClassesBySchool);
/**
 * @route   GET /api/school/class/:id
 * @desc    Get class by ID
 * @access  Admin/School
 */
router.get("/:id", class_controller_1.getClassById);
/**
 * @route   PUT /api/school/class/:id
 * @desc    Update class
 * @access  Admin/School
 */
router.put("/:id", class_controller_1.updateClass);
/**
 * @route   DELETE /api/school/class/:id
 * @desc    Delete class
 * @access  Admin
 */
router.delete("/:id", class_controller_1.deleteClass);
exports.default = router;
//# sourceMappingURL=class.routes.js.map