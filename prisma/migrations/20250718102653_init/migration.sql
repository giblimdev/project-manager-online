/*
  Warnings:

  - The values [FOLDER] on the enum `FileType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FileType_new" AS ENUM ('DOCUMENT', 'IMAGE', 'VIDEO', 'ARCHIVE', 'CODE', 'SPECIFICATION', 'DESIGN', 'TEST', 'OTHER');
ALTER TABLE "file" ALTER COLUMN "type" TYPE "FileType_new" USING ("type"::text::"FileType_new");
ALTER TYPE "FileType" RENAME TO "FileType_old";
ALTER TYPE "FileType_new" RENAME TO "FileType";
DROP TYPE "FileType_old";
COMMIT;

-- AlterTable
ALTER TABLE "file" ADD COLUMN     "decription" TEXT,
ADD COLUMN     "export" JSONB,
ADD COLUMN     "import" JSONB,
ADD COLUMN     "script" TEXT;
