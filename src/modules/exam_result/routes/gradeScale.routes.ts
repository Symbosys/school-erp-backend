import { Router } from "express";
import {
  createGradeScale,
  getGradeScalesBySchool,
  getGradeScaleById,
  updateGradeScale,
  deleteGradeScale,
} from "../controllers/gradeScale.controller";

const router = Router();

router.post("/", createGradeScale);
router.get("/school/:schoolId", getGradeScalesBySchool);
router.get("/:id", getGradeScaleById);
router.put("/:id", updateGradeScale);
router.delete("/:id", deleteGradeScale);

export default router;
