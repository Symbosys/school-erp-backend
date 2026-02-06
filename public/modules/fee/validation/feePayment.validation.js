"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recordPaymentByStudentFeeSchema = exports.recordFeePaymentSchema = void 0;
const zod_1 = require("zod");
const PaymentMethodEnum = zod_1.z.enum(["CASH", "UPI", "CARD", "CHEQUE", "BANK_TRANSFER", "ONLINE"]);
/**
 * Zod Schema for Recording Fee Payment
 */
exports.recordFeePaymentSchema = zod_1.z.object({
    studentFeeDetailId: zod_1.z.string().uuid("Invalid student fee detail ID"),
    amount: zod_1.z.number().positive("Amount must be positive"),
    paymentMethod: PaymentMethodEnum,
    transactionId: zod_1.z.string().max(100).optional(),
    collectedBy: zod_1.z.string().max(100).optional(),
    remarks: zod_1.z.string().optional(),
});
/**
 * Zod Schema for Recording Payment by Student Fee (auto-allocates to pending months)
 */
exports.recordPaymentByStudentFeeSchema = zod_1.z.object({
    studentFeeId: zod_1.z.string().uuid("Invalid student fee ID"),
    amount: zod_1.z.number().positive("Amount must be positive"),
    paymentMethod: PaymentMethodEnum,
    transactionId: zod_1.z.string().max(100).optional(),
    collectedBy: zod_1.z.string().max(100).optional(),
    remarks: zod_1.z.string().optional(),
});
//# sourceMappingURL=feePayment.validation.js.map