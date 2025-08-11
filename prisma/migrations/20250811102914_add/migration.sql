-- CreateTable
CREATE TABLE "_EpicToUserStory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EpicToUserStory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_EpicToUserStory_B_index" ON "_EpicToUserStory"("B");

-- AddForeignKey
ALTER TABLE "_EpicToUserStory" ADD CONSTRAINT "_EpicToUserStory_A_fkey" FOREIGN KEY ("A") REFERENCES "epics"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EpicToUserStory" ADD CONSTRAINT "_EpicToUserStory_B_fkey" FOREIGN KEY ("B") REFERENCES "user_stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
