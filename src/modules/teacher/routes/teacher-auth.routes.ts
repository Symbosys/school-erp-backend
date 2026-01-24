import { Router } from "express";
import { 
  teacherLogin, 
  teacherLogout, 
  getTeacherProfile,
  updateTeacherFcmToken
} from "../controllers/teacher-auth.controller";
import { authenticateTeacher } from "../middlewares/teacher-auth.middleware";

const router = Router();

// Public routes
router.post("/login", teacherLogin);

// Protected routes
router.post("/logout", authenticateTeacher, teacherLogout);
router.get("/profile", authenticateTeacher, getTeacherProfile);
router.put("/fcm-token", authenticateTeacher, updateTeacherFcmToken);

export default router;
