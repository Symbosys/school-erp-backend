import { Router } from "express";
import { getMyPTMs } from "../controllers/ptm.controller";
import { authenticateParent } from "../middlewares/parent-auth.middleware";

const router = Router();

// Apply auth middleware to all routes
router.use(authenticateParent);

router.get("/my-meetings", getMyPTMs);

export default router;
