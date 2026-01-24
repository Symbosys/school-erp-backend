import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createSalaryStructureSchema,
  updateSalaryStructureSchema,
  addSalaryStructureItemSchema,
} from "../validation/salaryStructure.validation";

/**
 * @route   POST /api/teacher/salary/structure
 * @desc    Create new salary structure with components
 * @access  Admin/School
 */
export const createSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createSalaryStructureSchema.parse(req.body);

  // Check school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Check duplicate name
  const existing = await prisma.salaryStructure.findUnique({
    where: {
      schoolId_name: {
        schoolId: validatedData.schoolId,
        name: validatedData.name
      }
    }
  });

  if (existing) {
    throw new ErrorResponse("Salary structure with this name already exists", statusCode.Conflict);
  }

  // Create structure with items
  const structure = await prisma.salaryStructure.create({
    data: {
      schoolId: validatedData.schoolId,
      name: validatedData.name,
      description: validatedData.description,
      baseSalary: validatedData.baseSalary,
      isActive: validatedData.isActive ?? true,
      items: {
        create: validatedData.items.map(item => ({
          salaryComponentId: item.salaryComponentId,
          amount: item.amount,
          percentage: item.percentage
        }))
      }
    },
    include: {
      items: {
        include: { salaryComponent: true }
      }
    }
  });

  const transformedStructure = {
    ...structure,
    baseSalary: Number(structure.baseSalary),
    items: structure.items.map(i => ({
      ...i,
      amount: Number(i.amount),
      percentage: i.percentage ? Number(i.percentage) : null
    }))
  };

  return SuccessResponse(res, "Salary structure created successfully", transformedStructure, statusCode.Created);
});

/**
 * @route   GET /api/teacher/salary/structure/school/:schoolId
 * @desc    Get all salary structures for a school
 * @access  Admin/School
 */
export const getSalaryStructuresBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { isActive } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (isActive !== undefined) where.isActive = isActive === "true";

  const structures = await prisma.salaryStructure.findMany({
    where,
    include: {
      items: { include: { salaryComponent: true } },
      _count: { select: { teacherSalaries: true } }
    },
    orderBy: { name: "asc" }
  });

  const transformedStructures = structures.map(s => ({
    ...s,
    baseSalary: Number(s.baseSalary),
    items: s.items?.map(i => ({
      ...i,
      amount: Number(i.amount),
      percentage: i.percentage ? Number(i.percentage) : null
    }))
  }));

  return SuccessResponse(res, "Salary structures retrieved successfully", transformedStructures);
});

/**
 * @route   GET /api/teacher/salary/structure/:id
 * @desc    Get salary structure by ID
 * @access  Admin/School
 */
export const getSalaryStructureById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const structure = await prisma.salaryStructure.findUnique({
    where: { id: id as string },
    include: {
      items: { include: { salaryComponent: true } },
      _count: { select: { teacherSalaries: true } }
    }
  });

  if (!structure) throw new ErrorResponse("Salary structure not found", statusCode.Not_Found);

  const transformedStructure = {
    ...structure,
    baseSalary: Number(structure.baseSalary),
    items: structure.items?.map(i => ({
      ...i,
      amount: Number(i.amount),
      percentage: i.percentage ? Number(i.percentage) : null
    }))
  };

  return SuccessResponse(res, "Salary structure retrieved successfully", transformedStructure);
});

/**
 * @route   PUT /api/teacher/salary/structure/:id
 * @desc    Update salary structure
 * @access  Admin/School
 */
export const updateSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateSalaryStructureSchema.parse(req.body);

  const existing = await prisma.salaryStructure.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Salary structure not found", statusCode.Not_Found);

  const structure = await prisma.salaryStructure.update({
    where: { id: id as string },
    data: validatedData,
    include: {
      items: { include: { salaryComponent: true } }
    }
  });

  const transformedStructure = {
    ...structure,
    baseSalary: Number(structure.baseSalary),
    items: structure.items?.map(i => ({
      ...i,
      amount: Number(i.amount),
      percentage: i.percentage ? Number(i.percentage) : null
    }))
  };

  return SuccessResponse(res, "Salary structure updated successfully", transformedStructure);
});

/**
 * @route   DELETE /api/teacher/salary/structure/:id
 * @desc    Delete salary structure
 * @access  Admin
 */
export const deleteSalaryStructure = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const structure = await prisma.salaryStructure.findUnique({
    where: { id: id as string },
    include: { _count: { select: { teacherSalaries: true } } }
  });

  if (!structure) throw new ErrorResponse("Salary structure not found", statusCode.Not_Found);

  const salaryCount = (structure as any)._count?.teacherSalaries ?? 0;
  if (salaryCount > 0) {
    throw new ErrorResponse("Cannot delete structure used in teacher salaries", statusCode.Bad_Request);
  }

  await prisma.salaryStructure.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Salary structure deleted successfully", null);
});

/**
 * @route   POST /api/teacher/salary/structure/item
 * @desc    Add item to salary structure
 * @access  Admin/School
 */
export const addSalaryStructureItem = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = addSalaryStructureItemSchema.parse(req.body);

  const structure = await prisma.salaryStructure.findUnique({ where: { id: validatedData.salaryStructureId } });
  if (!structure) throw new ErrorResponse("Salary structure not found", statusCode.Not_Found);

  const component = await prisma.salaryComponent.findUnique({ where: { id: validatedData.salaryComponentId } });
  if (!component) throw new ErrorResponse("Salary component not found", statusCode.Not_Found);

  // Check same school
  if (structure.schoolId !== component.schoolId) {
    throw new ErrorResponse("Component must belong to the same school", statusCode.Bad_Request);
  }

  const item = await prisma.salaryStructureItem.create({
    data: {
      salaryStructureId: validatedData.salaryStructureId,
      salaryComponentId: validatedData.salaryComponentId,
      amount: validatedData.amount,
      percentage: validatedData.percentage
    },
    include: { salaryComponent: true }
  });

  return SuccessResponse(res, "Item added to structure successfully", item, statusCode.Created);
});

/**
 * @route   DELETE /api/teacher/salary/structure/item/:id
 * @desc    Remove item from salary structure
 * @access  Admin/School
 */
export const removeSalaryStructureItem = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const item = await prisma.salaryStructureItem.findUnique({ where: { id: id as string } });
  if (!item) throw new ErrorResponse("Item not found", statusCode.Not_Found);

  await prisma.salaryStructureItem.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Item removed successfully", null);
});
