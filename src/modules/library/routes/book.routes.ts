import { Router } from "express";
import {
  createBook,
  getBooksBySchool,
  getBookById,
  updateBook,
  deleteBook,
} from "../controllers/book.controller";

const router = Router();

router.post("/", createBook);
router.get("/school/:schoolId", getBooksBySchool);
router.get("/:id", getBookById);
router.put("/:id", updateBook);
router.delete("/:id", deleteBook);

export default router;
