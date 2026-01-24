import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  processTeacherSalarySchema,
  bulkProcessSalarySchema,
  updateTeacherSalarySchema,
} from "../validation/teacherSalary.validation";

/**
 * Helper: Calculate salary from structure
 */
const calculateSalary = async (
  salaryStructureId: string,
  workingDays: number,
  presentDays: number
) => {
  const structure = await prisma.salaryStructure.findUnique({
    where: { id: salaryStructureId },
    include: {
      items: { include: { salaryComponent: true } }
    }
  });

  if (!structure) throw new Error("Salary structure not found");

  const baseSalary = Number(structure.baseSalary);
  const attendanceRatio = workingDays > 0 ? presentDays / workingDays : 1;

  let grossEarnings = 0;
  let totalDeductions = 0;
  const details: any[] = [];

  for (const item of structure.items) {
    let amount = Number(item.amount);
    
    // If percentage-based, calculate from base
    if (item.salaryComponent.isPercentage && item.percentage) {
      amount = baseSalary * (Number(item.percentage) / 100);
    }

    // Pro-rate based on attendance for earnings
    if (item.salaryComponent.type === "EARNING") {
      amount = amount * attendanceRatio;
      grossEarnings += amount;
    } else {
      totalDeductions += amount;
    }

    details.push({
      salaryComponentId: item.salaryComponentId,
      type: item.salaryComponent.type,
      amount: Math.round(amount * 100) / 100
    });
  }

  const netSalary = grossEarnings - totalDeductions;

  return {
    grossEarnings: Math.round(grossEarnings * 100) / 100,
    totalDeductions: Math.round(totalDeductions * 100) / 100,
    netSalary: Math.round(netSalary * 100) / 100,
    details
  };
};

/**
 * @route   POST /api/teacher/salary/process
 * @desc    Process/Generate monthly salary for a teacher
 * @access  Admin/School
 */
export const processTeacherSalary = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = processTeacherSalarySchema.parse(req.body);

  // Validate teacher
  const teacher = await prisma.teacher.findUnique({ where: { id: validatedData.teacherId } });
  if (!teacher) throw new ErrorResponse("Teacher not found", statusCode.Not_Found);

  // Validate salary structure
  const structure = await prisma.salaryStructure.findUnique({ where: { id: validatedData.salaryStructureId } });
  if (!structure) throw new ErrorResponse("Salary structure not found", statusCode.Not_Found);

  // Check same school
  if (teacher.schoolId !== structure.schoolId) {
    throw new ErrorResponse("Teacher and structure must belong to the same school", statusCode.Bad_Request);
  }

  // Check if already exists
  const existing = await prisma.teacherSalary.findUnique({
    where: {
      teacherId_month_year: {
        teacherId: validatedData.teacherId,
        month: validatedData.month,
        year: validatedData.year
      }
    }
  });

  if (existing) {
    throw new ErrorResponse("Salary already processed for this month", statusCode.Conflict);
  }

  // Get attendance data if not provided
  let workingDays = validatedData.workingDays ?? 26;
  let presentDays = validatedData.presentDays ?? workingDays;
  let leaveDays = validatedData.leaveDays ?? 0;

  // Try to get from attendance records
  const startDate = new Date(validatedData.year, validatedData.month - 1, 1);
  const endDate = new Date(validatedData.year, validatedData.month, 0);

  const attendanceData = await prisma.staffAttendance.groupBy({
    by: ["status"],
    where: {
      teacherId: validatedData.teacherId,
      date: { gte: startDate, lte: endDate }
    },
    _count: { status: true }
  });

  if (attendanceData.length > 0) {
    presentDays = attendanceData.find(a => a.status === "PRESENT")?._count.status ?? 0;
    const late = attendanceData.find(a => a.status === "LATE")?._count.status ?? 0;
    const halfDay = attendanceData.find(a => a.status === "HALF_DAY")?._count.status ?? 0;
    presentDays += late + (halfDay * 0.5);
    leaveDays = attendanceData.find(a => a.status === "ON_LEAVE")?._count.status ?? 0;
  }

  // Calculate salary
  // Deduct holidays from working days
  const holidaysCount = await prisma.holiday.count({
    where: {
      schoolId: teacher.schoolId,
      date: {
        gte: startDate,
        lte: endDate
      },
      isActive: true
    }
  });

  const effectiveWorkingDays = Math.max(1, workingDays - holidaysCount); 

  const calculated = await calculateSalary(validatedData.salaryStructureId, effectiveWorkingDays, presentDays);

  // Create salary record with details
  const salary = await prisma.teacherSalary.create({
    data: {
      teacherId: validatedData.teacherId,
      salaryStructureId: validatedData.salaryStructureId,
      month: validatedData.month,
      year: validatedData.year,
      workingDays,
      presentDays: Math.floor(presentDays),
      leaveDays,
      grossEarnings: calculated.grossEarnings,
      totalDeductions: calculated.totalDeductions,
      netSalary: calculated.netSalary,
      status: "PROCESSED",
      processedAt: new Date(),
      remarks: validatedData.remarks,
      details: {
        create: calculated.details
      }
    },
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      details: { include: { salaryComponent: true } }
    }
  });

  const transformedSalary = {
    ...salary,
    grossEarnings: Number(salary.grossEarnings),
    totalDeductions: Number(salary.totalDeductions),
    netSalary: Number(salary.netSalary),
    details: salary.details?.map(d => ({ ...d, amount: Number(d.amount) }))
  };

  return SuccessResponse(res, "Salary processed successfully", transformedSalary, statusCode.Created);
});

/**
 * @route   POST /api/teacher/salary/process/bulk
 * @desc    Bulk process salaries for all teachers in a school
 * @access  Admin/School
 */
export const bulkProcessSalary = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = bulkProcessSalarySchema.parse(req.body);

  // Get all active teachers with salary structures assigned
  const teachers = await prisma.teacher.findMany({
    where: {
      schoolId: validatedData.schoolId,
      isActive: true,
      status: { not: "TERMINATED" }
    }
  });

  // Get default salary structure for school
  const defaultStructure = await prisma.salaryStructure.findFirst({
    where: { schoolId: validatedData.schoolId, isActive: true }
  });

  if (!defaultStructure) {
    throw new ErrorResponse("No active salary structure found", statusCode.Bad_Request);
  }

  let processedCount = 0;
  let skippedCount = 0;

  for (const teacher of teachers) {
    // Check if already processed
    const existing = await prisma.teacherSalary.findUnique({
      where: {
        teacherId_month_year: {
          teacherId: teacher.id,
          month: validatedData.month,
          year: validatedData.year
        }
      }
    });

    if (existing) {
      skippedCount++;
      continue;
    }

    try {
      const workingDays = 26;
      const calculated = await calculateSalary(defaultStructure.id, workingDays, workingDays);

      await prisma.teacherSalary.create({
        data: {
          teacherId: teacher.id,
          salaryStructureId: defaultStructure.id,
          month: validatedData.month,
          year: validatedData.year,
          workingDays,
          presentDays: workingDays,
          leaveDays: 0,
          grossEarnings: calculated.grossEarnings,
          totalDeductions: calculated.totalDeductions,
          netSalary: calculated.netSalary,
          status: "PROCESSED",
          processedAt: new Date(),
          details: { create: calculated.details }
        }
      });
      processedCount++;
    } catch (error) {
      skippedCount++;
    }
  }

  return SuccessResponse(res, "Bulk salary processing completed", {
    processed: processedCount,
    skipped: skippedCount,
    total: teachers.length
  }, statusCode.Created);
});

/**
 * @route   GET /api/teacher/salary/school/:schoolId
 * @desc    Get all salaries for a school
 * @access  Admin/School
 */
export const getSalariesBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { month, year, status } = req.query;

  const where: any = {
    teacher: { schoolId: schoolId as string }
  };
  if (month) where.month = parseInt(month as string);
  if (year) where.year = parseInt(year as string);
  if (status) where.status = status as string;

  const salaries = await prisma.teacherSalary.findMany({
    where,
    include: {
      teacher: { select: { id: true, firstName: true, lastName: true, employeeId: true } },
      salaryStructure: { select: { name: true } }
    },
    orderBy: [{ year: "desc" }, { month: "desc" }]
  });

  const transformedSalaries = salaries.map(s => ({
    ...s,
    grossEarnings: Number(s.grossEarnings),
    totalDeductions: Number(s.totalDeductions),
    netSalary: Number(s.netSalary),
    details: (s as any).details?.map((d: any) => ({ ...d, amount: Number(d.amount) })),
    payments: (s as any).payments?.map((p: any) => ({ ...p, amount: Number(p.amount) }))
  }));

  return SuccessResponse(res, "Salaries retrieved successfully", transformedSalaries);
});

/**
 * @route   GET /api/teacher/salary/teacher/:teacherId
 * @desc    Get salary history for a teacher
 * @access  Admin/School/Teacher
 */
export const getSalaryByTeacher = asyncHandler(async (req: Request, res: Response) => {
  const { teacherId } = req.params;

  const salaries = await prisma.teacherSalary.findMany({
    where: { teacherId: teacherId as string },
    include: {
      salaryStructure: { select: { name: true } },
      payments: true
    },
    orderBy: [{ year: "desc" }, { month: "desc" }]
  });

  const transformedSalaries = salaries.map(s => ({
    ...s,
    grossEarnings: Number(s.grossEarnings),
    totalDeductions: Number(s.totalDeductions),
    netSalary: Number(s.netSalary),
    details: (s as any).details?.map((d: any) => ({ ...d, amount: Number(d.amount) })),
    payments: s.payments?.map(p => ({ ...p, amount: Number(p.amount) }))
  }));

  return SuccessResponse(res, "Teacher salary history retrieved", transformedSalaries);
});

/**
 * @route   GET /api/teacher/salary/:id
 * @desc    Get salary by ID with full details
 * @access  Admin/School/Teacher
 */
export const getSalaryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const salary = await prisma.teacherSalary.findUnique({
    where: { id: id as string },
    include: {
      teacher: true,
      salaryStructure: true,
      details: { include: { salaryComponent: true } },
      payments: true
    }
  });

  if (!salary) throw new ErrorResponse("Salary record not found", statusCode.Not_Found);

  const transformedSalary = {
    ...salary,
    grossEarnings: Number(salary.grossEarnings),
    totalDeductions: Number(salary.totalDeductions),
    netSalary: Number(salary.netSalary),
    details: salary.details?.map(d => ({ ...d, amount: Number(d.amount) })),
    payments: salary.payments?.map(p => ({ ...p, amount: Number(p.amount) }))
  };

  return SuccessResponse(res, "Salary retrieved successfully", transformedSalary);
});

/**
 * @route   PUT /api/teacher/salary/:id
 * @desc    Update salary record
 * @access  Admin/School
 */
export const updateTeacherSalary = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateTeacherSalarySchema.parse(req.body);

  const existing = await prisma.teacherSalary.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Salary record not found", statusCode.Not_Found);

  if (existing.status === "PAID") {
    throw new ErrorResponse("Cannot update paid salary", statusCode.Bad_Request);
  }

  const salary = await prisma.teacherSalary.update({
    where: { id: id as string },
    data: validatedData
  });

  const transformedSalary = {
    ...salary,
    grossEarnings: Number(salary.grossEarnings),
    totalDeductions: Number(salary.totalDeductions),
    netSalary: Number(salary.netSalary)
  };

  return SuccessResponse(res, "Salary updated successfully", transformedSalary);
});
