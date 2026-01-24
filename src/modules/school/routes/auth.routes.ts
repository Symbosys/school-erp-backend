import { Router } from "express";
import {
  schoolLogin,
  setPassword,
  getSchoolProfile,
  schoolLogout,
} from "../controllers/auth.controller";
import { authenticateSchool } from "../middlewares/auth.middleware";

const router = Router();

router.post("/login", schoolLogin);
router.post("/set-password/:schoolId", setPassword);
router.get("/profile", authenticateSchool, getSchoolProfile);
router.post("/logout", authenticateSchool, schoolLogout);

export default router;
