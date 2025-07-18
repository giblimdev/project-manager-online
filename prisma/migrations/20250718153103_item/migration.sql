/*
  Warnings:

  - You are about to drop the column `teamId` on the `items` table. All the data in the column will be lost.
  - Added the required column `userId` to the `items` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "items" DROP CONSTRAINT "items_teamId_fkey";

-- DropIndex
DROP INDEX "items_teamId_key_key";

-- DropIndex
DROP INDEX "items_teamId_slug_key";

-- AlterTable
ALTER TABLE "items" DROP COLUMN "teamId",
ADD COLUMN     "userId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "items" ADD CONSTRAINT "items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
