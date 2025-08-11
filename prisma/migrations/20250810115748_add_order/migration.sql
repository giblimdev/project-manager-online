/*
  Warnings:

  - You are about to drop the column `ordre` on the `files` table. All the data in the column will be lost.
  - Made the column `title` on table `comments` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "blog_tags" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "channel_members" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "channels" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "comments" ALTER COLUMN "order" SET DEFAULT 1000,
ALTER COLUMN "title" SET NOT NULL;

-- AlterTable
ALTER TABLE "epics" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "feature_dependencies" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "features" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "files" DROP COLUMN "ordre",
ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "initiatives" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "messages" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "project_members" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "sprints" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "task_dependencies" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "tasks" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "teams" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "templates" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "user_stories" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;

-- AlterTable
ALTER TABLE "user_story_dependencies" ADD COLUMN     "order" INTEGER NOT NULL DEFAULT 1000;
