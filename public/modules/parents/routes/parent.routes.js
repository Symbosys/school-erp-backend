"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parent_controller_1 = require("../controllers/parent.controller");
const multer_middleware_1 = require("../../../middlewares/multer.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/parents
 * @desc    Onboard new parent
 * @access  Admin/School
 */
router.post("/", multer_middleware_1.Upload.single("profilePicture"), parent_controller_1.createParent);
/**
 * @route   GET /api/parents/school/:schoolId
 * @desc    Get all parents for a school
 * @access  Admin/School
 */
router.get("/school/:schoolId", parent_controller_1.getParentsBySchool);
/**
 * @route   GET /api/parents/:id
 * @desc    Get parent by ID
 * @access  Admin/School
 */
router.get("/:id", parent_controller_1.getParentById);
/**
 * @route   PUT /api/parents/:id
 * @desc    Update parent details
 * @access  Admin/School
 */
router.put("/:id", multer_middleware_1.Upload.single("profilePicture"), parent_controller_1.updateParent);
/**
 * @route   DELETE /api/parents/:id
 * @desc    Delete parent
 * @access  Admin
 */
router.delete("/:id", parent_controller_1.deleteParent);
exports.default = router;
//# sourceMappingURL=parent.routes.js.map