import { Router } from "express";
import {
  applyLeave,
  getMyLeaves,
  getAllLeaves,
  updateLeaveStatus,
  deleteLeave
} from "../controller/leave.controller";
import { Upload } from "../../../middlewares/multer.middleware";
import { protectLeaveRoutes } from "../middleware/leave.middleware";

const router = Router();

// Apply authentication to all leave routes
router.use(protectLeaveRoutes);

/**
 * @route   POST /api/common/leave
 * @desc    Apply for leave
 * @access  Student/Teacher
 */
router.post("/", Upload.single("attachment"), applyLeave);

/**
 * @route   GET /api/common/leave/my-leaves
 * @desc    Get my leaves
 * @access  Student/Teacher
 */
router.get("/my-leaves", getMyLeaves);

/**
 * @route   GET /api/common/leave/school/:schoolId
 * @desc    Get all leaves (Admin)
 * @access  Admin
 */
router.get("/school/:schoolId", getAllLeaves);

/**
 * @route   PATCH /api/common/leave/:id/status
 * @desc    Update status (Approve/Reject)
 * @access  Admin/Teacher
 */
router.patch("/:id/status", updateLeaveStatus);

/**
 * @route   DELETE /api/common/leave/:id
 * @desc    Delete leave
 * @access  Owner/Admin
 */
router.delete("/:id", deleteLeave);

export default router;
