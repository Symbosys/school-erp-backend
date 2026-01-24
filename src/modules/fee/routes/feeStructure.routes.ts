import { Router } from "express";
import {
  createFeeStructure,
  getFeeStructuresBySchool,
  getFeeStructureById,
  updateFeeStructure,
  deleteFeeStructure,
  addFeeStructureItem,
  removeFeeStructureItem,
} from "../controllers/feeStructure.controller";

const router = Router();

router.post("/", createFeeStructure);
router.get("/school/:schoolId", getFeeStructuresBySchool);
router.get("/:id", getFeeStructureById);
router.put("/:id", updateFeeStructure);
router.delete("/:id", deleteFeeStructure);

// Fee Structure Items
router.post("/item", addFeeStructureItem);
router.delete("/item/:id", removeFeeStructureItem);

export default router;
