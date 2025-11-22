/*
  Warnings:

  - The values [INFO,WARN,ERROR] on the enum `AuditLevel` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `entity_id` on the `audit` table. All the data in the column will be lost.
  - You are about to drop the column `entity_type` on the `audit` table. All the data in the column will be lost.
  - You are about to drop the column `ip` on the `audit` table. All the data in the column will be lost.
  - You are about to drop the column `user_agent` on the `audit` table. All the data in the column will be lost.
  - Added the required column `tag` to the `audit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditLevel_new" AS ENUM ('info', 'warn', 'error');
ALTER TABLE "audit" ALTER COLUMN "level" DROP DEFAULT;
ALTER TABLE "audit" ALTER COLUMN "level" TYPE "AuditLevel_new" USING ("level"::text::"AuditLevel_new");
ALTER TYPE "AuditLevel" RENAME TO "AuditLevel_old";
ALTER TYPE "AuditLevel_new" RENAME TO "AuditLevel";
DROP TYPE "AuditLevel_old";
ALTER TABLE "audit" ALTER COLUMN "level" SET DEFAULT 'info';
COMMIT;

-- AlterTable
ALTER TABLE "audit" DROP COLUMN "entity_id",
DROP COLUMN "entity_type",
DROP COLUMN "ip",
DROP COLUMN "user_agent",
ADD COLUMN     "tag" TEXT NOT NULL,
ALTER COLUMN "level" SET DEFAULT 'info';
