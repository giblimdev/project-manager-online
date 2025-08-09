-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FileType" ADD VALUE 'PAGE';
ALTER TYPE "FileType" ADD VALUE 'COMPONENT';
ALTER TYPE "FileType" ADD VALUE 'UTILS';
ALTER TYPE "FileType" ADD VALUE 'LIB';
ALTER TYPE "FileType" ADD VALUE 'STORE';
ALTER TYPE "FileType" ADD VALUE 'HOOK';

-- AlterTable
ALTER TABLE "files" ALTER COLUMN "mimeType" DROP NOT NULL;
