/*
  Warnings:

  - You are about to drop the column `bookIssueId` on the `library_fines` table. All the data in the column will be lost.
  - You are about to alter the column `subscriptionStart` on the `schools` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `subscriptionEnd` on the `schools` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `checkInTime` on the `staff_attendances` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `checkOutTime` on the `staff_attendances` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to drop the `book_copies` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `book_issues` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `book_copies` DROP FOREIGN KEY `book_copies_bookId_fkey`;

-- DropForeignKey
ALTER TABLE `book_issues` DROP FOREIGN KEY `book_issues_bookCopyId_fkey`;

-- DropForeignKey
ALTER TABLE `book_issues` DROP FOREIGN KEY `book_issues_studentId_fkey`;

-- DropForeignKey
ALTER TABLE `book_issues` DROP FOREIGN KEY `book_issues_teacherId_fkey`;

-- DropForeignKey
ALTER TABLE `library_fines` DROP FOREIGN KEY `library_fines_bookIssueId_fkey`;

-- DropIndex
DROP INDEX `library_fines_bookIssueId_fkey` ON `library_fines`;

-- AlterTable
ALTER TABLE `books` ADD COLUMN `stocks` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `homeworks` ADD COLUMN `classId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `library_fines` DROP COLUMN `bookIssueId`,
    ADD COLUMN `bookId` VARCHAR(191) NULL,
    ADD COLUMN `studentId` VARCHAR(191) NULL,
    ADD COLUMN `teacherId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `schools` MODIFY `subscriptionStart` DATETIME NULL,
    MODIFY `subscriptionEnd` DATETIME NULL;

-- AlterTable
ALTER TABLE `staff_attendances` MODIFY `checkInTime` DATETIME NULL,
    MODIFY `checkOutTime` DATETIME NULL;

-- DropTable
DROP TABLE `book_copies`;

-- DropTable
DROP TABLE `book_issues`;

-- CreateIndex
CREATE INDEX `library_fines_studentId_idx` ON `library_fines`(`studentId`);

-- CreateIndex
CREATE INDEX `library_fines_bookId_idx` ON `library_fines`(`bookId`);

-- AddForeignKey
ALTER TABLE `library_fines` ADD CONSTRAINT `library_fines_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `books`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_fines` ADD CONSTRAINT `library_fines_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `library_fines` ADD CONSTRAINT `library_fines_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
