/*
  Warnings:

  - You are about to drop the column `notes` on the `quote_item_attachments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "quote_item_attachments" DROP COLUMN "notes";

-- AlterTable
ALTER TABLE "quote_items" ADD COLUMN     "notes" TEXT;
