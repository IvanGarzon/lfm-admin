/*
  Warnings:

  - The values [DELETED] on the enum `OrganizationStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "OrganizationStatus_new" AS ENUM ('ACTIVE', 'INACTIVE');
ALTER TABLE "public"."organizations" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "organizations" ALTER COLUMN "status" TYPE "OrganizationStatus_new" USING ("status"::text::"OrganizationStatus_new");
ALTER TYPE "OrganizationStatus" RENAME TO "OrganizationStatus_old";
ALTER TYPE "OrganizationStatus_new" RENAME TO "OrganizationStatus";
DROP TYPE "public"."OrganizationStatus_old";
ALTER TABLE "organizations" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;

-- DropIndex
DROP INDEX "organizations_email_idx";

-- DropIndex
DROP INDEX "organizations_status_idx";
