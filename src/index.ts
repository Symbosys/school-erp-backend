import express from "express";
import path from "path";
import helmet from "helmet";
import morgan from "morgan";
import cors from "cors";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

import ENV from "./config/env";
import errorMiddleware from "./middlewares/error.middleware";

/**
 * Route Imports - School Module
 */
import schoolRoutes from "./modules/school/routes/school.routes";
import dashboardRoutes from "./modules/school/routes/dashboard.routes";
import schoolAuthRoutes from "./modules/school/routes/auth.routes";
import academicYearRoutes from "./modules/school/routes/academicYear.routes";
import classRoutes from "./modules/school/routes/class.routes";
import sectionRoutes from "./modules/school/routes/section.routes";
import subjectRoutes from "./modules/school/routes/subject.routes";
import holidayRoutes from "./modules/school/routes/holiday.routes";
import noticeRoutes from "./modules/school/routes/notice.routes";
import schoolPtmRoutes from "./modules/school/routes/ptm.routes";
import timeSlotRoutes from "./modules/school/routes/timeSlot.routes";
import timetableRoutes from "./modules/school/routes/timetable.routes";

/**
 * Route Imports - Teacher Module
 */
import teacherRoutes from "./modules/teacher/routes/teacher.routes";
import teacherSubjectRoutes from "./modules/teacher/routes/teacherSubject.routes";
import teacherClassRoutes from "./modules/teacher/routes/teacherClass.routes";
import teacherAttendanceRoutes from "./modules/teacher/routes/attendance.routes";
import salaryComponentRoutes from "./modules/teacher/routes/salaryComponent.routes";
import salaryStructureRoutes from "./modules/teacher/routes/salaryStructure.routes";
import teacherSalaryRoutes from "./modules/teacher/routes/teacherSalary.routes";
import salaryPaymentRoutes from "./modules/teacher/routes/salaryPayment.routes";
import teacherAuthRoutes from "./modules/teacher/routes/teacher-auth.routes";

/**
 * Route Imports - Student Module
 */
import studentRoutes from "./modules/student/routes/student.routes";
import studentEnrollmentRoutes from "./modules/student/routes/enrollment.routes";
import studentAttendanceRoutes from "./modules/student/routes/attendance.routes";
import studentAuthRoutes from "./modules/student/routes/student-auth.routes";

/**
 * Route Imports - Parent Module
 */
import parentRoutes from "./modules/parents/routes/parent.routes";
import studentParentRoutes from "./modules/parents/routes/studentParent.routes";
import parentAuthRoutes from "./modules/parents/routes/parent-auth.routes";

import ptmRoutes from "./modules/parents/routes/ptm.routes";

/**
 * Route Imports - Fee Module
 */
import feeCategoryRoutes from "./modules/fee/routes/feeCategory.routes";
import feeStructureRoutes from "./modules/fee/routes/feeStructure.routes";
import studentFeeRoutes from "./modules/fee/routes/studentFee.routes";
import feePaymentRoutes from "./modules/fee/routes/feePayment.routes";
import feeDiscountRoutes from "./modules/fee/routes/feeDiscount.routes";

/**
 * Route Imports - Exam & Result Module
 */
import examRoutes from "./modules/exam_result/routes/exam.routes";
import marksRoutes from "./modules/exam_result/routes/marks.routes";
import resultRoutes from "./modules/exam_result/routes/result.routes";
import gradeScaleRoutes from "./modules/exam_result/routes/gradeScale.routes";

/**
 * Route Imports - Library Module
 */
import bookCategoryRoutes from "./modules/library/routes/bookCategory.routes";
import bookRoutes from "./modules/library/routes/book.routes";
import bookIssueRoutes from "./modules/library/routes/bookIssue.routes";

/**
 * Route Imports - Common Module
 */
import leaveRoutes from "./modules/common/routes/leave.routes";

/**
 * Route Imports - Homework Module
 */
import homeworkRoutes from "./modules/homework/routes/homework.routes";

/**
 * Express Application Instance
 */
const app = express();

/**
 * Global Middleware Stack
 */
app.use(express.json({ limit: "20mb" }));
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use(helmet());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    message: { status: 429, message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
  })
);

/**
 * Health Check Endpoint
 */
app.get("/", (_, res) => {
  res.json({
    message: "School ERP API is running",
    mode: ENV.mode === "development" ? "development" : "production",
    version: "1.0.0",
  });
});

/**
 * Dashboard Routes
*/
// app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboard", dashboardRoutes);

/**
 * API Routes - Auth
 */
app.use("/api/auth/school", schoolAuthRoutes);
app.use("/api/auth/student", studentAuthRoutes);
app.use("/api/auth/teacher", teacherAuthRoutes);
app.use("/api/auth/parent", parentAuthRoutes);

/**
 * API Routes - School
 */
app.use("/api/school", schoolRoutes);
app.use("/api/school/academic-year", academicYearRoutes);
app.use("/api/school/class", classRoutes);
app.use("/api/school/section", sectionRoutes);
app.use("/api/school/subject", subjectRoutes);
app.use("/api/school/holiday", holidayRoutes);
app.use("/api/school/notice", noticeRoutes);
app.use("/api/school/ptm", schoolPtmRoutes);
app.use("/api/school/time-slot", timeSlotRoutes);
app.use("/api/school/timetable", timetableRoutes);

/**
 * API Routes - Teacher
 */
app.use("/api/teacher", teacherRoutes);
app.use("/api/teacher/subject", teacherSubjectRoutes);
app.use("/api/teacher/class-assignment", teacherClassRoutes);
app.use("/api/teacher/attendance", teacherAttendanceRoutes);
app.use("/api/teacher/salary/component", salaryComponentRoutes);
app.use("/api/teacher/salary/structure", salaryStructureRoutes);
app.use("/api/teacher/salary", teacherSalaryRoutes);
app.use("/api/teacher/salary/payment", salaryPaymentRoutes);

/**
 * API Routes - Student
 */
app.use("/api/student", studentRoutes);
app.use("/api/student/enrollment", studentEnrollmentRoutes);
app.use("/api/student/attendance", studentAttendanceRoutes);

/**
 * API Routes - Parent
 */
app.use("/api/parents", parentRoutes);
app.use("/api/parents/relation", studentParentRoutes);
app.use("/api/parents/ptm", ptmRoutes);

/**
 * API Routes - Fee
 */
app.use("/api/fee/category", feeCategoryRoutes);
app.use("/api/fee/structure", feeStructureRoutes);
app.use("/api/fee/student", studentFeeRoutes);
app.use("/api/fee/payment", feePaymentRoutes);
app.use("/api/fee/discount", feeDiscountRoutes);

/**
 * API Routes - Exam & Result
 */
app.use("/api/exam", examRoutes);
app.use("/api/exam/marks", marksRoutes);
app.use("/api/exam/result", resultRoutes);
app.use("/api/exam/grade-scale", gradeScaleRoutes);

/**
 * API Routes - Library
 */
app.use("/api/library/category", bookCategoryRoutes);
app.use("/api/library/book", bookRoutes);
app.use("/api/library", bookIssueRoutes);

/**
 * API Routes - Common
 */
app.use("/api/common/leave", leaveRoutes);

/**
 * API Routes - Homework
 */
app.use("/api/homework", homeworkRoutes);

/**
 * Global Error Handler
 */
app.use(errorMiddleware);

/**
 * Server Initialization
 */
const PORT = ENV.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${ENV.mode}`);
});
