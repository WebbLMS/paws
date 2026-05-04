-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('PLATFORM_ADMIN', 'SHELTER_ADMIN', 'SHELTER_STAFF');

-- CreateEnum
CREATE TYPE "AnimalStatus" AS ENUM ('DRAFT', 'AVAILABLE', 'RESERVED', 'ADOPTED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "Species" AS ENUM ('DOG', 'CAT', 'RABBIT', 'BIRD', 'OTHER');

-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('MALE', 'FEMALE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "AnimalSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "EnquiryStatus" AS ENUM ('NEW', 'CONTACTED', 'APPROVED', 'DECLINED', 'CLOSED');

-- CreateTable
CREATE TABLE "Shelter" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "websiteUrl" TEXT,
    "facebookUrl" TEXT,
    "instagramUrl" TEXT,
    "suburb" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Cape Town',
    "province" TEXT NOT NULL DEFAULT 'Western Cape',
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shelter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'SHELTER_STAFF',
    "shelterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Animal" (
    "id" TEXT NOT NULL,
    "shelterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "species" "Species" NOT NULL,
    "breed" TEXT,
    "ageMonths" INTEGER,
    "sex" "Sex" NOT NULL DEFAULT 'UNKNOWN',
    "size" "AnimalSize" NOT NULL DEFAULT 'UNKNOWN',
    "status" "AnimalStatus" NOT NULL DEFAULT 'DRAFT',
    "summary" TEXT,
    "description" TEXT,
    "suburb" TEXT,
    "city" TEXT NOT NULL DEFAULT 'Cape Town',
    "profileImageUrl" TEXT,
    "imageUrls" TEXT[],
    "socialCaption" TEXT,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Animal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdoptionEnquiry" (
    "id" TEXT NOT NULL,
    "animalId" TEXT NOT NULL,
    "shelterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "message" TEXT,
    "status" "EnquiryStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdoptionEnquiry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedSearchAlert" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "query" TEXT,
    "species" "Species",
    "suburb" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedSearchAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Shelter_slug_key" ON "Shelter"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_shelterId_idx" ON "User"("shelterId");

-- CreateIndex
CREATE INDEX "Animal_species_status_idx" ON "Animal"("species", "status");

-- CreateIndex
CREATE INDEX "Animal_status_publishedAt_idx" ON "Animal"("status", "publishedAt");

-- CreateIndex
CREATE INDEX "Animal_shelterId_idx" ON "Animal"("shelterId");

-- CreateIndex
CREATE UNIQUE INDEX "Animal_shelterId_slug_key" ON "Animal"("shelterId", "slug");

-- CreateIndex
CREATE INDEX "AdoptionEnquiry_animalId_idx" ON "AdoptionEnquiry"("animalId");

-- CreateIndex
CREATE INDEX "AdoptionEnquiry_shelterId_status_idx" ON "AdoptionEnquiry"("shelterId", "status");

-- CreateIndex
CREATE INDEX "SavedSearchAlert_email_idx" ON "SavedSearchAlert"("email");

-- CreateIndex
CREATE INDEX "SavedSearchAlert_species_suburb_idx" ON "SavedSearchAlert"("species", "suburb");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "Shelter"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Animal" ADD CONSTRAINT "Animal_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "Shelter"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionEnquiry" ADD CONSTRAINT "AdoptionEnquiry_animalId_fkey" FOREIGN KEY ("animalId") REFERENCES "Animal"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdoptionEnquiry" ADD CONSTRAINT "AdoptionEnquiry_shelterId_fkey" FOREIGN KEY ("shelterId") REFERENCES "Shelter"("id") ON DELETE CASCADE ON UPDATE CASCADE;
