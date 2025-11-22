/*
  Warnings:

  - You are about to drop the `session_metadata` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "session_metadata" DROP CONSTRAINT "session_metadata_session_id_fkey";

-- AlterTable
ALTER TABLE "sessions" ADD COLUMN     "browser_name" TEXT,
ADD COLUMN     "browser_version" TEXT,
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "device_model" TEXT,
ADD COLUMN     "device_name" TEXT,
ADD COLUMN     "device_type" TEXT,
ADD COLUMN     "device_vendor" TEXT,
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "os_name" TEXT,
ADD COLUMN     "os_version" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "user_agent" TEXT;

-- DropTable
DROP TABLE "session_metadata";
