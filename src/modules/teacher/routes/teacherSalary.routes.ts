import { Router } from "express";
import {
  processTeacherSalary,
  bulkProcessSalary,
  getSalariesBySchool,
  getSalaryByTeacher,
  getSalaryById,
  updateTeacherSalary,
} from "../controllers/teacherSalary.controller";

const router = Router();

router.post("/process", processTeacherSalary);
router.post("/process/bulk", bulkProcessSalary);
router.get("/school/:schoolId", getSalariesBySchool);
router.get("/teacher/:teacherId", getSalaryByTeacher);
router.get("/:id", getSalaryById);
router.put("/:id", updateTeacherSalary);

export default router;
