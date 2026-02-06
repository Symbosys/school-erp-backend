"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookCategory_controller_1 = require("../controllers/bookCategory.controller");
const router = (0, express_1.Router)();
router.post("/", bookCategory_controller_1.createBookCategory);
router.get("/school/:schoolId", bookCategory_controller_1.getBookCategoriesBySchool);
router.get("/:id", bookCategory_controller_1.getBookCategoryById);
router.put("/:id", bookCategory_controller_1.updateBookCategory);
router.delete("/:id", bookCategory_controller_1.deleteBookCategory);
exports.default = router;
//# sourceMappingURL=bookCategory.routes.js.map