import { Router } from "express";
import {
  createSubject,
  getSubjectsBySchool,
  getSubjectById,
  updateSubject,
  deleteSubject,
  assignSubjectToClass,
  getSubjectsByClass,
  updateClassSubject,
  removeSubjectFromClass,
} from "../controllers/subject.controller";

const router = Router();

/**
 * @route   POST /api/school/subject
 * @desc    Create a new subject
 * @access  Admin/School
 */
router.post("/", createSubject);

/**
 * @route   POST /api/school/subject/assign-to-class
 * @desc    Assign subject to a class
 * @access  Admin/School
 */
router.post("/assign-to-class", assignSubjectToClass);

/**
 * @route   GET /api/school/subject/school/:schoolId
 * @desc    Get all subjects for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getSubjectsBySchool);

/**
 * @route   GET /api/school/subject/class/:classId
 * @desc    Get all subjects for a class
 * @access  Admin/School
 */
router.get("/class/:classId", getSubjectsByClass);

/**
 * @route   GET /api/school/subject/:id
 * @desc    Get subject by ID
 * @access  Admin/School
 */
router.get("/:id", getSubjectById);

/**
 * @route   PUT /api/school/subject/:id
 * @desc    Update subject
 * @access  Admin/School
 */
router.put("/:id", updateSubject);

/**
 * @route   PUT /api/school/subject/class-subject/:id
 * @desc    Update class subject assignment
 * @access  Admin/School
 */
router.put("/class-subject/:id", updateClassSubject);

/**
 * @route   DELETE /api/school/subject/:id
 * @desc    Delete subject
 * @access  Admin
 */
router.delete("/:id", deleteSubject);

/**
 * @route   DELETE /api/school/subject/class-subject/:id
 * @desc    Remove subject from class
 * @access  Admin
 */
router.delete("/class-subject/:id", removeSubjectFromClass);

export default router;
