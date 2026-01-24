import { Router } from "express";
import { 
  studentLogin, 
  studentLogout, 
  getStudentProfile,
  updateStudentFcmToken
} from "../controllers/student-auth.controller";
import { authenticateStudent } from "../middlewares/student-auth.middleware";

const router = Router();

// Public routes
router.post("/login", studentLogin);

// Protected routes
router.post("/logout", authenticateStudent, studentLogout);
router.get("/profile", authenticateStudent, getStudentProfile);
router.put("/fcm-token", authenticateStudent, updateStudentFcmToken);

export default router;
