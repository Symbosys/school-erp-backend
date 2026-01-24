import { Router } from "express";
import {
  createTimeSlot,
  getTimeSlotsBySchool,
  getTimeSlotById,
  updateTimeSlot,
  deleteTimeSlot,
  bulkCreateTimeSlots,
} from "../controllers/timeSlot.controller";

const router = Router();

/**
 * @route   POST /api/school/time-slot
 * @desc    Create a new time slot
 * @access  Admin/School
 */
router.post("/", createTimeSlot);

/**
 * @route   POST /api/school/time-slot/bulk
 * @desc    Bulk create time slots
 * @access  Admin/School
 */
router.post("/bulk", bulkCreateTimeSlots);

/**
 * @route   GET /api/school/time-slot/school/:schoolId
 * @desc    Get all time slots for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", getTimeSlotsBySchool);

/**
 * @route   GET /api/school/time-slot/:id
 * @desc    Get time slot by ID
 * @access  Admin/School
 */
router.get("/:id", getTimeSlotById);

/**
 * @route   PUT /api/school/time-slot/:id
 * @desc    Update time slot
 * @access  Admin/School
 */
router.put("/:id", updateTimeSlot);

/**
 * @route   DELETE /api/school/time-slot/:id
 * @desc    Delete time slot
 * @access  Admin
 */
router.delete("/:id", deleteTimeSlot);

export default router;
