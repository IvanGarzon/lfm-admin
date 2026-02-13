/*
  Warnings:

  - Made the column `gender` on table `employees` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dob` on table `employees` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "EmployeeStatus" ADD VALUE 'ON_LEAVE';

-- AlterEnum
ALTER TYPE "Gender" ADD VALUE 'OTHER';

-- AlterTable
ALTER TABLE "employees" ADD COLUMN     "deleted_at" TIMESTAMPTZ,
ALTER COLUMN "gender" SET NOT NULL,
ALTER COLUMN "dob" SET NOT NULL;

-- CreateIndex
CREATE INDEX "employees_status_deleted_at_idx" ON "employees"("status", "deleted_at");
