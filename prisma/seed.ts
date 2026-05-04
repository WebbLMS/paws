import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { AnimalSize, AnimalStatus, PrismaClient, Sex, ShelterStatus, Species } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const shelters = [
  { name: "Fallen Angels", slug: "fallen-angels", email: "hello@fallenangels.org.za", suburb: "Muizenberg" },
  { name: "Cape of Good Hope SPCA", slug: "cape-of-good-hope-spca", email: "adoptions@spca-ct.co.za", suburb: "Grassy Park" },
  { name: "Dogtown SA", slug: "dogtown-sa", email: "adoptions@dogtownsa.org", suburb: "Epping" },
  { name: "Animal Welfare Stellenbosch", slug: "animal-welfare-stellenbosch", email: "hello@aws.org.za", suburb: "Stellenbosch" },
  { name: "Tears Animal Rescue", slug: "tears-animal-rescue", email: "adoptions@tears.org.za", suburb: "Sunnydale" },
  { name: "Bunny Rescue SA", slug: "bunny-rescue-sa", email: "hello@bunnyrescue.co.za", suburb: "Tokai" },
  { name: "Woodstock Animal Rescue", slug: "woodstock-animal-rescue", email: "hello@woodstockrescue.org.za", suburb: "Woodstock" },
];

const animals = [
  {
    shelterSlug: "fallen-angels",
    name: "Biscuit",
    slug: "biscuit",
    species: Species.DOG,
    breed: "Jack Russell Mix",
    ageMonths: 24,
    sex: Sex.MALE,
    size: AnimalSize.SMALL,
    suburb: "Muizenberg",
    profileImageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=900&h=900&fit=crop",
    traits: ["Energetic", "Loyal"],
    summary: "A spirited little guy who loves beach runs and belly rubs.",
    isUrgent: false,
    daysAgo: 3,
  },
  {
    shelterSlug: "cape-of-good-hope-spca",
    name: "Nala",
    slug: "nala",
    species: Species.CAT,
    breed: "Domestic Shorthair",
    ageMonths: 12,
    sex: Sex.FEMALE,
    size: AnimalSize.SMALL,
    suburb: "Grassy Park",
    profileImageUrl: "https://images.unsplash.com/photo-1574158622682-e40e69881006?w=900&h=900&fit=crop",
    traits: ["Gentle", "Curious"],
    summary: "Sweet tortoiseshell queen looking for a calm indoor home.",
    isUrgent: false,
    daysAgo: 18,
  },
  {
    shelterSlug: "dogtown-sa",
    name: "Thunder",
    slug: "thunder",
    species: Species.DOG,
    breed: "Boerboel Cross",
    ageMonths: 48,
    sex: Sex.MALE,
    size: AnimalSize.LARGE,
    suburb: "Epping",
    profileImageUrl: "https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=900&h=900&fit=crop",
    traits: ["Protective", "Gentle Giant"],
    summary: "Big softie who needs a home with a garden. Great with kids.",
    isUrgent: true,
    daysAgo: 24,
  },
  {
    shelterSlug: "animal-welfare-stellenbosch",
    name: "Pixie",
    slug: "pixie",
    species: Species.CAT,
    breed: "Siamese Mix",
    ageMonths: 36,
    sex: Sex.FEMALE,
    size: AnimalSize.SMALL,
    suburb: "Stellenbosch",
    profileImageUrl: "https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?w=900&h=900&fit=crop",
    traits: ["Vocal", "Affectionate"],
    summary: "Chatty girl who will greet you at the door every day.",
    isUrgent: false,
    daysAgo: 6,
  },
  {
    shelterSlug: "tears-animal-rescue",
    name: "Rex",
    slug: "rex",
    species: Species.DOG,
    breed: "German Shepherd",
    ageMonths: 60,
    sex: Sex.MALE,
    size: AnimalSize.LARGE,
    suburb: "Sunnydale",
    profileImageUrl: "https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=900&h=900&fit=crop",
    traits: ["Intelligent", "Loyal"],
    summary: "Trained and obedient. Lost his home when his owner emigrated.",
    isUrgent: true,
    daysAgo: 30,
  },
  {
    shelterSlug: "bunny-rescue-sa",
    name: "Mochi",
    slug: "mochi",
    species: Species.RABBIT,
    breed: "Holland Lop",
    ageMonths: 6,
    sex: Sex.FEMALE,
    size: AnimalSize.SMALL,
    suburb: "Tokai",
    profileImageUrl: "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=900&h=900&fit=crop",
    traits: ["Playful", "Gentle"],
    summary: "Adorable lop-eared bunny perfect for a calm household.",
    isUrgent: false,
    daysAgo: 2,
  },
  {
    shelterSlug: "woodstock-animal-rescue",
    name: "Koda",
    slug: "koda",
    species: Species.DOG,
    breed: "Husky Mix",
    ageMonths: 36,
    sex: Sex.MALE,
    size: AnimalSize.LARGE,
    suburb: "Woodstock",
    profileImageUrl: "https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=900&h=900&fit=crop",
    traits: ["Adventurous", "Friendly"],
    summary: "Energetic boy who needs an active family and a secure yard.",
    isUrgent: false,
    daysAgo: 16,
  },
  {
    shelterSlug: "cape-of-good-hope-spca",
    name: "Luna",
    slug: "luna",
    species: Species.CAT,
    breed: "Black Domestic",
    ageMonths: 24,
    sex: Sex.FEMALE,
    size: AnimalSize.MEDIUM,
    suburb: "Grassy Park",
    profileImageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=900&h=900&fit=crop",
    traits: ["Independent", "Calm"],
    summary: "Gorgeous black cat with a quiet, affectionate nature.",
    isUrgent: true,
    daysAgo: 21,
  },
];

function publishedAt(daysAgo: number) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date;
}

async function main() {
  const shelterRecords = new Map<string, string>();

  for (const shelter of shelters) {
    const record = await prisma.shelter.upsert({
      where: { slug: shelter.slug },
      update: {
        ...shelter,
        status: ShelterStatus.APPROVED,
      },
      create: {
        ...shelter,
        status: ShelterStatus.APPROVED,
      },
    });

    shelterRecords.set(shelter.slug, record.id);
  }

  for (const animal of animals) {
    const { daysAgo, shelterSlug, ...animalData } = animal;
    const shelterId = shelterRecords.get(shelterSlug);

    if (!shelterId) {
      throw new Error(`Missing shelter for ${animal.name}`);
    }

    await prisma.animal.upsert({
      where: {
        shelterId_slug: {
          shelterId,
          slug: animal.slug,
        },
      },
      update: {
        ...animalData,
        status: AnimalStatus.AVAILABLE,
        shelterId,
        publishedAt: publishedAt(daysAgo),
      },
      create: {
        ...animalData,
        status: AnimalStatus.AVAILABLE,
        shelterId,
        publishedAt: publishedAt(daysAgo),
      },
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
