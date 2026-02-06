"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const feeStructure_controller_1 = require("../controllers/feeStructure.controller");
const router = (0, express_1.Router)();
router.post("/", feeStructure_controller_1.createFeeStructure);
router.get("/school/:schoolId", feeStructure_controller_1.getFeeStructuresBySchool);
router.get("/:id", feeStructure_controller_1.getFeeStructureById);
router.put("/:id", feeStructure_controller_1.updateFeeStructure);
router.delete("/:id", feeStructure_controller_1.deleteFeeStructure);
// Fee Structure Items
router.post("/item", feeStructure_controller_1.addFeeStructureItem);
router.delete("/item/:id", feeStructure_controller_1.removeFeeStructureItem);
exports.default = router;
//# sourceMappingURL=feeStructure.routes.js.map