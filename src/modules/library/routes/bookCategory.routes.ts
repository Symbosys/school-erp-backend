import { Router } from "express";
import {
  createBookCategory,
  getBookCategoriesBySchool,
  getBookCategoryById,
  updateBookCategory,
  deleteBookCategory,
} from "../controllers/bookCategory.controller";

const router = Router();

router.post("/", createBookCategory);
router.get("/school/:schoolId", getBookCategoriesBySchool);
router.get("/:id", getBookCategoryById);
router.put("/:id", updateBookCategory);
router.delete("/:id", deleteBookCategory);

export default router;
