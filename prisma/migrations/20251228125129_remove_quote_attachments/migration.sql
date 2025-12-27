/*
  Warnings:

  - You are about to drop the `quote_attachments` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "quote_attachments" DROP CONSTRAINT "quote_attachments_quote_id_fkey";

-- DropTable
DROP TABLE "quote_attachments";
