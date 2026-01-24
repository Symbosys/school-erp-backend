import { Router } from "express";
import {
  createHoliday,
  getHolidaysByAcademicYear,
  getCurrentYearHolidays,
  checkHoliday,
  getHolidayById,
  updateHoliday,
  deleteHoliday,
  bulkCreateHolidays,
} from "../controllers/holiday.controller";

const router = Router();

/**
 * @route   POST /api/school/holiday
 * @desc    Create a new holiday
 * @access  Admin/School
 */
router.post("/", createHoliday);

/**
 * @route   POST /api/school/holiday/bulk
 * @desc    Bulk create holidays
 * @access  Admin/School
 */
router.post("/bulk", bulkCreateHolidays);

/**
 * @route   GET /api/school/holiday/academic-year/:academicYearId
 * @desc    Get all holidays for a specific academic year
 * @access  Admin/School
 */
router.get("/academic-year/:academicYearId", getHolidaysByAcademicYear);

/**
 * @route   GET /api/school/holiday/school/:schoolId/current
 * @desc    Get current academic year holidays
 * @access  Admin/School
 */
router.get("/school/:schoolId/current", getCurrentYearHolidays);

/**
 * @route   GET /api/school/holiday/check/:academicYearId/:date
 * @desc    Check if a date is a holiday
 * @access  Admin/School
 */
router.get("/check/:academicYearId/:date", checkHoliday);

/**
 * @route   GET /api/school/holiday/:id
 * @desc    Get holiday by ID
 * @access  Admin/School
 */
router.get("/:id", getHolidayById);

/**
 * @route   PUT /api/school/holiday/:id
 * @desc    Update holiday
 * @access  Admin/School
 */
router.put("/:id", updateHoliday);

/**
 * @route   DELETE /api/school/holiday/:id
 * @desc    Delete holiday
 * @access  Admin
 */
router.delete("/:id", deleteHoliday);

export default router;
