import { Router } from "express";
import {
  assignSubjectToTeacher,
  getSubjectsByTeacher,
  getTeachersBySubject,
  updateTeacherSubject,
  removeSubjectFromTeacher,
} from "../controllers/teacherSubject.controller";

const router = Router();

/**
 * @route   POST /api/teacher/subject
 * @desc    Assign subject to teacher
 * @access  Admin/School
 */
router.post("/", assignSubjectToTeacher);

/**
 * @route   GET /api/teacher/subject/teacher/:teacherId
 * @desc    Get all subjects for a teacher
 * @access  Admin/School
 */
router.get("/teacher/:teacherId", getSubjectsByTeacher);

/**
 * @route   GET /api/teacher/subject/subject/:subjectId
 * @desc    Get all teachers for a subject
 * @access  Admin/School
 */
router.get("/subject/:subjectId", getTeachersBySubject);

/**
 * @route   PUT /api/teacher/subject/:id
 * @desc    Update assignment (isPrimary)
 * @access  Admin/School
 */
router.put("/:id", updateTeacherSubject);

/**
 * @route   DELETE /api/teacher/subject/:id
 * @desc    Remove subject from teacher
 * @access  Admin/School
 */
router.delete("/:id", removeSubjectFromTeacher);

export default router;
