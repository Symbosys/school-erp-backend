import { Router } from "express";
import {
  createParent,
  getParentsBySchool,
  getParentById,
  updateParent,
  deleteParent,
} from "../controllers/parent.controller";
import { Upload } from "../../../middlewares/multer.middleware";

const router = Router();

/**
 * @route   POST /api/parents
 * @desc    Onboard new parent
 * @access  Admin/School
 */
router.post("/", Upload.single("profilePicture"), createParent);

/**
 * @route   GET /api/parents/school/:schoolId
 * @desc    Get all parents for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getParentsBySchool);

/**
 * @route   GET /api/parents/:id
 * @desc    Get parent by ID
 * @access  Admin/School
 */
router.get("/:id", getParentById);

/**
 * @route   PUT /api/parents/:id
 * @desc    Update parent details
 * @access  Admin/School
 */
router.put("/:id", Upload.single("profilePicture"), updateParent);

/**
 * @route   DELETE /api/parents/:id
 * @desc    Delete parent
 * @access  Admin
 */
router.delete("/:id", deleteParent);

export default router;
