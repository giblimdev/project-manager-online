/*
  Warnings:

  - You are about to drop the column `taskId` on the `files` table. All the data in the column will be lost.
  - You are about to drop the column `userStoryId` on the `tasks` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "files" DROP CONSTRAINT "files_taskId_fkey";

-- DropForeignKey
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_userStoryId_fkey";

-- AlterTable
ALTER TABLE "files" DROP COLUMN "taskId";

-- AlterTable
ALTER TABLE "tasks" DROP COLUMN "userStoryId",
ADD COLUMN     "projectId" TEXT,
ADD COLUMN     "userstoryId" TEXT;

-- CreateTable
CREATE TABLE "_EpicToTask" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EpicToTask_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FeatureToTask" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FeatureToTask_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_TaskToUserStory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskToUserStory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SprintToTask" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SprintToTask_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_FileToTask" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_FileToTask_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EpicToTask_B_index" ON "_EpicToTask"("B");

-- CreateIndex
CREATE INDEX "_FeatureToTask_B_index" ON "_FeatureToTask"("B");

-- CreateIndex
CREATE INDEX "_TaskToUserStory_B_index" ON "_TaskToUserStory"("B");

-- CreateIndex
CREATE INDEX "_SprintToTask_B_index" ON "_SprintToTask"("B");

-- CreateIndex
CREATE INDEX "_FileToTask_B_index" ON "_FileToTask"("B");

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpicToTask" ADD CONSTRAINT "_EpicToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "epics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpicToTask" ADD CONSTRAINT "_EpicToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeatureToTask" ADD CONSTRAINT "_FeatureToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "features"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FeatureToTask" ADD CONSTRAINT "_FeatureToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskToUserStory" ADD CONSTRAINT "_TaskToUserStory_A_fkey" FOREIGN KEY ("A") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskToUserStory" ADD CONSTRAINT "_TaskToUserStory_B_fkey" FOREIGN KEY ("B") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SprintToTask" ADD CONSTRAINT "_SprintToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SprintToTask" ADD CONSTRAINT "_SprintToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToTask" ADD CONSTRAINT "_FileToTask_A_fkey" FOREIGN KEY ("A") REFERENCES "files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_FileToTask" ADD CONSTRAINT "_FileToTask_B_fkey" FOREIGN KEY ("B") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
