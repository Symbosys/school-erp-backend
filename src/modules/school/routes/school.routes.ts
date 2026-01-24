import { Router } from "express";
import {
  onboardSchool,
  getSchoolById,
  getAllSchools,
  updateSchool,
  toggleSchoolStatus,
  updateSubscription,
  deleteSchoolLogo,
} from "../controllers/school.controller";
import { Upload } from "../../../middlewares/multer.middleware";

const router = Router();

/**
 * @route   POST /api/school/onboard
 * @desc    Onboard a new school
 * @access  Admin
 */
router.post("/onboard", Upload.single("logo"), onboardSchool);

/**
 * @route   GET /api/school
 * @desc    Get all schools with pagination and filters
 * @access  Admin
 */
router.get("/", getAllSchools);

/**
 * @route   GET /api/school/:id
 * @desc    Get school by ID
 * @access  Admin/School
 */
router.get("/:id", getSchoolById);

/**
 * @route   PUT /api/school/:id
 * @desc    Update school details
 * @access  Admin/School
 */
router.put("/:id", Upload.single("logo"), updateSchool);

/**
 * @route   PATCH /api/school/:id/status
 * @desc    Toggle school active status
 * @access  Admin
 */
router.patch("/:id/status", toggleSchoolStatus);

/**
 * @route   PATCH /api/school/:id/subscription
 * @desc    Update school subscription
 * @access  Admin
 */
router.patch("/:id/subscription", updateSubscription);

/**
 * @route   DELETE /api/school/:id/logo
 * @desc    Delete school logo
 * @access  Admin/School
 */
router.delete("/:id/logo", deleteSchoolLogo);

export default router;
