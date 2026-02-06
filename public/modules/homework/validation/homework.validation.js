"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.gradeSubmissionSchema = exports.submitHomeworkSchema = exports.updateHomeworkSchema = exports.createHomeworkSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("../../../generated/prisma/client");
// Create Homework
exports.createHomeworkSchema = zod_1.z.object({
    schoolId: zod_1.z.string().uuid("Invalid school ID"),
    sectionId: zod_1.z.string().uuid("Invalid section ID"),
    timetableEntryId: zod_1.z.string().uuid("Invalid timetable entry ID"),
    assignedDate: zod_1.z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    title: zod_1.z.string().min(1, "Title is required").max(255, "Title too long"),
    description: zod_1.z.string().min(1, "Description is required"),
    attachments: zod_1.z.any().optional(), // JSON
    dueDate: zod_1.z.string().datetime(), // ISO 8601
    maxMarks: zod_1.z.number().int().min(0).optional(),
    assignedBy: zod_1.z.string().uuid("Invalid teacher ID"),
});
// Update Homework
exports.updateHomeworkSchema = zod_1.z.object({
    title: zod_1.z.string().min(1).max(255).optional(),
    description: zod_1.z.string().min(1).optional(),
    attachments: zod_1.z.any().optional(),
    dueDate: zod_1.z.string().datetime().optional(),
    maxMarks: zod_1.z.number().int().min(0).optional(),
    isActive: zod_1.z.boolean().optional(),
});
// Submit Homework
exports.submitHomeworkSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    content: zod_1.z.string().optional(),
    attachments: zod_1.z.any().optional(),
});
// Grade Submission
exports.gradeSubmissionSchema = zod_1.z.object({
    marks: zod_1.z.number().min(0),
    feedback: zod_1.z.string().optional(),
    gradedBy: zod_1.z.string().uuid("Invalid teacher ID"),
    status: zod_1.z.nativeEnum(client_1.HomeworkSubmissionStatus).optional(),
});
//# sourceMappingURL=homework.validation.js.map