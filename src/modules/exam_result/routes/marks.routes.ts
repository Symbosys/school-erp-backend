import { Router } from "express";
import {
  enterMarks,
  getMarksBySubject,
  getMarksByStudent,
  getMarksByExam,
  updateMark,
  deleteMark,
} from "../controllers/marks.controller";

const router = Router();

router.post("/", enterMarks);
router.get("/subject/:examSubjectId", getMarksBySubject);
router.get("/student/:studentId", getMarksByStudent);
router.get("/exam/:examId", getMarksByExam);
router.put("/:id", updateMark);
router.delete("/:id", deleteMark);

export default router;
