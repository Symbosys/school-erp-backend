"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const notice_controller_1 = require("../controllers/notice.controller");
const multer_middleware_1 = require("../../../middlewares/multer.middleware");
const router = (0, express_1.Router)();
/**
 * @route   POST /api/school/notice
 * @desc    Create a new notice with optional attachment
 * @access  Admin/School
 */
router.post("/", multer_middleware_1.Upload.single("attachment"), notice_controller_1.createNotice);
/**
 * @route   GET /api/school/notice/school/:schoolId
 * @desc    Get all notices for a school
 * @access  Admin/School/Student/Parent
 */
router.get("/school/:schoolId", notice_controller_1.getNoticesBySchool);
/**
 * @route   PUT /api/school/notice/:id
 * @desc    Update a notice
 * @access  Admin/School
 */
router.put("/:id", multer_middleware_1.Upload.single("attachment"), notice_controller_1.updateNotice);
/**
 * @route   DELETE /api/school/notice/:id
 * @desc    Delete a notice
 * @access  Admin/School
 */
router.delete("/:id", notice_controller_1.deleteNotice);
exports.default = router;
//# sourceMappingURL=notice.routes.js.map