import { Router } from "express";
import {
  createNotice,
  getNoticesBySchool,
  updateNotice,
  deleteNotice
} from "../controllers/notice.controller";
import { Upload } from "../../../middlewares/multer.middleware";

const router = Router();

/**
 * @route   POST /api/school/notice
 * @desc    Create a new notice with optional attachment
 * @access  Admin/School
 */
router.post("/", Upload.single("attachment"), createNotice);

/**
 * @route   GET /api/school/notice/school/:schoolId
 * @desc    Get all notices for a school
 * @access  Admin/School/Student/Parent
 */
router.get("/school/:schoolId", getNoticesBySchool);

/**
 * @route   PUT /api/school/notice/:id
 * @desc    Update a notice
 * @access  Admin/School
 */
router.put("/:id", Upload.single("attachment"), updateNotice);

/**
 * @route   DELETE /api/school/notice/:id
 * @desc    Delete a notice
 * @access  Admin/School
 */
router.delete("/:id", deleteNotice);

export default router;
