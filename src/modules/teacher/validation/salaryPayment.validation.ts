import { z } from "zod";

const PaymentMethodEnum = z.enum(["CASH", "UPI", "CARD", "CHEQUE", "BANK_TRANSFER", "ONLINE"]);

/**
 * Zod Schema for Recording Salary Payment
 */
export const recordSalaryPaymentSchema = z.object({
  teacherSalaryId: z.string().uuid("Invalid teacher salary ID"),
  amount: z.number().positive("Amount must be positive"),
  paymentMethod: PaymentMethodEnum,
  transactionId: z.string().max(100).optional(),
  remarks: z.string().optional(),
});

export type RecordSalaryPaymentInput = z.infer<typeof recordSalaryPaymentSchema>;
