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
    imageUrls: [
      "https://images.unsplash.com/photo-1552053831-71594a27632d?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=1200&h=900&fit=crop",
    ],
    traits: ["Energetic", "Loyal"],
    summary: "A spirited little guy who loves beach runs and belly rubs.",
    vaccinationsUpToDate: true,
    neutered: true,
    microchipped: true,
    tickFleaPreventionActive: true,
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
    imageUrls: [
      "https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=1200&h=900&fit=crop",
    ],
    traits: ["Gentle", "Curious"],
    summary: "Sweet tortoiseshell queen looking for a calm indoor home.",
    vaccinationsUpToDate: true,
    neutered: true,
    microchipped: false,
    tickFleaPreventionActive: true,
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
    imageUrls: [
      "https://images.unsplash.com/photo-1530281700549-e82e7bf110d6?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1558788353-f76d92427f16?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1518717758536-85ae29035b6d?w=1200&h=900&fit=crop",
    ],
    traits: ["Protective", "Gentle Giant"],
    summary: "Big softie who needs a home with a garden. Great with kids.",
    vaccinationsUpToDate: true,
    neutered: true,
    microchipped: true,
    tickFleaPreventionActive: true,
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
    imageUrls: [
      "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1519052537078-e6302a4968d4?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=1200&h=900&fit=crop",
    ],
    traits: ["Vocal", "Affectionate"],
    summary: "Chatty girl who will greet you at the door every day.",
    vaccinationsUpToDate: true,
    neutered: true,
    microchipped: true,
    tickFleaPreventionActive: false,
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
    imageUrls: [
      "https://images.unsplash.com/photo-1568572933382-74d440642117?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=1200&h=900&fit=crop",
    ],
    traits: ["Intelligent", "Loyal"],
    summary: "Trained and obedient. Lost his home when his owner emigrated.",
    vaccinationsUpToDate: true,
    neutered: true,
    microchipped: true,
    tickFleaPreventionActive: true,
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
    imageUrls: [
      "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1583301286816-f4f05e1e8b25?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1200&h=900&fit=crop",
    ],
    traits: ["Playful", "Gentle"],
    summary: "Adorable lop-eared bunny perfect for a calm household.",
    vaccinationsUpToDate: true,
    neutered: false,
    microchipped: false,
    tickFleaPreventionActive: true,
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
    imageUrls: [
      "https://images.unsplash.com/photo-1601758124510-52d02ddb7cbd?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1503256207526-0d5d80fa2f47?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1504595403659-9088ce801e29?w=1200&h=900&fit=crop",
    ],
    traits: ["Adventurous", "Friendly"],
    summary: "Energetic boy who needs an active family and a secure yard.",
    vaccinationsUpToDate: true,
    neutered: true,
    microchipped: true,
    tickFleaPreventionActive: true,
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
    imageUrls: [
      "https://images.unsplash.com/photo-1494256997604-768d1f608cac?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=1200&h=900&fit=crop",
      "https://images.unsplash.com/photo-1513245543132-31f507417b26?w=1200&h=900&fit=crop",
    ],
    traits: ["Independent", "Calm"],
    summary: "Gorgeous black cat with a quiet, affectionate nature.",
    vaccinationsUpToDate: true,
    neutered: true,
    microchipped: true,
    tickFleaPreventionActive: true,
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
