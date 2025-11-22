/*
  Warnings:

  - You are about to drop the column `date_of_birth` on the `employees` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "employees" DROP COLUMN "date_of_birth",
ADD COLUMN     "dob" DATE;
