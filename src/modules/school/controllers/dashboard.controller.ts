// Dashboard Controller to get the total students, teachers, classes, subjects, and fee in this month collected  etc.

import { prisma } from "../../../config/prisma";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { SuccessResponse } from "../../../utils/response.util";


export const getSchoolStats = asyncHandler(async (req, res) => {
    const schoolId = String(req.params.id);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const [totalStudents, totalTeachers, totalClasses, feeCollected] = await prisma.$transaction([
        prisma.student.count({
            where: {
                schoolId,
            }
        }),
        prisma.teacher.count({
            where: {
                schoolId,
            }
        }),
        prisma.class.count({
            where: {
                schoolId,
            }
        }),
        prisma.feePayment.aggregate({
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