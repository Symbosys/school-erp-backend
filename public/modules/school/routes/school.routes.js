"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const school_controller_1 = require("../controllers/school.controller");
const multer_middleware_1 = require("../../../middlewares/multer.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/school/onboard
 * @desc    Onboard a new school
 * @access  Admin
 */
router.post("/onboard", multer_middleware_1.Upload.single("logo"), school_controller_1.onboardSchool);
/**
 * @route   GET /api/school
 * @desc    Get all schools with pagination and filters
 * @access  Admin
 */
router.get("/", school_controller_1.getAllSchools);
/**
 * @route   GET /api/school/:id
 * @desc    Get school by ID
 * @access  Admin/School
 */
router.get("/:id", school_controller_1.getSchoolById);
/**
 * @route   PUT /api/school/:id
 * @desc    Update school details
 * @access  Admin/School
 */
router.put("/:id", multer_middleware_1.Upload.single("logo"), school_controller_1.updateSchool);
/**
 * @route   PATCH /api/school/:id/status
 * @desc    Toggle school active status
 * @access  Admin
 */
router.patch("/:id/status", school_controller_1.toggleSchoolStatus);
/**
 * @route   PATCH /api/school/:id/subscription
 * @desc    Update school subscription
 * @access  Admin
 */
router.patch("/:id/subscription", school_controller_1.updateSubscription);
/**
 * @route   DELETE /api/school/:id/logo
 * @desc    Delete school logo
 * @access  Admin/School
 */
router.delete("/:id/logo", school_controller_1.deleteSchoolLogo);
exports.default = router;
//# sourceMappingURL=school.routes.js.map