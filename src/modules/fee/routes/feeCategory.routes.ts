import { Router } from "express";
import {
  createFeeCategory,
  getFeeCategoriesBySchool,
  getFeeCategoryById,
  updateFeeCategory,
  deleteFeeCategory,
} from "../controllers/feeCategory.controller";

const router = Router();

router.post("/", createFeeCategory);
router.get("/school/:schoolId", getFeeCategoriesBySchool);
router.get("/:id", getFeeCategoryById);
router.put("/:id", updateFeeCategory);
router.delete("/:id", deleteFeeCategory);

export default router;
