"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const timeSlot_controller_1 = require("../controllers/timeSlot.controller");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/school/time-slot
 * @desc    Create a new time slot
 * @access  Admin/School
 */
router.post("/", timeSlot_controller_1.createTimeSlot);
/**
 * @route   POST /api/school/time-slot/bulk
 * @desc    Bulk create time slots
 * @access  Admin/School
 */
router.post("/bulk", timeSlot_controller_1.bulkCreateTimeSlots);
/**
 * @route   GET /api/school/time-slot/school/:schoolId
 * @desc    Get all time slots for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", timeSlot_controller_1.getTimeSlotsBySchool);
/**
 * @route   GET /api/school/time-slot/:id
 * @desc    Get time slot by ID
 * @access  Admin/School
 */
router.get("/:id", timeSlot_controller_1.getTimeSlotById);
/**
 * @route   PUT /api/school/time-slot/:id
 * @desc    Update time slot
 * @access  Admin/School
 */
router.put("/:id", timeSlot_controller_1.updateTimeSlot);
/**
 * @route   DELETE /api/school/time-slot/:id
 * @desc    Delete time slot
 * @access  Admin
 */
router.delete("/:id", timeSlot_controller_1.deleteTimeSlot);
exports.default = router;
//# sourceMappingURL=timeSlot.routes.js.map