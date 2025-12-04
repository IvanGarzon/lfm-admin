/*
  Warnings:

  - A unique constraint covering the columns `[receipt_number]` on the table `invoices` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "receipt_number" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "invoices_receipt_number_key" ON "invoices"("receipt_number");
