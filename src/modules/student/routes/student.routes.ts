import { Router } from "express";
import {
  onboardStudent,
  getStudentsBySchool,
  getStudentById,
  updateStudent,
  deleteStudent,
} from "../controllers/student.controller";
import { Upload } from "../../../middlewares/multer.middleware";

const router = Router();

/**
 * @route   POST /api/student/onboard
 * @desc    Onboard a new student
 * @access  Admin/School
 */
router.post("/onboard", Upload.single("profilePicture"), onboardStudent);


/**
 * @route   GET /api/student/school/:schoolId
 * @desc    Get all students for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getStudentsBySchool);

/**
 * @route   GET /api/student/:id
 * @desc    Get student by ID
 * @access  Admin/School
 */
router.get("/:id", getStudentById);

/**
 * @route   PUT /api/student/:id
 * @desc    Update student details
 * @access  Admin/School
 */
router.put("/:id", Upload.single("profilePicture"), updateStudent);

/**
 * @route   DELETE /api/student/:id
 * @desc    Delete student
 * @access  Admin
 */
router.delete("/:id", deleteStudent);

export default router;
