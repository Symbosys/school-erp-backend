import type { Request, Response } from "express";
import { asyncHandler } from "../../../middlewares/error.middleware";
import { prisma } from "../../../config/prisma";
import { ErrorResponse, SuccessResponse } from "../../../utils/response.util";
import { statusCode } from "../../../types/types";
import {
  createSalaryComponentSchema,
  updateSalaryComponentSchema,
} from "../validation/salaryComponent.validation";

/**
 * @route   POST /api/teacher/salary/component
 * @desc    Create new salary component
 * @access  Admin/School
 */
export const createSalaryComponent = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createSalaryComponentSchema.parse(req.body);

  // Check school exists
  const school = await prisma.school.findUnique({ where: { id: validatedData.schoolId } });
  if (!school) throw new ErrorResponse("School not found", statusCode.Not_Found);

  // Check duplicate name
  const existing = await prisma.salaryComponent.findUnique({
    where: {
      schoolId_name: {
        schoolId: validatedData.schoolId,
        name: validatedData.name
      }
    }
  });

  if (existing) {
    throw new ErrorResponse("Salary component with this name already exists", statusCode.Conflict);
  }

  const component = await prisma.salaryComponent.create({
    data: {
      ...validatedData,
      defaultValue: validatedData.defaultValue ?? 0,
      isPercentage: validatedData.isPercentage ?? false,
      isTaxable: validatedData.isTaxable ?? true,
      isActive: validatedData.isActive ?? true
    }
  });

  return SuccessResponse(res, "Salary component created successfully", { ...component, defaultValue: Number(component.defaultValue) }, statusCode.Created);
});

/**
 * @route   GET /api/teacher/salary/component/school/:schoolId
 * @desc    Get all salary components for a school
 * @access  Admin/School
 */
export const getSalaryComponentsBySchool = asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = req.params;
  const { type, isActive } = req.query;

  const where: any = { schoolId: schoolId as string };
  if (type) where.type = type as string;
  if (isActive !== undefined) where.isActive = isActive === "true";

  const components = await prisma.salaryComponent.findMany({
    where,
    orderBy: [{ type: "asc" }, { name: "asc" }]
  });

  const transformedComponents = components.map(c => ({ ...c, defaultValue: Number(c.defaultValue) }));
  return SuccessResponse(res, "Salary components retrieved successfully", transformedComponents);
});

/**
 * @route   GET /api/teacher/salary/component/:id
 * @desc    Get salary component by ID
 * @access  Admin/School
 */
export const getSalaryComponentById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const component = await prisma.salaryComponent.findUnique({
    where: { id: id as string },
    include: {
      _count: { select: { salaryStructureItems: true } }
    }
  });

  if (!component) throw new ErrorResponse("Salary component not found", statusCode.Not_Found);

  return SuccessResponse(res, "Salary component retrieved successfully", { ...component, defaultValue: Number(component.defaultValue) });
});

/**
 * @route   PUT /api/teacher/salary/component/:id
 * @desc    Update salary component
 * @access  Admin/School
 */
export const updateSalaryComponent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateSalaryComponentSchema.parse(req.body);

  const existing = await prisma.salaryComponent.findUnique({ where: { id: id as string } });
  if (!existing) throw new ErrorResponse("Salary component not found", statusCode.Not_Found);

  const component = await prisma.salaryComponent.update({
    where: { id: id as string },
    data: validatedData
  });

  return SuccessResponse(res, "Salary component updated successfully", { ...component, defaultValue: Number(component.defaultValue) });
});

/**
 * @route   DELETE /api/teacher/salary/component/:id
 * @desc    Delete salary component
 * @access  Admin
 */
export const deleteSalaryComponent = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const component = await prisma.salaryComponent.findUnique({
    where: { id: id as string },
    include: { _count: { select: { salaryStructureItems: true } } }
  });

  if (!component) throw new ErrorResponse("Salary component not found", statusCode.Not_Found);

  const itemCount = (component as any)._count?.salaryStructureItems ?? 0;
  if (itemCount > 0) {
    throw new ErrorResponse("Cannot delete component used in salary structures", statusCode.Bad_Request);
  }

  await prisma.salaryComponent.delete({ where: { id: id as string } });

  return SuccessResponse(res, "Salary component deleted successfully", null);
});
