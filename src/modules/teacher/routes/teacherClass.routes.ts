import { Router } from "express";
import {
  assignTeacherToClass,
  getAssignmentsByTeacher,
  removeTeacherFromClass,
} from "../controllers/teacherClass.controller";

const router = Router();

/**
 * @route   POST /api/teacher/class-assignment
 * @desc    Assign teacher to class/section
 * @access  Admin/School
 */
router.post("/", assignTeacherToClass);

/**
 * @route   GET /api/teacher/class-assignment/teacher/:teacherId
 * @desc    Get assignments by teacher
 * @access  Admin/School
 */
router.get("/teacher/:teacherId", getAssignmentsByTeacher);

/**
 * @route   DELETE /api/teacher/class-assignment/:id
 * @desc    Remove teacher from class
 * @access  Admin/School
 */
router.delete("/:id", removeTeacherFromClass);

export default router;
