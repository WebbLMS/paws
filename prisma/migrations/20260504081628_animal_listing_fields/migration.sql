-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "isUrgent" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "traits" TEXT[];
