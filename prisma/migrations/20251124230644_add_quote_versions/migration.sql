-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "parent_quote_id" TEXT,
ADD COLUMN     "version_number" INTEGER NOT NULL DEFAULT 1;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_parent_quote_id_fkey" FOREIGN KEY ("parent_quote_id") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
