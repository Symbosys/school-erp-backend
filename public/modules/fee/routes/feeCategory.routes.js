"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feeCategory_controller_1 = require("../controllers/feeCategory.controller");
const router = (0, express_1.Router)();
router.post("/", feeCategory_controller_1.createFeeCategory);
router.get("/school/:schoolId", feeCategory_controller_1.getFeeCategoriesBySchool);
router.get("/:id", feeCategory_controller_1.getFeeCategoryById);
router.put("/:id", feeCategory_controller_1.updateFeeCategory);
router.delete("/:id", feeCategory_controller_1.deleteFeeCategory);
exports.default = router;
//# sourceMappingURL=feeCategory.routes.js.map