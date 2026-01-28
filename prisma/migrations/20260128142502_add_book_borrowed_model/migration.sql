/*
  Warnings:

  - You are about to alter the column `subscriptionStart` on the `schools` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `subscriptionEnd` on the `schools` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `checkInTime` on the `staff_attendances` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.
  - You are about to alter the column `checkOutTime` on the `staff_attendances` table. The data in that column could be lost. The data in that column will be cast from `DateTime(0)` to `DateTime`.

*/
-- AlterTable
ALTER TABLE `schools` MODIFY `subscriptionStart` DATETIME NULL,
    MODIFY `subscriptionEnd` DATETIME NULL;

-- AlterTable
ALTER TABLE `staff_attendances` MODIFY `checkInTime` DATETIME NULL,
    MODIFY `checkOutTime` DATETIME NULL;

-- CreateTable
CREATE TABLE `books_borrowed` (
    `id` VARCHAR(191) NOT NULL,
    `bookId` VARCHAR(191) NOT NULL,
    `studentId` VARCHAR(191) NULL,
    `teacherId` VARCHAR(191) NULL,
    `borrowDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueDate` DATETIME(3) NOT NULL,
    `returnDate` DATETIME(3) NULL,
    `status` ENUM('ISSUED', 'RETURNED', 'OVERDUE', 'LOST') NOT NULL DEFAULT 'ISSUED',
    `remarks` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `books_borrowed_bookId_idx`(`bookId`),
    INDEX `books_borrowed_studentId_idx`(`studentId`),
    INDEX `books_borrowed_teacherId_idx`(`teacherId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `books_borrowed` ADD CONSTRAINT `books_borrowed_bookId_fkey` FOREIGN KEY (`bookId`) REFERENCES `books`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books_borrowed` ADD CONSTRAINT `books_borrowed_studentId_fkey` FOREIGN KEY (`studentId`) REFERENCES `students`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `books_borrowed` ADD CONSTRAINT `books_borrowed_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
