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

  return animals.map((animal) => {
    const species = displayEnum(animal.species);
    const sex = displayEnum(animal.sex);
    const size = displayEnum(animal.size);
    const breed = animal.breed ?? "Mixed breed";
    const age = formatAge(animal.ageMonths);
    const area = animal.suburb ?? animal.shelter.suburb ?? animal.city;
    const description = animal.summary ?? animal.description ?? "Contact the shelter to learn more about this animal.";
    const healthText = [
      animal.vaccinationsUpToDate ? "vaccinated vaccinations up to date" : "",
      animal.neutered ? "neutered sterilised spayed" : "",
      animal.microchipped ? "microchipped" : "",
      animal.tickFleaPreventionActive ? "tick flea prevention protected" : "",
    ].join(" ");

    return {
      id: animal.id,
      slug: animal.slug,
      name: animal.name,
      species,
      breed,
      age,
      sex,
      size,
      shelter: animal.shelter.name,
      shelterSlug: animal.shelter.slug,
      area,
      photo: animal.profileImageUrl ?? "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&h=900&fit=crop",
      traits: animal.traits,
      health: {
        vaccinationsUpToDate: animal.vaccinationsUpToDate,
        neutered: animal.neutered,
        microchipped: animal.microchipped,
        tickFleaPreventionActive: animal.tickFleaPreventionActive,
      },
      description,
      searchText: [
        animal.name,
        species,
        breed,
        age,
        sex,
        size,
        area,
        animal.shelter.name,
        animal.shelter.suburb,
        animal.shelter.city,
        animal.summary,
        animal.description,
        animal.traits.join(" "),
        healthText,
        animal.isUrgent ? "urgent needs home priority" : "",
      ]
        .filter(Boolean)
        .join(" "),
      urgent: animal.isUrgent,
      recent: animal.publishedAt ? animal.publishedAt >= recentCutoff : false,
    };
  });
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
