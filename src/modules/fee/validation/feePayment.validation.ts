import { z } from "zod";

const PaymentMethodEnum = z.enum(["CASH", "UPI", "CARD", "CHEQUE", "BANK_TRANSFER", "ONLINE"]);

/**
 * Zod Schema for Recording Fee Payment
 */
export const recordFeePaymentSchema = z.object({
  studentFeeDetailId: z.string().uuid("Invalid student fee detail ID"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: PaymentMethodEnum,
  transactionId: z.string().max(100).optional(),
  collectedBy: z.string().max(100).optional(),
  remarks: z.string().optional(),
});

/**
 * Zod Schema for Recording Payment by Student Fee (auto-allocates to pending months)
 */
export const recordPaymentByStudentFeeSchema = z.object({
  studentFeeId: z.string().uuid("Invalid student fee ID"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: PaymentMethodEnum,
  transactionId: z.string().max(100).optional(),
  collectedBy: z.string().max(100).optional(),
  remarks: z.string().optional(),
});

export type RecordFeePaymentInput = z.infer<typeof recordFeePaymentSchema>;
export type RecordPaymentByStudentFeeInput = z.infer<typeof recordPaymentByStudentFeeSchema>;
