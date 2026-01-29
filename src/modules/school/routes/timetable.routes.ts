import { Router } from "express";
import {
  createTimetable,
  createSectionOverride,
  getClassTimetable,
  getSectionTimetable,
  getTimetableById,
  updateTimetable,
  deleteTimetable,
  addTimetableEntry,
  updateTimetableEntry,
  deleteTimetableEntry,
  getTeacherTimetable,
} from "../controllers/timetable.controller";


const router = Router();

// ==========================================
// TIMETABLE MANAGEMENT
// ==========================================

/**
 * @route   POST /api/school/timetable
 * @desc    Create class-level timetable
 * @access  Admin/School
 */
router.post("/", createTimetable);

/**
 * @route   POST /api/school/timetable/override
 * @desc    Create section-specific override
 * @access  Admin/School
 */
router.post("/override", createSectionOverride);

/**
 * @route   GET /api/school/timetable/class/:classId
 * @desc    Get class-level default timetable
 * @query   academicYearId (required)
 * @access  Admin/School
 */
router.get("/class/:classId", getClassTimetable);

/**
 * @route   GET /api/school/timetable/section/:sectionId
 * @desc    Get timetable for section (with override logic)
 * @query   academicYearId (required)
 * @access  Admin/School
 */
router.get("/section/:sectionId", getSectionTimetable);

/**
 * @route   GET /api/school/timetable/teacher/:teacherId
 * @desc    Get timetable for teacher
 * @query   academicYearId (required)
 * @access  Teacher/Admin
 */
router.get("/teacher/:teacherId", getTeacherTimetable);


/**
 * @route   GET /api/school/timetable/:id
 * @desc    Get timetable details
 * @access  Admin/School
 */
router.get("/:id", getTimetableById);

/**
 * @route   PUT /api/school/timetable/:id
 * @desc    Update timetable
 * @access  Admin/School
 */
router.put("/:id", updateTimetable);

/**
 * @route   DELETE /api/school/timetable/:id
 * @desc    Delete timetable
 * @access  Admin
 */
router.delete("/:id", deleteTimetable);

// ==========================================
// ENTRY MANAGEMENT
// ==========================================

/**
 * @route   POST /api/school/timetable/entry
 * @desc    Add single entry
 * @access  Admin/School
 */
router.post("/entry", addTimetableEntry);

/**
 * @route   PUT /api/school/timetable/entry/:id
 * @desc    Update entry
 * @access  Admin/School
 */
router.put("/entry/:id", updateTimetableEntry);

/**
 * @route   DELETE /api/school/timetable/entry/:id
 * @desc    Delete entry
 * @access  Admin
 */
router.delete("/entry/:id", deleteTimetableEntry);

export default router;
