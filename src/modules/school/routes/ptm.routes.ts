import { Router } from "express";
import {
  createPTM,
  getAllPTMs,
  getPTMById,
  updatePTM,
  deletePTM
} from "../controllers/ptm.controller";
import { authenticateSchool } from "../middlewares/auth.middleware";

const router = Router();

// Protect all routes
router.use(authenticateSchool);

router.post("/", createPTM);
router.get("/:schoolId", getAllPTMs);
router.get("/:id", getPTMById);
router.patch("/:id", updatePTM);
router.delete("/:id", deletePTM);

export default router;
