import { Router } from "express";
import {
  onboardTeacher,
  getTeachersBySchool,
  getTeacherById,
  updateTeacher,
  deleteTeacher,
  deleteTeacherProfilePicture,
} from "../controllers/teacher.controller";
import { Upload } from "../../../middlewares/multer.middleware";

const router = Router();

/**
 * @route   POST /api/teacher/onboard
 * @desc    Onboard a new teacher
 * @access  Admin/School
 */
router.post("/onboard", Upload.single("profilePicture"), onboardTeacher);

/**
 * @route   GET /api/teacher/school/:schoolId
 * @desc    Get all teachers for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getTeachersBySchool);

/**
 * @route   GET /api/teacher/:id
 * @desc    Get teacher by ID
 * @access  Admin/School
 */
router.get("/:id", getTeacherById);

/**
 * @route   PUT /api/teacher/:id
 * @desc    Update teacher details
 * @access  Admin/School
 */
router.put("/:id", Upload.single("profilePicture"), updateTeacher);

/**
 * @route   DELETE /api/teacher/:id
 * @desc    Delete teacher
 * @access  Admin
 */
router.delete("/:id", deleteTeacher);

/**
 * @route   DELETE /api/teacher/:id/profile-picture
 * @desc    Delete teacher profile picture
 * @access  Admin/School
 */
router.delete("/:id/profile-picture", deleteTeacherProfilePicture);

export default router;
