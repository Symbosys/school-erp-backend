"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feePayment_controller_1 = require("../controllers/feePayment.controller");
const router = (0, express_1.Router)();
router.post("/", feePayment_controller_1.recordFeePayment);
router.post("/auto-allocate", feePayment_controller_1.recordPaymentAutoAllocate);
router.get("/student/:studentId", feePayment_controller_1.getPaymentsByStudent);
router.get("/receipt/:receiptNumber", feePayment_controller_1.getPaymentByReceipt);
router.get("/:id", feePayment_controller_1.getPaymentById);
exports.default = router;
//# sourceMappingURL=feePayment.routes.js.map