import { Router } from "express";
import {
  createSection,
  getSectionsByClass,
  getSectionsBySchool,
  getSectionById,
  updateSection,
  deleteSection,
} from "../controllers/section.controller";

const router = Router();

/**
 * @route   POST /api/school/section
 * @desc    Create a new section
 * @access  Admin/School
 */
router.post("/", createSection);

/**
 * @route   GET /api/school/section/class/:classId
 * @desc    Get all sections for a class
 * @access  Admin/School
 */
router.get("/class/:classId", getSectionsByClass);

/**
 * @route   GET /api/school/section/school/:schoolId
 * @desc    Get all sections for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getSectionsBySchool);

/**
 * @route   GET /api/school/section/:id
 * @desc    Get section by ID
 * @access  Admin/School
 */
router.get("/:id", getSectionById);

/**
 * @route   PUT /api/school/section/:id
 * @desc    Update section
 * @access  Admin/School
 */
router.put("/:id", updateSection);

/**
 * @route   DELETE /api/school/section/:id
 * @desc    Delete section
 * @access  Admin
 */
router.delete("/:id", deleteSection);

export default router;
