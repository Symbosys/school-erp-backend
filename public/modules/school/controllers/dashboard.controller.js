"use strict";
// Dashboard Controller to get the total students, teachers, classes, subjects, and fee in this month collected  etc.
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSchoolStats = void 0;
const prisma_1 = require("../../../config/prisma");
const error_middleware_1 = require("../../../middlewares/error.middleware");
exports.getSchoolStats = (0, error_middleware_1.asyncHandler)(async (req, res) => {
    const schoolId = req.school.id;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [totalStudents, totalTeachers, totalClasses, feeCollected] = await prisma_1.prisma.$transaction([
        prisma_1.prisma.student.count({
            where: {
                schoolId,
            }
        }),
        prisma_1.prisma.teacher.count({
            where: {
                schoolId,
            }
        }),
        prisma_1.prisma.class.count({
            where: {
                schoolId,
            }
        }),
        prisma_1.prisma.feePayment.aggregate({
            _sum: {
                amount: true
            },
            where: {
                paymentDate: {
                    gte: startOfMonth,
                    lt: startOfNextMonth
                },
                studentFeeDetail: {
                    studentFee: {
                        student: {
                            schoolId
                        }
                    }
                }
            }
        })
    ]);
    res.json({
        success: true,
        data: {
            totalStudents,
            totalTeachers,
            totalClasses,
            feeCollected: feeCollected._sum.amount || 0
        }
    });
});
//# sourceMappingURL=dashboard.controller.js.map