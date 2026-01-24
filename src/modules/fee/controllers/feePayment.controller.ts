import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  recordFeePaymentSchema,
  recordPaymentByStudentFeeSchema,
} from "../validation/feePayment.validation";

/**
 * Helper: Generate unique receipt number
 */
const generateReceiptNumber = async (schoolId: string): Promise<string> => {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, "0");
  
  // Get count of payments this month for this school
  const school = await prisma.school.findUnique({ where: { id: schoolId } });
  const schoolCode = school?.code || "SCH";
  
  const count = await prisma.feePayment.count({
    where: {
      paymentDate: {
        gte: new Date(year, new Date().getMonth(), 1),
        lt: new Date(year, new Date().getMonth() + 1, 1)
      }
    }
  });

  const sequence = String(count + 1).padStart(5, "0");
  return `${schoolCode}-${year}${month}-${sequence}`;
};

/**
 * Helper: Update student fee totals after payment
 */
const updateStudentFeeTotals = async (studentFeeId: string) => {
  const studentFee = await prisma.studentFee.findUnique({
    where: { id: studentFeeId },
    include: { details: true }
  });

  if (!studentFee) return;

  let totalPaid = 0;
  let allPaid = true;
  let anyPartial = false;

  for (const detail of studentFee.details) {
    totalPaid += Number(detail.paidAmount);
    const totalDue = Number(detail.amount) + Number(detail.lateFee);
    if (Number(detail.paidAmount) < totalDue) {
      allPaid = false;
      if (Number(detail.paidAmount) > 0) {
        anyPartial = true;
      }
    }
  }

  const balanceAmount = Number(studentFee.totalAmount) - totalPaid;
  let status: "PENDING" | "PARTIAL" | "PAID" | "OVERDUE" | "WAIVED" = "PENDING";
  
  if (allPaid) {
    status = "PAID";
  } else if (anyPartial || totalPaid > 0) {
    status = "PARTIAL";
  }

  await prisma.studentFee.update({
    where: { id: studentFeeId },
    data: { paidAmount: totalPaid, balanceAmount, status }
  });
};

/**
 * @route   POST /api/fee/payment
 * @desc    Record fee payment for a specific month
 * @access  Admin/School
 */
export const recordFeePayment = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = recordFeePaymentSchema.parse(req.body);

  // Get detail and validate
  const detail = await prisma.studentFeeDetail.findUnique({
    where: { id: validatedData.studentFeeDetailId },
    include: {
      studentFee: {
        include: { student: true }
      }
    }
  });

  if (!detail) throw new ErrorResponse("Fee detail not found", statusCode.Not_Found);

  const totalDue = Number(detail.amount) + Number(detail.lateFee);
  const alreadyPaid = Number(detail.paidAmount);
  const remaining = totalDue - alreadyPaid;

  if (validatedData.amount > remaining) {
    throw new ErrorResponse(`Amount exceeds remaining balance of ${remaining}`, statusCode.Bad_Request);
  }

  // Generate receipt number
  const receiptNumber = await generateReceiptNumber(detail.studentFee.student.schoolId);

  // Create payment
  const payment = await prisma.feePayment.create({
    data: {
      studentFeeDetailId: validatedData.studentFeeDetailId,
      amount: validatedData.amount,
      paymentMethod: validatedData.paymentMethod,
      transactionId: validatedData.transactionId,
      receiptNumber,
      collectedBy: validatedData.collectedBy,
      remarks: validatedData.remarks
    }
  });

  // Update detail paid amount and status
  const newPaidAmount = alreadyPaid + validatedData.amount;
  const newStatus = newPaidAmount >= totalDue ? "PAID" : newPaidAmount > 0 ? "PARTIAL" : "PENDING";

  await prisma.studentFeeDetail.update({
    where: { id: validatedData.studentFeeDetailId },
    data: { paidAmount: newPaidAmount, status: newStatus }
  });

  // Update parent student fee totals
  await updateStudentFeeTotals(detail.studentFeeId);

  const result = await prisma.feePayment.findUnique({
    where: { id: payment.id },
    include: {
      studentFeeDetail: {
        include: {
          studentFee: {
            include: {
              student: { select: { id: true, firstName: true, lastName: true } }
            }
          }
        }
      }
    }
  });

  return SuccessResponse(res, "Payment recorded successfully", result, statusCode.Created);
});

/**
 * @route   POST /api/fee/payment/auto-allocate
 * @desc    Record payment and auto-allocate to pending months
 * @access  Admin/School
 */
export const recordPaymentAutoAllocate = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = recordPaymentByStudentFeeSchema.parse(req.body);

  const studentFee = await prisma.studentFee.findUnique({
    where: { id: validatedData.studentFeeId },
    include: {
      student: true,
      details: { orderBy: [{ year: "asc" }, { month: "asc" }] }
    }
  });

  if (!studentFee) throw new ErrorResponse("Student fee not found", statusCode.Not_Found);

  let remainingAmount = validatedData.amount;
  const paymentsCreated = [];

  for (const detail of studentFee.details) {
    if (remainingAmount <= 0) break;

    const totalDue = Number(detail.amount) + Number(detail.lateFee);
    const alreadyPaid = Number(detail.paidAmount);
    const needed = totalDue - alreadyPaid;

    if (needed <= 0) continue;

    const payAmount = Math.min(remainingAmount, needed);
    remainingAmount -= payAmount;

    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(studentFee.student.schoolId);

    const payment = await prisma.feePayment.create({
      data: {
        studentFeeDetailId: detail.id,
        amount: payAmount,
        paymentMethod: validatedData.paymentMethod,
        transactionId: validatedData.transactionId,
        receiptNumber,
        collectedBy: validatedData.collectedBy,
        remarks: validatedData.remarks
      }
    });

    paymentsCreated.push(payment);

    // Update detail
    const newPaidAmount = alreadyPaid + payAmount;
    const newStatus = newPaidAmount >= totalDue ? "PAID" : "PARTIAL";

    await prisma.studentFeeDetail.update({
      where: { id: detail.id },
      data: { paidAmount: newPaidAmount, status: newStatus }
    });
  }

  // Update parent totals
  await updateStudentFeeTotals(studentFee.id);

  return SuccessResponse(res, "Payment recorded and allocated successfully", {
    paymentsCreated: paymentsCreated.length,
    amountAllocated: validatedData.amount - remainingAmount,
    excessAmount: remainingAmount
  }, statusCode.Created);
});

/**
 * @route   GET /api/fee/payment/student/:studentId
 * @desc    Get all payments for a student
 * @access  Admin/School/Parent
 */
export const getPaymentsByStudent = asyncHandler(async (req: Request, res: Response) => {
  const { studentId } = req.params;

  const payments = await prisma.feePayment.findMany({
    where: {
      studentFeeDetail: {
        studentFee: { studentId: studentId as string }
      }
    },
    include: {
      studentFeeDetail: {
        select: { month: true, year: true }
      }
    },
    orderBy: { paymentDate: "desc" }
  });

  return SuccessResponse(res, "Payments retrieved successfully", payments);
});

/**
 * @route   GET /api/fee/payment/:id
 * @desc    Get payment by ID (Receipt)
 * @access  Admin/School/Parent
 */
export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payment = await prisma.feePayment.findUnique({
    where: { id: id as string },
    include: {
      studentFeeDetail: {
        include: {
          studentFee: {
            include: {
              student: true,
              feeStructure: { include: { class: true } },
              academicYear: true
            }
          }
        }
      }
    }
  });

  if (!payment) throw new ErrorResponse("Payment not found", statusCode.Not_Found);

  return SuccessResponse(res, "Payment retrieved successfully", payment);
});

/**
 * @route   GET /api/fee/payment/receipt/:receiptNumber
 * @desc    Get payment by receipt number
 * @access  Admin/School/Parent
 */
export const getPaymentByReceipt = asyncHandler(async (req: Request, res: Response) => {
  const { receiptNumber } = req.params;

  const payment = await prisma.feePayment.findUnique({
    where: { receiptNumber: receiptNumber as string },
    include: {
      studentFeeDetail: {
        include: {
          studentFee: {
            include: {
              student: true,
              feeStructure: { include: { class: true } },
              academicYear: true
            }
          }
        }
      }
    }
  });

  if (!payment) throw new ErrorResponse("Payment not found", statusCode.Not_Found);

  return SuccessResponse(res, "Payment retrieved successfully", payment);
});
