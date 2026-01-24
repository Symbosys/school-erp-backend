import { z } from "zod";

/**
 * Zod Schema for Student Onboarding
 */
export const onboardStudentSchema = z.object({
  schoolId: z.string().uuid("Invalid school ID"),
  admissionNumber: z.string().max(50, "Admission number is too long").optional(),
  firstName: z.string().min(1, "First name is required").max(100, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(100, "Last name is too long"),
  email: z.string().email("Invalid email format").max(255, "Email is too long").optional().or(z.literal("")),
  phone: z.string().max(20, "Phone number is too long").optional().or(z.literal("")),
  dateOfBirth: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid date of birth format",
  }),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]),
  bloodGroup: z.string().max(10, "Blood group is too long").optional(),
  address: z.string().min(1, "Address is required"),
  city: z.string().min(1, "City is required").max(100, "City is too long"),
  state: z.string().min(1, "State is required").max(100, "State is too long"),
  pincode: z.string().min(1, "Pincode is required").max(10, "Pincode is too long"),
  admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid admission date format",
  }),
  medicalInfo: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED_OUT"]).optional(),
  isActive: z.boolean().optional(),
  
  // Optional initial enrollment details
  // Optional initial enrollment details
  enrollment: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return val;
      }
    }
    return val;
  }, z.object({
    academicYearId: z.string().uuid("Invalid academic year ID"),
    sectionId: z.string().uuid("Invalid section ID"),
    enrollmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: "Invalid enrollment date format",
    }).optional(),
    rollNumber: z.string().max(50, "Roll number is too long").optional(),
  }).optional()),
});

/**
 * Zod Schema for Student Update
 */
export const updateStudentSchema = z.object({
  admissionNumber: z.string().max(50).optional(),
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  email: z.string().email().max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  bloodGroup: z.string().max(10).optional(),
  address: z.string().optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  pincode: z.string().max(10).optional(),
  admissionDate: z.string().optional(),
  medicalInfo: z.string().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "TRANSFERRED", "GRADUATED", "DROPPED_OUT"]).optional(),
  isActive: z.boolean().optional(),
});

/**
 * Zod Schema for Student Enrollment (Adding entry for new academic year)
 */
export const enrollStudentSchema = z.object({
  studentId: z.string().uuid("Invalid student ID"),
  academicYearId: z.string().uuid("Invalid academic year ID"),
  sectionId: z.string().uuid("Invalid section ID"),
  enrollmentDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Invalid enrollment date format",
  }),
  rollNumber: z.string().max(50, "Roll number is too long").optional(),
  remarks: z.string().optional(),
});

export type OnboardStudentInput = z.infer<typeof onboardStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
