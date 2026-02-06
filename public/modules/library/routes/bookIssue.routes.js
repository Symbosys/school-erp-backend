"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bookIssue_controller_1 = require("../controllers/bookIssue.controller");
const router = (0, express_1.Router)();
// Borrow/Return
router.post("/issue", bookIssue_controller_1.issueBook);
router.post("/return", bookIssue_controller_1.returnBook);
// Borrow History Queries
router.get("/school/:schoolId", bookIssue_controller_1.getBorrowRecordsBySchool);
router.get("/student/:studentId", bookIssue_controller_1.getBorrowHistoryByStudent);
router.get("/teacher/:teacherId", bookIssue_controller_1.getBorrowHistoryByTeacher);
// Fines
router.post("/fine", bookIssue_controller_1.createFine);
router.post("/fine/pay", bookIssue_controller_1.payFine);
router.get("/fine/unpaid/:schoolId", bookIssue_controller_1.getUnpaidFinesBySchool);
router.get("/fine/student/:studentId", bookIssue_controller_1.getFinesByStudent);
router.get("/fine/teacher/:teacherId", bookIssue_controller_1.getFinesByTeacher);
exports.default = router;
//# sourceMappingURL=bookIssue.routes.js.map