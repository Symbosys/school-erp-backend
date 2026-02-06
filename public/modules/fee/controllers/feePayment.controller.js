"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPaymentByReceipt = exports.getPaymentById = exports.getPaymentsByStudent = exports.recordPaymentAutoAllocate = exports.recordFeePayment = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const feePayment_validation_1 = require("../validation/feePayment.validation");
/**
 * Helper: Generate unique receipt number
 */
const generateReceiptNumber = async (schoolId) => {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, "0");
    // Get count of payments this month for this school
    const school = await prisma_1.prisma.school.findUnique({ where: { id: schoolId } });
    const schoolCode = school?.code || "SCH";
    const count = await prisma_1.prisma.feePayment.count({
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
const updateStudentFeeTotals = async (studentFeeId) => {
    const studentFee = await prisma_1.prisma.studentFee.findUnique({
        where: { id: studentFeeId },
        include: { details: true }
    });
    if (!studentFee)
        return;
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
    let status = "PENDING";
    if (allPaid) {
        status = "PAID";
    }
    else if (anyPartial || totalPaid > 0) {
        status = "PARTIAL";
    }
    await prisma_1.prisma.studentFee.update({
        where: { id: studentFeeId },
        data: { paidAmount: totalPaid, balanceAmount, status }
    });
};
/**
 * @route   POST /api/fee/payment
 * @desc    Record fee payment for a specific month
 * @access  Admin/School
 */
exports.recordFeePayment = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = feePayment_validation_1.recordFeePaymentSchema.parse(req.body);
    // Get detail and validate
    const detail = await prisma_1.prisma.studentFeeDetail.findUnique({
        where: { id: validatedData.studentFeeDetailId },
        include: {
            studentFee: {
                include: { student: true }
            }
        }
    });
    if (!detail)
        throw new response_util_1.ErrorResponse("Fee detail not found", types_1.statusCode.Not_Found);
    const totalDue = Number(detail.amount) + Number(detail.lateFee);
    const alreadyPaid = Number(detail.paidAmount);
    const remaining = totalDue - alreadyPaid;
    if (validatedData.amount > remaining) {
        throw new response_util_1.ErrorResponse(`Amount exceeds remaining balance of ${remaining}`, types_1.statusCode.Bad_Request);
    }
    // Generate receipt number
    const receiptNumber = await generateReceiptNumber(detail.studentFee.student.schoolId);
    // Create payment
    const payment = await prisma_1.prisma.feePayment.create({
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
    await prisma_1.prisma.studentFeeDetail.update({
        where: { id: validatedData.studentFeeDetailId },
        data: { paidAmount: newPaidAmount, status: newStatus }
    });
    // Update parent student fee totals
    await updateStudentFeeTotals(detail.studentFeeId);
    const result = await prisma_1.prisma.feePayment.findUnique({
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
    return (0, response_util_1.SuccessResponse)(res, "Payment recorded successfully", result, types_1.statusCode.Created);
});
/**
 * @route   POST /api/fee/payment/auto-allocate
 * @desc    Record payment and auto-allocate to pending months
 * @access  Admin/School
 */
exports.recordPaymentAutoAllocate = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = feePayment_validation_1.recordPaymentByStudentFeeSchema.parse(req.body);
    const studentFee = await prisma_1.prisma.studentFee.findUnique({
        where: { id: validatedData.studentFeeId },
        include: {
            student: true,
            details: { orderBy: [{ year: "asc" }, { month: "asc" }] }
        }
    });
    if (!studentFee)
        throw new response_util_1.ErrorResponse("Student fee not found", types_1.statusCode.Not_Found);
    let remainingAmount = validatedData.amount;
    const paymentsCreated = [];
    for (const detail of studentFee.details) {
        if (remainingAmount <= 0)
            break;
        const totalDue = Number(detail.amount) + Number(detail.lateFee);
        const alreadyPaid = Number(detail.paidAmount);
        const needed = totalDue - alreadyPaid;
        if (needed <= 0)
            continue;
        const payAmount = Math.min(remainingAmount, needed);
        remainingAmount -= payAmount;
        // Generate receipt number
        const receiptNumber = await generateReceiptNumber(studentFee.student.schoolId);
        const payment = await prisma_1.prisma.feePayment.create({
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
        await prisma_1.prisma.studentFeeDetail.update({
            where: { id: detail.id },
            data: { paidAmount: newPaidAmount, status: newStatus }
        });
    }
    // Update parent totals
    await updateStudentFeeTotals(studentFee.id);
    return (0, response_util_1.SuccessResponse)(res, "Payment recorded and allocated successfully", {
        paymentsCreated: paymentsCreated.length,
        amountAllocated: validatedData.amount - remainingAmount,
        excessAmount: remainingAmount
    }, types_1.statusCode.Created);
});
/**
 * @route   GET /api/fee/payment/student/:studentId
 * @desc    Get all payments for a student
 * @access  Admin/School/Parent
 */
exports.getPaymentsByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const payments = await prisma_1.prisma.feePayment.findMany({
        where: {
            studentFeeDetail: {
                studentFee: { studentId: studentId }
            }
        },
        include: {
            studentFeeDetail: {
                select: { month: true, year: true }
            }
        },
        orderBy: { paymentDate: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Payments retrieved successfully", payments);
});
/**
 * @route   GET /api/fee/payment/:id
 * @desc    Get payment by ID (Receipt)
 * @access  Admin/School/Parent
 */
exports.getPaymentById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const payment = await prisma_1.prisma.feePayment.findUnique({
        where: { id: id },
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
    if (!payment)
        throw new response_util_1.ErrorResponse("Payment not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Payment retrieved successfully", payment);
});
/**
 * @route   GET /api/fee/payment/receipt/:receiptNumber
 * @desc    Get payment by receipt number
 * @access  Admin/School/Parent
 */
exports.getPaymentByReceipt = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { receiptNumber } = req.params;
    const payment = await prisma_1.prisma.feePayment.findUnique({
        where: { receiptNumber: receiptNumber },
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
    if (!payment)
        throw new response_util_1.ErrorResponse("Payment not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Payment retrieved successfully", payment);
});
//# sourceMappingURL=feePayment.controller.js.map