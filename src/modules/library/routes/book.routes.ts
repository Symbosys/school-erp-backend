import { Router } from "express";
import {
  createBook,
  getBooksBySchool,
  getBookById,
  updateBook,
  deleteBook,
  addBookCopy,
  removeBookCopy,
} from "../controllers/book.controller";

const router = Router();

router.post("/", createBook);
router.get("/school/:schoolId", getBooksBySchool);
router.get("/:id", getBookById);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

// Book Copies
router.post("/copy", addBookCopy);
router.delete("/copy/:id", removeBookCopy);

export default router;
