import { Router } from "express";
import { authenticateSchool } from "../middlewares/auth.middleware";
import { getSchoolStats } from "../controllers/dashboard.controller";

const router = Router();

router.get("/stats/:id", getSchoolStats);

export default router;
