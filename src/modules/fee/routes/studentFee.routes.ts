import { Router } from "express";
import {
  assignStudentFee,
  bulkAssignStudentFee,
  getStudentFeesBySchool,
  getStudentFeeById,
  getFeesByStudent,
  updateStudentFee,
} from "../controllers/studentFee.controller";

const router = Router();

router.post("/", assignStudentFee);
router.post("/bulk", bulkAssignStudentFee);
router.get("/school/:schoolId", getStudentFeesBySchool);
router.get("/student/:studentId", getFeesByStudent);
router.get("/:id", getStudentFeeById);
router.put("/:id", updateStudentFee);

export default router;
