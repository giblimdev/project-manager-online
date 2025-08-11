/*
  Warnings:

  - The values [DOCUMENT,IMAGE,VIDEO,ARCHIVE,CODE,SPECIFICATION,DESIGN] on the enum `FileType` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `isPublic` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `originalName` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `size` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `uploaderId` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `files` table. All the data in the column will be lost.
  - Made the column `projectId` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `featureId` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userStoryId` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `taskId` on table `files` required. This step will fail if there are existing NULL values in that column.
  - Made the column `sprintId` on table `files` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "FileType_new" AS ENUM ('DOSSIER', 'PAGE', 'COMPONENT', 'UTILS', 'LIB', 'STORE', 'HOOK', 'ENV', 'SYSTEM', 'TEST', 'OTHER');
ALTER TABLE "files" ALTER COLUMN "type" TYPE "FileType_new" USING ("type"::text::"FileType_new");
ALTER TYPE "FileType" RENAME TO "FileType_old";
ALTER TYPE "FileType_new" RENAME TO "FileType";
DROP TYPE "FileType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_uploaderId_fkey";

-- AlterTable
ALTER TABLE "files" DROP COLUMN "isPublic",
DROP COLUMN "originalName",
DROP COLUMN "size",
DROP COLUMN "uploaderId",
DROP COLUMN "url",
ADD COLUMN     "use" TEXT,
ALTER COLUMN "import" SET DATA TYPE TEXT,
ALTER COLUMN "export" SET DATA TYPE TEXT,
ALTER COLUMN "projectId" SET NOT NULL,
ALTER COLUMN "featureId" SET NOT NULL,
ALTER COLUMN "userStoryId" SET NOT NULL,
ALTER COLUMN "taskId" SET NOT NULL,
ALTER COLUMN "sprintId" SET NOT NULL;

-- CreateTable
CREATE TABLE "_FileToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FileToUser_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_FileToUser_B_index" ON "_FileToUser"("B");

-- AddForeignKey
ALTER TABLE "_FileToUser" ADD CONSTRAINT "_FileToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToUser" ADD CONSTRAINT "_FileToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
