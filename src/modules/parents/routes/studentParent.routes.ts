import { Router } from "express";
import {
  assignParentToStudent,
  getParentsByStudent,
  updateStudentParentRelation,
  removeParentFromStudent,
} from "../controllers/studentParent.controller";

const router = Router();

/**
 * @route   POST /api/parents/relation
 * @desc    Assign parent to student
 * @access  Admin/School
 */
router.post("/", assignParentToStudent);

/**
 * @route   GET /api/parents/relation/student/:studentId
 * @desc    Get all parents for a student
 * @access  Admin/School
 */
router.get("/student/:studentId", getParentsByStudent);

/**
 * @route   PUT /api/parents/relation/:id
 * @desc    Update relationship details
 * @access  Admin/School
 */
router.put("/:id", updateStudentParentRelation);

/**
 * @route   DELETE /api/parents/relation/:id
 * @desc    Remove parent from student
 * @access  Admin/School
 */
router.delete("/:id", removeParentFromStudent);

export default router;
