"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentFeeSchema = exports.bulkAssignStudentFeeSchema = exports.assignStudentFeeSchema = void 0;
const zod_1 = require("zod");
const FeeStatusEnum = zod_1.z.enum(["PENDING", "PARTIAL", "PAID", "OVERDUE", "WAIVED"]);
/**
 * Zod Schema for Assigning Fee to Student
 */
exports.assignStudentFeeSchema = zod_1.z.object({
    studentId: zod_1.z.string().uuid("Invalid student ID"),
    feeStructureId: zod_1.z.string().uuid("Invalid fee structure ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
});
/**
 * Zod Schema for Bulk Assign Fees (to all students in a section)
 */
exports.bulkAssignStudentFeeSchema = zod_1.z.object({
    sectionId: zod_1.z.string().uuid("Invalid section ID"),
    feeStructureId: zod_1.z.string().uuid("Invalid fee structure ID"),
    academicYearId: zod_1.z.string().uuid("Invalid academic year ID"),
});
/**
 * Zod Schema for Updating Student Fee Status
 */
exports.updateStudentFeeSchema = zod_1.z.object({
    status: FeeStatusEnum.optional(),
    discountAmount: zod_1.z.number().min(0).optional(),
});
//# sourceMappingURL=studentFee.validation.js.map