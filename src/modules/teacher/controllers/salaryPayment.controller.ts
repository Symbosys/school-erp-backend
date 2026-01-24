import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import { recordSalaryPaymentSchema } from "../validation/salaryPayment.validation";

/**
 * @route   POST /api/teacher/salary/payment
 * @desc    Record salary payment
 * @access  Admin/School
 */
export const recordSalaryPayment = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = recordSalaryPaymentSchema.parse(req.body);

  // Validate salary exists
  const salary = await prisma.teacherSalary.findUnique({
    where: { id: validatedData.teacherSalaryId },
    include: { payments: true }
  });

  if (!salary) throw new ErrorResponse("Salary record not found", statusCode.Not_Found);

  // Check if already paid in full
  const totalPaid = salary.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const remaining = Number(salary.netSalary) - totalPaid;

  if (remaining <= 0) {
    throw new ErrorResponse("Salary already paid in full", statusCode.Bad_Request);
  }

  if (validatedData.amount > remaining) {
    throw new ErrorResponse(`Amount exceeds remaining balance of ${remaining}`, statusCode.Bad_Request);
  }

  // Create payment
  const payment = await prisma.salaryPayment.create({
    data: {
      teacherSalaryId: validatedData.teacherSalaryId,
      amount: validatedData.amount,
      paymentMethod: validatedData.paymentMethod,
      transactionId: validatedData.transactionId,
      remarks: validatedData.remarks
    }
  });

  // Update salary status if fully paid
  const newTotalPaid = totalPaid + validatedData.amount;
  if (newTotalPaid >= Number(salary.netSalary)) {
    await prisma.teacherSalary.update({
      where: { id: validatedData.teacherSalaryId },
      data: { status: "PAID" }
    });
  }

  const result = await prisma.salaryPayment.findUnique({
    where: { id: payment.id },
    include: {
      teacherSalary: {
        include: {
          teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } }
        }
      }
    }
  });

  return SuccessResponse(res, "Payment recorded successfully", result, statusCode.Created);
});

/**
 * @route   GET /api/teacher/salary/payment/teacher/:teacherId
 * @desc    Get all payments for a teacher
 * @access  Admin/School/Teacher
 */
export const getPaymentsByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;

  const payments = await prisma.salaryPayment.findMany({
    where: {
      teacherSalary: { teacherId: teacherId as string }
    },
    include: {
      teacherSalary: { select: { month: true, year: true } }
    },
    orderBy: { paymentDate: "desc" }
  });

  return SuccessResponse(res, "Payments retrieved successfully", payments);
});

/**
 * @route   GET /api/teacher/salary/payment/:id
 * @desc    Get payment by ID
 * @access  Admin/School/Teacher
 */
export const getPaymentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const payment = await prisma.salaryPayment.findUnique({
    where: { id: id as string },
    include: {
      teacherSalary: {
        include: {
          teacher: true,
          salaryStructure: true
        }
      }
    }
  });

  if (!payment) throw new ErrorResponse("Payment not found", statusCode.Not_Found);

  return SuccessResponse(res, "Payment retrieved successfully", payment);
});
