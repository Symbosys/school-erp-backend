import { z } from "zod";
import { HomeworkSubmissionStatus } from "../../../generated/prisma/client";

// Create Homework
export const createHomeworkSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  sectionId: z.string().uuid("Invalid section ID"),
  timetableEntryId: z.string().uuid("Invalid timetable entry ID"),
  assignedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  description: z.string().min(1, "Description is required"),
  attachments: z.any().optional(), // JSON
  dueDate: z.string().datetime(), // ISO 8601
  maxMarks: z.number().int().min(0).optional(),
  assignedBy: z.string().uuid("Invalid teacher ID"),
});

// Update Homework
export const updateHomeworkSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().min(1).optional(),
  attachments: z.any().optional(),
  dueDate: z.string().datetime().optional(),
  maxMarks: z.number().int().min(0).optional(),
  isActive: z.boolean().optional(),
});

// Submit Homework
export const submitHomeworkSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  content: z.string().optional(),
  attachments: z.any().optional(),
});

// Grade Submission
export const gradeSubmissionSchema = z.object({
  marks: z.number().min(0),
  feedback: z.string().optional(),
  gradedBy: z.string().uuid("Invalid teacher ID"),
  status: z.nativeEnum(HomeworkSubmissionStatus).optional(),
});


