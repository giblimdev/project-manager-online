-- CreateTable
CREATE TABLE "helpDev" (
    "id" UUID NOT NULL,
    "titre" TEXT NOT NULL,
    "presentationProjet" TEXT,
    "section" JSONB[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpDev_pkey" PRIMARY KEY ("id")
);
