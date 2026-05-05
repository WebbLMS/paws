-- AlterTable
ALTER TABLE "Animal" ADD COLUMN     "microchipped" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "neutered" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tickFleaPreventionActive" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "vaccinationsUpToDate" BOOLEAN NOT NULL DEFAULT false;
