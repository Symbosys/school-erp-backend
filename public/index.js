"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const env_1 = __importDefault(require("./config/env"));
const error_middleware_1 = __importDefault(require("./middlewares/error.middleware"));
/**
 * Route Imports - School Module
 */
const school_routes_1 = __importDefault(require("./modules/school/routes/school.routes"));
const dashboard_routes_1 = __importDefault(require("./modules/school/routes/dashboard.routes"));
const auth_routes_1 = __importDefault(require("./modules/school/routes/auth.routes"));
const academicYear_routes_1 = __importDefault(require("./modules/school/routes/academicYear.routes"));
const class_routes_1 = __importDefault(require("./modules/school/routes/class.routes"));
const section_routes_1 = __importDefault(require("./modules/school/routes/section.routes"));
const subject_routes_1 = __importDefault(require("./modules/school/routes/subject.routes"));
const holiday_routes_1 = __importDefault(require("./modules/school/routes/holiday.routes"));
const notice_routes_1 = __importDefault(require("./modules/school/routes/notice.routes"));
const ptm_routes_1 = __importDefault(require("./modules/school/routes/ptm.routes"));
const timeSlot_routes_1 = __importDefault(require("./modules/school/routes/timeSlot.routes"));
const timetable_routes_1 = __importDefault(require("./modules/school/routes/timetable.routes"));
/**
 * Route Imports - Teacher Module
 */
const teacher_routes_1 = __importDefault(require("./modules/teacher/routes/teacher.routes"));
const teacherSubject_routes_1 = __importDefault(require("./modules/teacher/routes/teacherSubject.routes"));
const teacherClass_routes_1 = __importDefault(require("./modules/teacher/routes/teacherClass.routes"));
const attendance_routes_1 = __importDefault(require("./modules/teacher/routes/attendance.routes"));
const teacher_auth_routes_1 = __importDefault(require("./modules/teacher/routes/teacher-auth.routes"));
/**
 * Route Imports - Student Module
 */
const student_routes_1 = __importDefault(require("./modules/student/routes/student.routes"));
const enrollment_routes_1 = __importDefault(require("./modules/student/routes/enrollment.routes"));
const attendance_routes_2 = __importDefault(require("./modules/student/routes/attendance.routes"));
const student_auth_routes_1 = __importDefault(require("./modules/student/routes/student-auth.routes"));
/**
 * Route Imports - Parent Module
 */
const parent_routes_1 = __importDefault(require("./modules/parents/routes/parent.routes"));
const studentParent_routes_1 = __importDefault(require("./modules/parents/routes/studentParent.routes"));
const parent_auth_routes_1 = __importDefault(require("./modules/parents/routes/parent-auth.routes"));
const ptm_routes_2 = __importDefault(require("./modules/parents/routes/ptm.routes"));
/**
 * Route Imports - Fee Module
 */
const feeCategory_routes_1 = __importDefault(require("./modules/fee/routes/feeCategory.routes"));
const feeStructure_routes_1 = __importDefault(require("./modules/fee/routes/feeStructure.routes"));
const studentFee_routes_1 = __importDefault(require("./modules/fee/routes/studentFee.routes"));
const feePayment_routes_1 = __importDefault(require("./modules/fee/routes/feePayment.routes"));
const feeDiscount_routes_1 = __importDefault(require("./modules/fee/routes/feeDiscount.routes"));
/**
 * Route Imports - Exam & Result Module
 */
const exam_routes_1 = __importDefault(require("./modules/exam_result/routes/exam.routes"));
const marks_routes_1 = __importDefault(require("./modules/exam_result/routes/marks.routes"));
const result_routes_1 = __importDefault(require("./modules/exam_result/routes/result.routes"));
const gradeScale_routes_1 = __importDefault(require("./modules/exam_result/routes/gradeScale.routes"));
/**
 * Route Imports - Library Module
 */
const bookCategory_routes_1 = __importDefault(require("./modules/library/routes/bookCategory.routes"));
const book_routes_1 = __importDefault(require("./modules/library/routes/book.routes"));
const bookIssue_routes_1 = __importDefault(require("./modules/library/routes/bookIssue.routes"));
/**
 * Route Imports - Common Module
 */
const leave_routes_1 = __importDefault(require("./modules/common/routes/leave.routes"));
/**
 * Route Imports - Homework Module
 */
const homework_routes_1 = __importDefault(require("./modules/homework/routes/homework.routes"));
/**
 * Express Application Instance
 */
const app = (0, express_1.default)();
/**
 * Global Middleware Stack
 */
app.use(express_1.default.json({ limit: "20mb" }));
app.use("/uploads", express_1.default.static(path_1.default.join(__dirname, "../uploads")));
app.use((0, helmet_1.default)());
app.use((0, morgan_1.default)("dev"));
app.use((0, cookie_parser_1.default)());
app.use((0, cors_1.default)({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
}));
app.use((0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 3000,
    message: { status: 429, message: "Too many requests, please try again later" },
    standardHeaders: true,
    legacyHeaders: false,
}));
/**
 * Health Check Endpoint
 */
app.get("/", (_, res) => {
    res.json({
        message: "School ERP API is running",
        mode: env_1.default.mode === "development" ? "development" : "production",
        version: "1.0.0",
    });
});
/**
 * Dashboard Routes
*/
// app.use("/api/dashboard", dashboardRoutes);
app.use("/api/dashboard", dashboard_routes_1.default);
/**
 * API Routes - Auth
 */
app.use("/api/auth/school", auth_routes_1.default);
app.use("/api/auth/student", student_auth_routes_1.default);
app.use("/api/auth/teacher", teacher_auth_routes_1.default);
app.use("/api/auth/parent", parent_auth_routes_1.default);
/**
 * API Routes - School
 */
app.use("/api/school", school_routes_1.default);
app.use("/api/school/academic-year", academicYear_routes_1.default);
app.use("/api/school/class", class_routes_1.default);
app.use("/api/school/section", section_routes_1.default);
app.use("/api/school/subject", subject_routes_1.default);
app.use("/api/school/holiday", holiday_routes_1.default);
app.use("/api/school/notice", notice_routes_1.default);
app.use("/api/school/ptm", ptm_routes_1.default);
app.use("/api/school/time-slot", timeSlot_routes_1.default);
app.use("/api/school/timetable", timetable_routes_1.default);
/**
 * API Routes - Teacher
 */
app.use("/api/teacher", teacher_routes_1.default);
app.use("/api/teacher/subject", teacherSubject_routes_1.default);
app.use("/api/teacher/class-assignment", teacherClass_routes_1.default);
app.use("/api/teacher/attendance", attendance_routes_1.default);
/**
 * API Routes - Student
 */
app.use("/api/student", student_routes_1.default);
app.use("/api/student/enrollment", enrollment_routes_1.default);
app.use("/api/student/attendance", attendance_routes_2.default);
/**
 * API Routes - Parent
 */
app.use("/api/parents", parent_routes_1.default);
app.use("/api/parents/relation", studentParent_routes_1.default);
app.use("/api/parents/ptm", ptm_routes_2.default);
/**
 * API Routes - Fee
 */
app.use("/api/fee/category", feeCategory_routes_1.default);
app.use("/api/fee/structure", feeStructure_routes_1.default);
app.use("/api/fee/student", studentFee_routes_1.default);
app.use("/api/fee/payment", feePayment_routes_1.default);
app.use("/api/fee/discount", feeDiscount_routes_1.default);
/**
 * API Routes - Exam & Result
 */
app.use("/api/exam", exam_routes_1.default);
app.use("/api/exam/marks", marks_routes_1.default);
app.use("/api/exam/result", result_routes_1.default);
app.use("/api/exam/grade-scale", gradeScale_routes_1.default);
/**
 * API Routes - Library
 */
app.use("/api/library/category", bookCategory_routes_1.default);
app.use("/api/library/book", book_routes_1.default);
app.use("/api/library", bookIssue_routes_1.default);
/**
 * API Routes - Common
 */
app.use("/api/common/leave", leave_routes_1.default);
/**
 * API Routes - Homework
 */
app.use("/api/homework", homework_routes_1.default);
/**
 * Global Error Handler
 */
app.use(error_middleware_1.default);
/**
 * Server Initialization
 */
const PORT = env_1.default.PORT || 4000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${env_1.default.mode}`);
});
//# sourceMappingURL=index.js.map