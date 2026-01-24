import { Router } from "express";
import {
  generateResults,
  getResultsByExam,
  getResultsByStudent,
  getResultById,
} from "../controllers/result.controller";

const router = Router();

router.post("/generate", generateResults);
router.get("/exam/:examId", getResultsByExam);
router.get("/student/:studentId", getResultsByStudent);
router.get("/:id", getResultById);

export default router;
