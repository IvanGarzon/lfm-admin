-- AlterTable
ALTER TABLE "vendors" ADD COLUMN     "formatted_address" TEXT,
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION;
