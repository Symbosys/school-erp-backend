import { Router } from "express";
import {
  recordFeePayment,
  recordPaymentAutoAllocate,
  getPaymentsByStudent,
  getPaymentById,
  getPaymentByReceipt,
} from "../controllers/feePayment.controller";

const router = Router();

router.post("/", recordFeePayment);
router.post("/auto-allocate", recordPaymentAutoAllocate);
router.get("/student/:studentId", getPaymentsByStudent);
router.get("/receipt/:receiptNumber", getPaymentByReceipt);
router.get("/:id", getPaymentById);

export default router;
