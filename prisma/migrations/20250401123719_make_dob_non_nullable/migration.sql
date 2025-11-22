/*
  Warnings:

  - Made the column `dob` on table `employees` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "employees" ALTER COLUMN "dob" SET NOT NULL;
