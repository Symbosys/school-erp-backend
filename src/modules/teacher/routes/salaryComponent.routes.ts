import { Router } from "express";
import {
  createSalaryComponent,
  getSalaryComponentsBySchool,
  getSalaryComponentById,
  updateSalaryComponent,
  deleteSalaryComponent,
} from "../controllers/salaryComponent.controller";

const router = Router();

router.post("/", createSalaryComponent);
router.get("/school/:schoolId", getSalaryComponentsBySchool);
router.get("/:id", getSalaryComponentById);
router.put("/:id", updateSalaryComponent);
router.delete("/:id", deleteSalaryComponent);

export default router;
