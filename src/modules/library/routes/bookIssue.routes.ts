import { Router } from "express";
import {
  issueBook,
  returnBook,
  getBorrowRecordsBySchool,
  getBorrowHistoryByStudent,
  getBorrowHistoryByTeacher,
  createFine,
  payFine,
  getUnpaidFinesBySchool,
  getFinesByStudent,
  getFinesByTeacher,
} from "../controllers/bookIssue.controller";

const router = Router();

// Borrow/Return
router.post("/issue", issueBook);
router.post("/return", returnBook);

// Borrow History Queries
router.get("/school/:schoolId", getBorrowRecordsBySchool);
router.get("/student/:studentId", getBorrowHistoryByStudent);
router.get("/teacher/:teacherId", getBorrowHistoryByTeacher);

// Fines
router.post("/fine", createFine);
router.post("/fine/pay", payFine);
router.get("/fine/unpaid/:schoolId", getUnpaidFinesBySchool);
router.get("/fine/student/:studentId", getFinesByStudent);
router.get("/fine/teacher/:teacherId", getFinesByTeacher);

export default router;
