import { AnimalStatus, ShelterStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { getPublicBranding } from "@/lib/platform-settings";

import { AnimalSearch, type PublicAnimal, type PublicShelter } from "./animal-search";

export const dynamic = "force-dynamic";

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAge(ageMonths: number | null) {
  if (!ageMonths) return "Age unknown";
  if (ageMonths < 12) return `${ageMonths} mo`;

  const years = Math.floor(ageMonths / 12);
  return `${years} yr${years === 1 ? "" : "s"}`;
}

async function getAnimals(): Promise<PublicAnimal[]> {
  const recentCutoff = new Date();
  recentCutoff.setDate(recentCutoff.getDate() - 14);

  const animals = await prisma.animal.findMany({
    where: {
      status: AnimalStatus.AVAILABLE,
      shelter: {
        status: ShelterStatus.APPROVED,
      },
    },
    include: {
      shelter: true,
    },
    orderBy: [
      {
        isUrgent: "desc",
      },
      {
        publishedAt: "desc",
      },
    ],
  });

  return animals.map((animal) => ({
    id: animal.id,
    slug: animal.slug,
    name: animal.name,
    species: displayEnum(animal.species),
    breed: animal.breed ?? "Mixed breed",
    age: formatAge(animal.ageMonths),
    sex: displayEnum(animal.sex),
    size: displayEnum(animal.size),
    shelter: animal.shelter.name,
    shelterSlug: animal.shelter.slug,
    area: animal.suburb ?? animal.shelter.suburb ?? animal.city,
    photo: animal.profileImageUrl ?? "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&h=900&fit=crop",
    traits: animal.traits,
    health: {
      vaccinationsUpToDate: animal.vaccinationsUpToDate,
      neutered: animal.neutered,
      microchipped: animal.microchipped,
      tickFleaPreventionActive: animal.tickFleaPreventionActive,
    },
    description: animal.summary ?? animal.description ?? "Contact the shelter to learn more about this animal.",
    urgent: animal.isUrgent,
    recent: animal.publishedAt ? animal.publishedAt >= recentCutoff : false,
  }));
}

async function getShelters(): Promise<PublicShelter[]> {
  const shelters = await prisma.shelter.findMany({
    where: {
      status: ShelterStatus.APPROVED,
    },
    include: {
      _count: {
        select: {
          animals: {
            where: {
              status: AnimalStatus.AVAILABLE,
            },
          },
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return shelters.map((shelter) => ({
    id: shelter.id,
    slug: shelter.slug,
    name: shelter.name,
    location: shelter.suburb ?? shelter.city,
    logoUrl: shelter.logoImageUrl,
    animalCount: shelter._count.animals,
  }));
}

export default async function Home() {
  const [animals, shelters, branding] = await Promise.all([getAnimals(), getShelters(), getPublicBranding()]);

  return <AnimalSearch animals={animals} shelters={shelters} branding={branding} />;
}
