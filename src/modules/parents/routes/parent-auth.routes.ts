import { Router } from "express";
import { 
  parentLogin, 
  parentLogout, 
  getParentProfile,
  updateParentFcmToken
} from "../controllers/parent-auth.controller";
import { authenticateParent } from "../middlewares/parent-auth.middleware";

const router = Router();

// Public routes
router.post("/login", parentLogin);

// Protected routes
router.post("/logout", authenticateParent, parentLogout);
router.get("/profile", authenticateParent, getParentProfile);
router.put("/fcm-token", authenticateParent, updateParentFcmToken);

export default router;
