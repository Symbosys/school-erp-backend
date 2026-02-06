"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feeDiscount_controller_1 = require("../controllers/feeDiscount.controller");
const router = (0, express_1.Router)();
router.post("/", feeDiscount_controller_1.createFeeDiscount);
router.get("/school/:schoolId", feeDiscount_controller_1.getDiscountsBySchool);
router.get("/student/:studentId", feeDiscount_controller_1.getDiscountsByStudent);
router.get("/:id", feeDiscount_controller_1.getFeeDiscountById);
router.put("/:id", feeDiscount_controller_1.updateFeeDiscount);
router.delete("/:id", feeDiscount_controller_1.deleteFeeDiscount);
exports.default = router;
//# sourceMappingURL=feeDiscount.routes.js.map