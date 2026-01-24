import { Router } from "express";
import {
  createSalaryStructure,
  getSalaryStructuresBySchool,
  getSalaryStructureById,
  updateSalaryStructure,
  deleteSalaryStructure,
  addSalaryStructureItem,
  removeSalaryStructureItem,
} from "../controllers/salaryStructure.controller";

const router = Router();

router.post("/", createSalaryStructure);
router.get("/school/:schoolId", getSalaryStructuresBySchool);
router.get("/:id", getSalaryStructureById);
router.put("/:id", updateSalaryStructure);
router.delete("/:id", deleteSalaryStructure);

// Structure Items
router.post("/item", addSalaryStructureItem);
router.delete("/item/:id", removeSalaryStructureItem);

export default router;
