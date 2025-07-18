-- CreateTable
CREATE TABLE "glossary" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ordrer" INTEGER NOT NULL DEFAULT 1000,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TERM',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "glossary_pkey" PRIMARY KEY ("id")
);
