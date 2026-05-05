-- CreateEnum
CREATE TYPE "ProfileViewType" AS ENUM ('ANIMAL', 'SHELTER');

-- CreateTable
CREATE TABLE "ProfileView" (
    "id" TEXT NOT NULL,
    "shelterId" TEXT NOT NULL,
    "animalId" TEXT,
    "type" "ProfileViewType" NOT NULL,
    "path" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfileView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProfileView_shelterId_type_createdAt_idx" ON "ProfileView"("shelterId", "type", "createdAt");

-- CreateIndex
CREATE INDEX "ProfileView_animalId_createdAt_idx" ON "ProfileView"("animalId", "createdAt");

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "Shelter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileView" ADD CONSTRAINT "ProfileView_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;
