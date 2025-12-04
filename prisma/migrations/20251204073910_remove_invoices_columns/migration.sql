/*
  Warnings:

  - You are about to drop the column `file_name` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `file_size` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `last_generated_at` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `mime_type` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `s3_key` on the `invoices` table. All the data in the column will be lost.
  - You are about to drop the column `s3_url` on the `invoices` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invoices" DROP COLUMN "file_name",
DROP COLUMN "file_size",
DROP COLUMN "last_generated_at",
DROP COLUMN "mime_type",
DROP COLUMN "s3_key",
DROP COLUMN "s3_url";
