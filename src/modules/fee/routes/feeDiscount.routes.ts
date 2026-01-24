import { Router } from "express";
import {
  createFeeDiscount,
  getDiscountsByStudent,
  getDiscountsBySchool,
  getFeeDiscountById,
  updateFeeDiscount,
  deleteFeeDiscount,
} from "../controllers/feeDiscount.controller";

const router = Router();

router.post("/", createFeeDiscount);
router.get("/school/:schoolId", getDiscountsBySchool);
router.get("/student/:studentId", getDiscountsByStudent);
router.get("/:id", getFeeDiscountById);
router.put("/:id", updateFeeDiscount);
router.delete("/:id", deleteFeeDiscount);

export default router;
