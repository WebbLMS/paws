"use server";

import { redirect } from "next/navigation";

import { AnimalSize, AnimalStatus, EnquiryStatus, Sex, Species } from "@/generated/prisma/enums";
import { getActiveShelter, getShelterContext } from "@/lib/active-shelter";
import { prisma } from "@/lib/prisma";

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseNumber(value: string) {
  if (!value) return null;

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function parseTraits(value: string) {
  return value
    .split(",")
    .map((trait) => trait.trim())
    .filter(Boolean)
    .slice(0, 8);
}

function parseUnsplashUrl(value: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function parsePhotoUrls(value: string, primaryUrl: string | null) {
  const urls = value
    .split(/\r?\n|,/)
    .map((url) => parseUnsplashUrl(url.trim()))
    .filter((url): url is string => Boolean(url));

  return Array.from(new Set(urls)).filter((url) => url !== primaryUrl).slice(0, 12);
}

async function uniqueAnimalSlug(shelterId: string, name: string) {
  const baseSlug = slugify(name) || "animal";
  const existing = await prisma.animal.findMany({
    where: {
      shelterId,
      slug: {
        startsWith: baseSlug,
      },
    },
    select: {
      slug: true,
    },
  });
  const existingSlugs = new Set(existing.map((animal) => animal.slug));

  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export async function createAnimalListing(formData: FormData) {
  const shelter = await getActiveShelter();

  if (!shelter) {
    throw new Error("No shelter found. Seed the local database first.");
  }

  const name = getValue(formData, "name");
  const species = getValue(formData, "species") as Species;
  const sex = getValue(formData, "sex") as Sex;
  const size = getValue(formData, "size") as AnimalSize;

  if (!name || !species || !sex || !size) {
    throw new Error("Name, species, sex, and size are required.");
  }

  const profileImageUrl = parseUnsplashUrl(getValue(formData, "profileImageUrl"));

  await prisma.animal.create({
    data: {
      shelterId: shelter.id,
      name,
      slug: await uniqueAnimalSlug(shelter.id, name),
      species,
      breed: getValue(formData, "breed") || null,
      ageMonths: parseNumber(getValue(formData, "ageMonths")),
      sex,
      size,
      status: AnimalStatus.AVAILABLE,
      summary: getValue(formData, "summary") || null,
      description: getValue(formData, "description") || null,
      traits: parseTraits(getValue(formData, "traits")),
      isUrgent: formData.get("isUrgent") === "on",
      suburb: getValue(formData, "suburb") || shelter.suburb,
      city: shelter.city,
      profileImageUrl,
      imageUrls: parsePhotoUrls(getValue(formData, "imageUrls"), profileImageUrl),
      publishedAt: new Date(),
    },
  });

  redirect("/shelter");
}

export async function updateAnimalListing(formData: FormData) {
  const shelter = await getActiveShelter();

  if (!shelter) {
    throw new Error("No shelter found. Seed the local database first.");
  }

  const animalId = getValue(formData, "animalId");
  const name = getValue(formData, "name");
  const species = getValue(formData, "species") as Species;
  const sex = getValue(formData, "sex") as Sex;
  const size = getValue(formData, "size") as AnimalSize;
  const status = getValue(formData, "status") as AnimalStatus;

  if (
    !animalId ||
    !name ||
    !Object.values(Species).includes(species) ||
    !Object.values(Sex).includes(sex) ||
    !Object.values(AnimalSize).includes(size) ||
    !Object.values(AnimalStatus).includes(status)
  ) {
    throw new Error("Invalid animal listing update.");
  }

  const existing = await prisma.animal.findFirst({
    where: {
      id: animalId,
      shelterId: shelter.id,
    },
    select: {
      id: true,
      publishedAt: true,
    },
  });

  if (!existing) {
    throw new Error("Animal listing not found.");
  }

  const profileImageUrl = parseUnsplashUrl(getValue(formData, "profileImageUrl"));

  await prisma.animal.update({
    where: {
      id: existing.id,
    },
    data: {
      name,
      species,
      breed: getValue(formData, "breed") || null,
      ageMonths: parseNumber(getValue(formData, "ageMonths")),
      sex,
      size,
      status,
      summary: getValue(formData, "summary") || null,
      description: getValue(formData, "description") || null,
      traits: parseTraits(getValue(formData, "traits")),
      isUrgent: formData.get("isUrgent") === "on",
      suburb: getValue(formData, "suburb") || shelter.suburb,
      city: shelter.city,
      profileImageUrl,
      imageUrls: parsePhotoUrls(getValue(formData, "imageUrls"), profileImageUrl),
      publishedAt: status === AnimalStatus.AVAILABLE ? existing.publishedAt ?? new Date() : existing.publishedAt,
    },
  });

  redirect(`/shelter/animals/${existing.id}/edit`);
}

export async function updateEnquiryStatus(formData: FormData) {
  const context = await getShelterContext();

  if (!context) {
    throw new Error("No shelter found. Seed the local database first.");
  }

  const { shelter, user } = context;
  const enquiryId = getValue(formData, "enquiryId");
  const status = getValue(formData, "status") as EnquiryStatus;
  const currentFilter = getValue(formData, "currentFilter");

  if (!enquiryId || !status || !Object.values(EnquiryStatus).includes(status)) {
    throw new Error("Invalid enquiry status update.");
  }

  const existing = await prisma.adoptionEnquiry.findFirst({
    where: {
      id: enquiryId,
      shelterId: shelter.id,
    },
    select: {
      status: true,
    },
  });

  if (!existing) {
    throw new Error("Enquiry not found.");
  }

  if (existing.status !== status) {
    await prisma.$transaction([
      prisma.adoptionEnquiry.update({
        where: {
          id: enquiryId,
          shelterId: shelter.id,
        },
        data: {
          status,
        },
      }),
      prisma.enquiryStatusEvent.create({
        data: {
          enquiryId,
          fromStatus: existing.status,
          toStatus: status,
          actor: user.name || user.email,
        },
      }),
    ]);
  }

  redirect(currentFilter ? `/shelter/enquiries?status=${currentFilter}` : "/shelter/enquiries");
}

export async function addEnquiryNote(formData: FormData) {
  const context = await getShelterContext();

  if (!context) {
    throw new Error("No shelter found. Seed the local database first.");
  }

  const { shelter, user } = context;
  const enquiryId = getValue(formData, "enquiryId");
  const body = getValue(formData, "body");
  const currentFilter = getValue(formData, "currentFilter");

  if (!enquiryId || !body) {
    throw new Error("A note cannot be empty.");
  }

  const enquiry = await prisma.adoptionEnquiry.findFirst({
    where: {
      id: enquiryId,
      shelterId: shelter.id,
    },
    select: {
      id: true,
    },
  });

  if (!enquiry) {
    throw new Error("Enquiry not found.");
  }

  await prisma.enquiryNote.create({
    data: {
      enquiryId: enquiry.id,
      body,
      author: user.name || user.email,
    },
  });

  redirect(currentFilter ? `/shelter/enquiries?status=${currentFilter}` : "/shelter/enquiries");
}
