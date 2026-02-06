"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateStudentFee = exports.getFeesByStudent = exports.getStudentFeeById = exports.getStudentFeesBySchool = exports.bulkAssignStudentFee = exports.assignStudentFee = exports.generateMonthlyDetails = void 0;
const error_middleware_1 = require("../../../middlewares/error.middleware");
const prisma_1 = require("../../../config/prisma");
const response_util_1 = require("../../../utils/response.util");
const types_1 = require("../../../types/types");
const studentFee_validation_1 = require("../validation/studentFee.validation");
/**
 * Helper: Generate monthly fee details for a student fee
 */
const generateMonthlyDetails = async (studentFeeId, feeStructure, academicYear) => {
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
            status: "PENDING"
        });
        currentDate.setMonth(currentDate.getMonth() + 1);
    }
    if (details.length > 0) {
        await prisma_1.prisma.studentFeeDetail.createMany({ data: details });
    }
    return details.length;
};
exports.generateMonthlyDetails = generateMonthlyDetails;
/**
 * @route   POST /api/fee/student
 * @desc    Assign fee to a student
 * @access  Admin/School
 */
exports.assignStudentFee = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = studentFee_validation_1.assignStudentFeeSchema.parse(req.body);
    // Validate entities
    const student = await prisma_1.prisma.student.findUnique({ where: { id: validatedData.studentId } });
    if (!student)
        throw new response_util_1.ErrorResponse("Student not found", types_1.statusCode.Not_Found);
    const feeStructure = await prisma_1.prisma.feeStructure.findUnique({
        where: { id: validatedData.feeStructureId },
        include: { items: true, academicYear: true }
    });
    if (!feeStructure)
        throw new response_util_1.ErrorResponse("Fee structure not found", types_1.statusCode.Not_Found);
    // Check same school
    if (student.schoolId !== feeStructure.schoolId) {
        throw new response_util_1.ErrorResponse("Student and fee structure must belong to the same school", types_1.statusCode.Bad_Request);
    }
    // Check duplicate
    const existing = await prisma_1.prisma.studentFee.findUnique({
        where: {
            studentId_academicYearId: {
                studentId: validatedData.studentId,
                academicYearId: validatedData.academicYearId
            }
        }
    });
    if (existing) {
        throw new response_util_1.ErrorResponse("Fee already assigned for this academic year", types_1.statusCode.Conflict);
    }
    // Calculate any applicable discounts
    const discounts = await prisma_1.prisma.feeDiscount.findMany({
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
        }
        else {
            discountAmount += Number(discount.discountValue);
        }
    }
    const totalAmount = Number(feeStructure.totalAmount) - discountAmount;
    const balanceAmount = totalAmount;
    // Create student fee
    const studentFee = await prisma_1.prisma.studentFee.create({
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
    await (0, exports.generateMonthlyDetails)(studentFee.id, feeStructure, feeStructure.academicYear);
    const result = await prisma_1.prisma.studentFee.findUnique({
        where: { id: studentFee.id },
        include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
            feeStructure: true,
            details: { orderBy: { month: "asc" } }
        }
    });
    return (0, response_util_1.SuccessResponse)(res, "Fee assigned to student successfully", result, types_1.statusCode.Created);
});
/**
 * @route   POST /api/fee/student/bulk
 * @desc    Bulk assign fee to all students in a section
 * @access  Admin/School
 */
exports.bulkAssignStudentFee = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const validatedData = studentFee_validation_1.bulkAssignStudentFeeSchema.parse(req.body);
    // Get fee structure
    const feeStructure = await prisma_1.prisma.feeStructure.findUnique({
        where: { id: validatedData.feeStructureId },
        include: { items: true, academicYear: true }
    });
    if (!feeStructure)
        throw new response_util_1.ErrorResponse("Fee structure not found", types_1.statusCode.Not_Found);
    // Get all students enrolled in the section for the academic year
    const enrollments = await prisma_1.prisma.studentEnrollment.findMany({
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
        const existing = await prisma_1.prisma.studentFee.findUnique({
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
        const discounts = await prisma_1.prisma.feeDiscount.findMany({
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
            }
            else {
                discountAmount += Number(discount.discountValue);
            }
        }
        const totalAmount = Number(feeStructure.totalAmount) - discountAmount;
        const studentFee = await prisma_1.prisma.studentFee.create({
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
        await (0, exports.generateMonthlyDetails)(studentFee.id, feeStructure, feeStructure.academicYear);
        assignedCount++;
    }
    return (0, response_util_1.SuccessResponse)(res, "Bulk fee assignment completed", {
        assigned: assignedCount,
        skipped: skippedCount,
        total: enrollments.length
    }, types_1.statusCode.Created);
});
/**
 * @route   GET /api/fee/student/school/:schoolId
 * @desc    Get all student fees for a school
 * @access  Admin/School
 */
exports.getStudentFeesBySchool = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { schoolId } = req.params;
    const { academicYearId, status, sectionId } = req.query;
    const where = {
        student: { schoolId: schoolId }
    };
    if (academicYearId)
        where.academicYearId = academicYearId;
    if (status)
        where.status = status;
    // Filter by section if provided
    if (sectionId) {
        const enrollments = await prisma_1.prisma.studentEnrollment.findMany({
            where: { sectionId: sectionId },
            select: { studentId: true }
        });
        where.studentId = { in: enrollments.map(e => e.studentId) };
    }
    const fees = await prisma_1.prisma.studentFee.findMany({
        where,
        include: {
            student: { select: { id: true, firstName: true, lastName: true, admissionNumber: true } },
            feeStructure: { include: { class: true } },
            academicYear: true
        },
        orderBy: { createdAt: "desc" }
    });
    return (0, response_util_1.SuccessResponse)(res, "Student fees retrieved successfully", fees);
});
/**
 * @route   GET /api/fee/student/:id
 * @desc    Get student fee by ID with monthly details
 * @access  Admin/School
 */
exports.getStudentFeeById = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const fee = await prisma_1.prisma.studentFee.findUnique({
        where: { id: id },
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
    if (!fee)
        throw new response_util_1.ErrorResponse("Student fee not found", types_1.statusCode.Not_Found);
    return (0, response_util_1.SuccessResponse)(res, "Student fee retrieved successfully", fee);
});
/**
 * @route   GET /api/fee/student/student/:studentId
 * @desc    Get all fees for a specific student
 * @access  Admin/School/Parent/Student
 */
exports.getFeesByStudent = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { studentId } = req.params;
    const { status, academicYearId } = req.query;
    const where = { studentId: studentId };
    if (status && status !== "ALL") {
        where.status = status;
    }
    if (academicYearId) {
        where.academicYearId = academicYearId;
    }
    const fees = await prisma_1.prisma.studentFee.findMany({
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
    return (0, response_util_1.SuccessResponse)(res, "Student fees retrieved successfully", fees);
});
/**
 * @route   PUT /api/fee/student/:id
 * @desc    Update student fee status
 * @access  Admin/School
 */
exports.updateStudentFee = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const { id } = req.params;
    const validatedData = studentFee_validation_1.updateStudentFeeSchema.parse(req.body);
    const existing = await prisma_1.prisma.studentFee.findUnique({ where: { id: id } });
    if (!existing)
        throw new response_util_1.ErrorResponse("Student fee not found", types_1.statusCode.Not_Found);
    const fee = await prisma_1.prisma.studentFee.update({
        where: { id: id },
        data: validatedData
    });
    return (0, response_util_1.SuccessResponse)(res, "Student fee updated successfully", fee);
});
//# sourceMappingURL=studentFee.controller.js.map