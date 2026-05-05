"use server";

import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

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

function parseTraits(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("traits")
        .flatMap((value) => (typeof value === "string" ? value.split(",") : []))
        .map((trait) => trait.trim())
        .filter(Boolean),
    ),
  ).slice(0, 12);
}

function parseOptionalUrl(value: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function parseStoredPhotoUrl(value: string) {
  if (!value) return null;
  if (value.startsWith("/uploads/animals/")) return value;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function parseStoredShelterImageUrl(value: string) {
  if (!value) return null;
  if (value.startsWith("/uploads/shelters/")) return value;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

function getExistingPhotoUrls(formData: FormData) {
  return Array.from(
    new Set(
      formData
        .getAll("existingPhotoUrls")
        .map((value) => (typeof value === "string" ? parseStoredPhotoUrl(value.trim()) : null))
        .filter((url): url is string => Boolean(url)),
    ),
  ).slice(0, 24);
}

async function saveUploadedShelterImage(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;

  const allowedTypes = new Map([
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
  ]);

  const extension = allowedTypes.get(file.type);
  if (!extension || file.size > 5 * 1024 * 1024) {
    return null;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "shelters");
  await mkdir(uploadDir, { recursive: true });

  const filename = `shelter-${key}-${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return `/uploads/shelters/${filename}`;
}

async function saveUploadedAnimalPhotos(formData: FormData) {
  const files = formData.getAll("animalPhotos").filter((file): file is File => file instanceof File && file.size > 0);
  if (!files.length) return [];

  const allowedTypes = new Map([
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
  ]);

  const uploadDir = path.join(process.cwd(), "public", "uploads", "animals");
  await mkdir(uploadDir, { recursive: true });

  const uploaded: string[] = [];
  for (const file of files.slice(0, 12)) {
    const extension = allowedTypes.get(file.type);
    if (!extension || file.size > 5 * 1024 * 1024) {
      continue;
    }

    const filename = `animal-${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
    const bytes = Buffer.from(await file.arrayBuffer());
    await writeFile(path.join(uploadDir, filename), bytes);
    uploaded.push(`/uploads/animals/${filename}`);
  }

  return uploaded;
}

function resolvePhotoSet(existingUrls: string[], uploadedUrls: string[], primaryPhotoKey: string) {
  const allUrls = Array.from(new Set([...existingUrls, ...uploadedUrls])).slice(0, 24);
  let profileImageUrl: string | null = null;

  if (primaryPhotoKey.startsWith("existing:")) {
    const existingUrl = primaryPhotoKey.slice("existing:".length);
    profileImageUrl = existingUrls.includes(existingUrl) ? existingUrl : null;
  }

  if (primaryPhotoKey.startsWith("new:")) {
    const index = Number.parseInt(primaryPhotoKey.slice("new:".length), 10);
    profileImageUrl = Number.isInteger(index) ? uploadedUrls[index] ?? null : null;
  }

  profileImageUrl ??= allUrls[0] ?? null;

  return {
    profileImageUrl,
    imageUrls: allUrls.filter((url) => url !== profileImageUrl).slice(0, 12),
  };
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

export async function updateShelterProfile(formData: FormData) {
  const shelter = await getActiveShelter();

  if (!shelter) {
    throw new Error("No shelter found.");
  }

  const name = getValue(formData, "name");
  const email = getValue(formData, "email").toLowerCase();
  const city = getValue(formData, "city") || "Cape Town";

  if (!name || !email) {
    throw new Error("Shelter name and email are required.");
  }

  const coverImageUrl =
    (await saveUploadedShelterImage(formData, "coverImage")) ?? parseStoredShelterImageUrl(getValue(formData, "existingCoverImageUrl"));
  const logoImageUrl =
    (await saveUploadedShelterImage(formData, "logoImage")) ?? parseStoredShelterImageUrl(getValue(formData, "existingLogoImageUrl"));

  await prisma.shelter.update({
    where: {
      id: shelter.id,
    },
    data: {
      name,
      email,
      phone: getValue(formData, "phone") || null,
      websiteUrl: parseOptionalUrl(getValue(formData, "websiteUrl")),
      facebookUrl: parseOptionalUrl(getValue(formData, "facebookUrl")),
      instagramUrl: parseOptionalUrl(getValue(formData, "instagramUrl")),
      coverImageUrl,
      logoImageUrl,
      registrationNumber: getValue(formData, "registrationNumber") || null,
      suburb: getValue(formData, "suburb") || null,
      city,
      province: getValue(formData, "province") || "Western Cape",
      bio: getValue(formData, "bio") || null,
    },
  });

  redirect("/shelter/profile?saved=1");
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

  const uploadedPhotoUrls = await saveUploadedAnimalPhotos(formData);
  const photoSet = resolvePhotoSet([], uploadedPhotoUrls, getValue(formData, "primaryPhotoKey"));

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
      traits: parseTraits(formData),
      vaccinationsUpToDate: formData.get("vaccinationsUpToDate") === "on",
      neutered: formData.get("neutered") === "on",
      microchipped: formData.get("microchipped") === "on",
      tickFleaPreventionActive: formData.get("tickFleaPreventionActive") === "on",
      isUrgent: formData.get("isUrgent") === "on",
      suburb: getValue(formData, "suburb") || shelter.suburb,
      city: shelter.city,
      profileImageUrl: photoSet.profileImageUrl,
      imageUrls: photoSet.imageUrls,
      publishedAt: new Date(),
    },
  });

  redirect("/shelter/animals");
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

  const existingPhotoUrls = getExistingPhotoUrls(formData);
  const uploadedPhotoUrls = await saveUploadedAnimalPhotos(formData);
  const photoSet = resolvePhotoSet(existingPhotoUrls, uploadedPhotoUrls, getValue(formData, "primaryPhotoKey"));

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
      traits: parseTraits(formData),
      vaccinationsUpToDate: formData.get("vaccinationsUpToDate") === "on",
      neutered: formData.get("neutered") === "on",
      microchipped: formData.get("microchipped") === "on",
      tickFleaPreventionActive: formData.get("tickFleaPreventionActive") === "on",
      isUrgent: formData.get("isUrgent") === "on",
      suburb: getValue(formData, "suburb") || shelter.suburb,
      city: shelter.city,
      profileImageUrl: photoSet.profileImageUrl,
      imageUrls: photoSet.imageUrls,
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
