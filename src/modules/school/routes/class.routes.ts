import { Router } from "express";
import {
  createClass,
  getClassesBySchool,
  getClassById,
  updateClass,
  deleteClass,
} from "../controllers/class.controller";

const router = Router();

/**
 * @route   POST /api/school/class
 * @desc    Create a new class
 * @access  Admin/School
 */
router.post("/", createClass);

/**
 * @route   GET /api/school/class/school/:schoolId
 * @desc    Get all classes for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getClassesBySchool);

/**
 * @route   GET /api/school/class/:id
 * @desc    Get class by ID
 * @access  Admin/School
 */
router.get("/:id", getClassById);

/**
 * @route   PUT /api/school/class/:id
 * @desc    Update class
 * @access  Admin/School
 */
router.put("/:id", updateClass);

/**
 * @route   DELETE /api/school/class/:id
 * @desc    Delete class
 * @access  Admin
 */
router.delete("/:id", deleteClass);

export default router;
