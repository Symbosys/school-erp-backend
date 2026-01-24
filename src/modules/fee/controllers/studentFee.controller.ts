import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  assignStudentFeeSchema,
  bulkAssignStudentFeeSchema,
  updateStudentFeeSchema,
} from "../validation/studentFee.validation";

/**
 * Helper: Generate monthly fee details for a student fee
 */
const generateMonthlyDetails = async (
  studentFeeId: string,
  feeStructure: any,
  academicYear: any
) => {
  const startDate = new Date(academicYear.startDate);
  const endDate = new Date(academicYear.endDate);
  
  // Calculate monthly items total
  let monthlyTotal = 0;
  for (const item of feeStructure.items) {
    if (item.frequency === "MONTHLY") {
      monthlyTotal += Number(item.amount);
    }
  }

  const details = [];
  let currentDate = new Date(startDate);
  
  while (currentDate <= endDate) {
    const month = currentDate.getMonth() + 1; // 1-12
    const year = currentDate.getFullYear();
    const dueDate = new Date(year, month - 1, feeStructure.dueDay);

    details.push({
      studentFeeId,
      month,
      year,
      amount: monthlyTotal,
      dueDate,
      lateFee: 0,
      paidAmount: 0,
      status: "PENDING" as const
    });

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  if (details.length > 0) {
    await prisma.studentFeeDetail.createMany({ data: details });
  }

  return details.length;
};

/**
 * @route   POST /api/fee/student
 * @desc    Assign fee to a student
 * @access  Admin/School
 */
export const assignStudentFee = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = assignStudentFeeSchema.parse(req.body);

  // Validate entities
  const student = await prisma.student.findUnique({ where: { id: validatedData.studentId } });
  if (!student) throw new ErrorResponse("Student not found", statusCode.Not_Found);

  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id: validatedData.feeStructureId },
    include: { items: true, academicYear: true }
  });
  if (!feeStructure) throw new ErrorResponse("Fee structure not found", statusCode.Not_Found);

  // Check same school
  if (student.schoolId !== feeStructure.schoolId) {
    throw new ErrorResponse("Student and fee structure must belong to the same school", statusCode.Bad_Request);
  }

  // Check duplicate
  const existing = await prisma.studentFee.findUnique({
    where: {
      studentId_academicYearId: {
        studentId: validatedData.studentId,
        academicYearId: validatedData.academicYearId
      }
    }
  });

  if (existing) {
    throw new ErrorResponse("Fee already assigned for this academic year", statusCode.Conflict);
  }

  // Calculate any applicable discounts
  const discounts = await prisma.feeDiscount.findMany({
    where: {
      studentId: validatedData.studentId,
      academicYearId: validatedData.academicYearId,
      isActive: true
    }
  });

  let discountAmount = 0;
  for (const discount of discounts) {
    if (discount.discountType === "PERCENTAGE") {
      discountAmount += Number(feeStructure.totalAmount) * (Number(discount.discountValue) / 100);
    } else {
      discountAmount += Number(discount.discountValue);
    }
  }

  const totalAmount = Number(feeStructure.totalAmount) - discountAmount;
  const balanceAmount = totalAmount;

  // Create student fee
  const studentFee = await prisma.studentFee.create({
    data: {
      studentId: validatedData.studentId,
      feeStructureId: validatedData.feeStructureId,
      academicYearId: validatedData.academicYearId,
      totalAmount,
      discountAmount,
      paidAmount: 0,
      balanceAmount,
      status: "PENDING"
    }
  });

  // Generate monthly details
  await generateMonthlyDetails(studentFee.id, feeStructure, feeStructure.academicYear);

  const result = await prisma.studentFee.findUnique({
    where: { id: studentFee.id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      feeStructure: true,
      details: { orderBy: { month: "asc" } }
    }
  });

  return SuccessResponse(res, "Fee assigned to student successfully", result, statusCode.Created);
});

/**
 * @route   POST /api/fee/student/bulk
 * @desc    Bulk assign fee to all students in a section
 * @access  Admin/School
 */
export const bulkAssignStudentFee = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkAssignStudentFeeSchema.parse(req.body);

  // Get fee structure
  const feeStructure = await prisma.feeStructure.findUnique({
    where: { id: validatedData.feeStructureId },
    include: { items: true, academicYear: true }
  });
  if (!feeStructure) throw new ErrorResponse("Fee structure not found", statusCode.Not_Found);

  // Get all students enrolled in the section for the academic year
  const enrollments = await prisma.studentEnrollment.findMany({
    where: {
      sectionId: validatedData.sectionId,
      academicYearId: validatedData.academicYearId
    },
    include: { student: true }
  });

  let assignedCount = 0;
  let skippedCount = 0;

  for (const enrollment of enrollments) {
    // Check if already assigned
    const existing = await prisma.studentFee.findUnique({
      where: {
        studentId_academicYearId: {
          studentId: enrollment.studentId,
          academicYearId: validatedData.academicYearId
        }
      }
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    // Calculate discounts for this student
    const discounts = await prisma.feeDiscount.findMany({
      where: {
        studentId: enrollment.studentId,
        academicYearId: validatedData.academicYearId,
        isActive: true
      }
    });

    let discountAmount = 0;
    for (const discount of discounts) {
      if (discount.discountType === "PERCENTAGE") {
        discountAmount += Number(feeStructure.totalAmount) * (Number(discount.discountValue) / 100);
      } else {
        discountAmount += Number(discount.discountValue);
      }
    }

    const totalAmount = Number(feeStructure.totalAmount) - discountAmount;

    const studentFee = await prisma.studentFee.create({
      data: {
        studentId: enrollment.studentId,
        feeStructureId: validatedData.feeStructureId,
        academicYearId: validatedData.academicYearId,
        totalAmount,
        discountAmount,
        paidAmount: 0,
        balanceAmount: totalAmount,
        status: "PENDING"
      }
    });

    await generateMonthlyDetails(studentFee.id, feeStructure, feeStructure.academicYear);
    assignedCount++;
  }

  return SuccessResponse(res, "Bulk fee assignment completed", {
    assigned: assignedCount,
    skipped: skippedCount,
    total: enrollments.length
  }, statusCode.Created);
});

/**
 * @route   GET /api/fee/student/school/:schoolId
 * @desc    Get all student fees for a school
 * @access  Admin/School
 */
export const getStudentFeesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { academicYearId, status, sectionId } = req.query;

  const where: any = {
    student: { schoolId: schoolId as string }
  };
  if (academicYearId) where.academicYearId = academicYearId as string;
  if (status) where.status = status as string;

  // Filter by section if provided
  if (sectionId) {
    const enrollments = await prisma.studentEnrollment.findMany({
      where: { sectionId: sectionId as string },
      select: { studentId: true }
    });
    where.studentId = { in: enrollments.map(e => e.studentId) };
  }

  const fees = await prisma.studentFee.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
      feeStructure: { include: { class: true } },
      academicYear: true
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Student fees retrieved successfully", fees);
});

/**
 * @route   GET /api/fee/student/:id
 * @desc    Get student fee by ID with monthly details
 * @access  Admin/School
 */
export const getStudentFeeById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const fee = await prisma.studentFee.findUnique({
    where: { id: id as string },
    include: {
      student: true,
      feeStructure: {
        include: {
          items: { include: { feeCategory: true } },
          class: true
        }
      },
      academicYear: true,
      details: {
        orderBy: [{ year: "asc" }, { month: "asc" }],
        include: {
          payments: { orderBy: { paymentDate: "desc" } }
        }
      }
    }
  });

  if (!fee) throw new ErrorResponse("Student fee not found", statusCode.Not_Found);

  return SuccessResponse(res, "Student fee retrieved successfully", fee);
});

/**
 * @route   GET /api/fee/student/student/:studentId
 * @desc    Get all fees for a specific student
 * @access  Admin/School/Parent/Student
 */
export const getFeesByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;
  const { status, academicYearId } = req.query;

  const where: any = { studentId: studentId as string };
  
  if (status && status !== "ALL") {
    where.status = status as string;
  }
  
  if (academicYearId) {
    where.academicYearId = academicYearId as string;
  }

  const fees = await prisma.studentFee.findMany({
    where,
    include: {
      feeStructure: { include: { class: true } },
      academicYear: true,
      details: {
        orderBy: [{ year: "asc" }, { month: "asc" }],
        include: {
            payments: { orderBy: { paymentDate: "desc" } }
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return SuccessResponse(res, "Student fees retrieved successfully", fees);
});

/**
 * @route   PUT /api/fee/student/:id
 * @desc    Update student fee status
 * @access  Admin/School
 */
export const updateStudentFee = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateStudentFeeSchema.parse(req.body);

  const existing = await prisma.studentFee.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Student fee not found", statusCode.Not_Found);

  const fee = await prisma.studentFee.update({
    where: { id: id as string },
    data: validatedData
  });

  return SuccessResponse(res, "Student fee updated successfully", fee);
});
