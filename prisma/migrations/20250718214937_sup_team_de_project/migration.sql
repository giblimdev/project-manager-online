/*
  Warnings:

  - You are about to drop the column `teamId` on the `projects` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "projects" DROP CONSTRAINT "projects_teamId_fkey";

-- DropIndex
DROP INDEX "projects_teamId_key_key";

-- DropIndex
DROP INDEX "projects_teamId_slug_key";

-- AlterTable
ALTER TABLE "projects" DROP COLUMN "teamId";
