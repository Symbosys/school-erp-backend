"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const leave_controller_1 = require("../controller/leave.controller");
const multer_middleware_1 = require("../../../middlewares/multer.middleware");
const leave_middleware_1 = require("../middleware/leave.middleware");
const router = (0, express_1.Router)();
/**
 * @route   GET /api/common/leave/school/:schoolId
 * @desc    Get all leaves (Admin)
 * @access  Admin
 */
router.get("/school/:schoolId", leave_controller_1.getAllLeaves);
/**
 * @route   PATCH /api/common/leave/:id/status
 * @desc    Update status (Approve/Reject)
 * @access  Admin/Teacher
 */
router.patch("/:id/status", leave_controller_1.updateLeaveStatus);
/**
 * @route   DELETE /api/common/leave/:id
 * @desc    Delete leave
 * @access  Owner/Admin
 */
router.delete("/:id", leave_controller_1.deleteLeave);
// Apply authentication to all leave routes
router.use(leave_middleware_1.protectLeaveRoutes);
/**
 * @route   POST /api/common/leave
 * @desc    Apply for leave
 * @access  Student/Teacher
 */
router.post("/", multer_middleware_1.Upload.single("attachment"), leave_controller_1.applyLeave);
/**
 * @route   GET /api/common/leave/my-leaves
 * @desc    Get my leaves
 * @access  Student/Teacher
 */
router.get("/my-leaves", leave_controller_1.getMyLeaves);
exports.default = router;
//# sourceMappingURL=leave.routes.js.map