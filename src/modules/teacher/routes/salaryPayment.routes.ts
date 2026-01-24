import { Router } from "express";
import {
  recordSalaryPayment,
  getPaymentsByTeacher,
  getPaymentById,
} from "../controllers/salaryPayment.controller";

const router = Router();

router.post("/", recordSalaryPayment);
router.get("/teacher/:teacherId", getPaymentsByTeacher);
router.get("/:id", getPaymentById);

export default router;
