import { Router } from "express";
import {
  issueBook,
  returnBook,
  getIssuesBySchool,
  getIssuesByStudent,
  getIssuesByTeacher,
  getOverdueBooks,
  createFine,
  payFine,
  getUnpaidFines,
} from "../controllers/bookIssue.controller";

const router = Router();

// Issue/Return
router.post("/issue", issueBook);
router.post("/return", returnBook);

// Issue queries
router.get("/school/:schoolId", getIssuesBySchool);
router.get("/student/:studentId", getIssuesByStudent);
router.get("/teacher/:teacherId", getIssuesByTeacher);
router.get("/overdue/:schoolId", getOverdueBooks);

// Fines
router.post("/fine", createFine);
router.post("/fine/pay", payFine);
router.get("/fine/unpaid/:schoolId", getUnpaidFines);

export default router;
