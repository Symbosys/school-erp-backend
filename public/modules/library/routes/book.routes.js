"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const book_controller_1 = require("../controllers/book.controller");
const router = (0, express_1.Router)();
router.post("/", book_controller_1.createBook);
router.get("/school/:schoolId", book_controller_1.getBooksBySchool);
router.get("/:id", book_controller_1.getBookById);
router.put("/:id", book_controller_1.updateBook);
router.delete("/:id", book_controller_1.deleteBook);
exports.default = router;
//# sourceMappingURL=book.routes.js.map