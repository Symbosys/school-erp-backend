import { Router } from "express";
import {
  createExam,
  getExamsBySchool,
  getExamById,
  updateExam,
  deleteExam,
  addExamSubject,
  removeExamSubject,
} from "../controllers/exam.controller";

const router = Router();

router.post("/", createExam);
router.get("/school/:schoolId", getExamsBySchool);
router.get("/:id", getExamById);
router.put("/:id", updateExam);
router.delete("/:id", deleteExam);

// Exam Subjects
router.post("/subject", addExamSubject);
router.delete("/subject/:id", removeExamSubject);

export default router;
