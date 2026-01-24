import { Router } from "express";
import {
  createAcademicYear,
  getAcademicYearsBySchool,
  getAcademicYearById,
  getCurrentAcademicYear,
  updateAcademicYear,
  setCurrentAcademicYear,
  deleteAcademicYear,
} from "../controllers/academicYear.controller";

const router = Router();

/**
 * @route   POST /api/school/academic-year
 * @desc    Create a new academic year
 * @access  Admin/School
 */
router.post("/", createAcademicYear);

/**
 * @route   GET /api/school/academic-year/school/:schoolId
 * @desc    Get all academic years for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getAcademicYearsBySchool);

/**
 * @route   GET /api/school/academic-year/current/:schoolId
 * @desc    Get current academic year for a school
 * @access  Admin/School
 */
router.get("/current/:schoolId", getCurrentAcademicYear);

/**
 * @route   GET /api/school/academic-year/:id
 * @desc    Get academic year by ID
 * @access  Admin/School
 */
router.get("/:id", getAcademicYearById);

/**
 * @route   PUT /api/school/academic-year/:id
 * @desc    Update academic year
 * @access  Admin/School
 */
router.put("/:id", updateAcademicYear);

/**
 * @route   PATCH /api/school/academic-year/:id/set-current
 * @desc    Set academic year as current
 * @access  Admin/School
 */
router.patch("/:id/set-current", setCurrentAcademicYear);

/**
 * @route   DELETE /api/school/academic-year/:id
 * @desc    Delete academic year
 * @access  Admin
 */
router.delete("/:id", deleteAcademicYear);

export default router;
