/*
  Warnings:

  - You are about to drop the column `organizationId` on the `project` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `template` table. All the data in the column will be lost.
  - You are about to drop the `organization` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `organization_member` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[teamId,slug]` on the table `project` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[teamId,key]` on the table `project` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `teamId` to the `project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `teamId` to the `template` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ItemStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'CANCELLED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PRIVATE', 'PUBLIC', 'INTERNAL');

-- DropForeignKey
ALTER TABLE "organization_member" DROP CONSTRAINT "organization_member_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "organization_member" DROP CONSTRAINT "organization_member_userId_fkey";

-- DropForeignKey
ALTER TABLE "project" DROP CONSTRAINT "project_organizationId_fkey";

-- DropForeignKey
ALTER TABLE "template" DROP CONSTRAINT "template_organizationId_fkey";

-- DropIndex
DROP INDEX "project_organizationId_key_key";

-- DropIndex
DROP INDEX "project_organizationId_slug_key";

-- AlterTable
ALTER TABLE "project" DROP COLUMN "organizationId",
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000,
ADD COLUMN     "teamId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "template" DROP COLUMN "organizationId",
ADD COLUMN     "teamId" TEXT NOT NULL;

-- DropTable
DROP TABLE "organization";

-- DropTable
DROP TABLE "organization_member";

-- CreateTable
CREATE TABLE "team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "slug" TEXT NOT NULL,
    "logoUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "parentTeamId" TEXT,

    CONSTRAINT "team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_member" (
    "id" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DEVELOPER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "team_member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objective" TEXT,
    "slug" TEXT NOT NULL,
    "key" TEXT,
    "priority" "Priority" DEFAULT 'MEDIUM',
    "acceptanceCriteria" TEXT,
    "storyPoints" INTEGER,
    "businessValue" INTEGER,
    "technicalRisk" INTEGER,
    "effort" INTEGER,
    "progress" INTEGER,
    "status" "ItemStatus" NOT NULL DEFAULT 'ACTIVE',
    "visibility" "Visibility" NOT NULL DEFAULT 'PRIVATE',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "settings" JSONB DEFAULT '{}',
    "metadata" JSONB DEFAULT '{}',
    "text" JSONB DEFAULT '{}',
    "backlogPosition" INTEGER,
    "DoD" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "estimatedHours" INTEGER,
    "actualHours" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "teamId" TEXT NOT NULL,
    "parentId" TEXT,
    "sprintId" TEXT,

    CONSTRAINT "items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_FileToItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FileToItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CommentToItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CommentToItem_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ItemAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ItemAssignees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_ItemToTimeEntry" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ItemToTimeEntry_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "team_slug_key" ON "team"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "team_member_teamId_userId_key" ON "team_member"("teamId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "items_teamId_slug_key" ON "items"("teamId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "items_teamId_key_key" ON "items"("teamId", "key");

-- CreateIndex
CREATE INDEX "_FileToItem_B_index" ON "_FileToItem"("B");

-- CreateIndex
CREATE INDEX "_CommentToItem_B_index" ON "_CommentToItem"("B");

-- CreateIndex
CREATE INDEX "_ItemAssignees_B_index" ON "_ItemAssignees"("B");

-- CreateIndex
CREATE INDEX "_ItemToTimeEntry_B_index" ON "_ItemToTimeEntry"("B");

-- CreateIndex
CREATE UNIQUE INDEX "project_teamId_slug_key" ON "project"("teamId", "slug");

-- CreateIndex
CREATE UNIQUE INDEX "project_teamId_key_key" ON "project"("teamId", "key");

-- AddForeignKey
ALTER TABLE "team" ADD CONSTRAINT "team_parentTeamId_fkey" FOREIGN KEY ("parentTeamId") REFERENCES "team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_member" ADD CONSTRAINT "team_member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project" ADD CONSTRAINT "project_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "template" ADD CONSTRAINT "template_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToItem" ADD CONSTRAINT "_FileToItem_A_fkey" FOREIGN KEY ("A") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToItem" ADD CONSTRAINT "_FileToItem_B_fkey" FOREIGN KEY ("B") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommentToItem" ADD CONSTRAINT "_CommentToItem_A_fkey" FOREIGN KEY ("A") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CommentToItem" ADD CONSTRAINT "_CommentToItem_B_fkey" FOREIGN KEY ("B") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemAssignees" ADD CONSTRAINT "_ItemAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemAssignees" ADD CONSTRAINT "_ItemAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToTimeEntry" ADD CONSTRAINT "_ItemToTimeEntry_A_fkey" FOREIGN KEY ("A") REFERENCES "items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ItemToTimeEntry" ADD CONSTRAINT "_ItemToTimeEntry_B_fkey" FOREIGN KEY ("B") REFERENCES "time_entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;
