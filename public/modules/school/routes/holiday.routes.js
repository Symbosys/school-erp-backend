"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const holiday_controller_1 = require("../controllers/holiday.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/school/holiday
 * @desc    Create a new holiday
 * @access  Admin/School
 */
router.post("/", holiday_controller_1.createHoliday);
/**
 * @route   POST /api/school/holiday/bulk
 * @desc    Bulk create holidays
 * @access  Admin/School
 */
router.post("/bulk", holiday_controller_1.bulkCreateHolidays);
/**
 * @route   GET /api/school/holiday/academic-year/:academicYearId
 * @desc    Get all holidays for a specific academic year
 * @access  Admin/School
 */
router.get("/academic-year/:academicYearId", holiday_controller_1.getHolidaysByAcademicYear);
/**
 * @route   GET /api/school/holiday/school/:schoolId/current
 * @desc    Get current academic year holidays
 * @access  Admin/School
 */
router.get("/school/:schoolId/current", holiday_controller_1.getCurrentYearHolidays);
/**
 * @route   GET /api/school/holiday/check/:academicYearId/:date
 * @desc    Check if a date is a holiday
 * @access  Admin/School
 */
router.get("/check/:academicYearId/:date", holiday_controller_1.checkHoliday);
/**
 * @route   GET /api/school/holiday/:id
 * @desc    Get holiday by ID
 * @access  Admin/School
 */
router.get("/:id", holiday_controller_1.getHolidayById);
/**
 * @route   PUT /api/school/holiday/:id
 * @desc    Update holiday
 * @access  Admin/School
 */
router.put("/:id", holiday_controller_1.updateHoliday);
/**
 * @route   DELETE /api/school/holiday/:id
 * @desc    Delete holiday
 * @access  Admin
 */
router.delete("/:id", holiday_controller_1.deleteHoliday);
exports.default = router;
//# sourceMappingURL=holiday.routes.js.map