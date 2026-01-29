/*
  Warnings:

  - You are about to alter the column `subscriptionStart` on the `schools` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `subscriptionEnd` on the `schools` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `checkInTime` on the `staff_attendances` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `checkOutTime` on the `staff_attendances` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the `salary_components` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_payments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_structure_items` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `salary_structures` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_salaries` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `teacher_salary_details` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `salary_components` DROP FOREIGN KEY `salary_components_schoolId_fkey`;

-- DropForeignKey
ALTER TABLE `salary_payments` DROP FOREIGN KEY `salary_payments_teacherSalaryId_fkey`;

-- DropForeignKey
ALTER TABLE `salary_structure_items` DROP FOREIGN KEY `salary_structure_items_salaryComponentId_fkey`;

-- DropForeignKey
ALTER TABLE `salary_structure_items` DROP FOREIGN KEY `salary_structure_items_salaryStructureId_fkey`;

-- DropForeignKey
ALTER TABLE `salary_structures` DROP FOREIGN KEY `salary_structures_schoolId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_salaries` DROP FOREIGN KEY `teacher_salaries_salaryStructureId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_salaries` DROP FOREIGN KEY `teacher_salaries_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_salary_details` DROP FOREIGN KEY `teacher_salary_details_salaryComponentId_fkey`;

-- DropForeignKey
ALTER TABLE `teacher_salary_details` DROP FOREIGN KEY `teacher_salary_details_teacherSalaryId_fkey`;

-- AlterTable
ALTER TABLE `schools` MODIFY `subscriptionStart` DATETIME NULL,
    MODIFY `subscriptionEnd` DATETIME NULL;

-- AlterTable
ALTER TABLE `staff_attendances` MODIFY `checkInTime` DATETIME NULL,
    MODIFY `checkOutTime` DATETIME NULL;

-- AlterTable
ALTER TABLE `teachers` ADD COLUMN `monthlySalary` DECIMAL(10, 2) NOT NULL DEFAULT 0.00;

-- DropTable
DROP TABLE `salary_components`;

-- DropTable
DROP TABLE `salary_payments`;

-- DropTable
DROP TABLE `salary_structure_items`;

-- DropTable
DROP TABLE `salary_structures`;

-- DropTable
DROP TABLE `teacher_salaries`;

-- DropTable
DROP TABLE `teacher_salary_details`;
