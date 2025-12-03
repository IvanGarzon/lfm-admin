-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "pdf_file_name" TEXT,
ADD COLUMN     "pdf_file_size" INTEGER,
ADD COLUMN     "pdf_mime_type" TEXT,
ADD COLUMN     "pdf_s3_key" TEXT,
ADD COLUMN     "pdf_s3_url" TEXT;
