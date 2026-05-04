"use server";

import { redirect } from "next/navigation";

import { AnimalStatus, ShelterStatus, Species, UserRole } from "@/generated/prisma/enums";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type EnquiryResult = {
  ok: boolean;
  message: string;
};

function getRequiredValue(formData: FormData, key: string) {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function nullableUrl(value: string) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? value : null;
  } catch {
    return null;
  }
}

async function uniqueShelterSlug(name: string) {
  const baseSlug = slugify(name) || "shelter";
  const existing = await prisma.shelter.findMany({
    where: {
      slug: {
        startsWith: baseSlug,
      },
    },
    select: {
      slug: true,
    },
  });
  const existingSlugs = new Set(existing.map((shelter) => shelter.slug));

  if (!existingSlugs.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existingSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }

  return `${baseSlug}-${suffix}`;
}

export async function createAdoptionEnquiry(_: EnquiryResult, formData: FormData): Promise<EnquiryResult> {
  const animalId = getRequiredValue(formData, "animalId");
  const name = getRequiredValue(formData, "name");
  const email = getRequiredValue(formData, "email");
  const phone = getRequiredValue(formData, "phone");
  const message = getRequiredValue(formData, "message");

  if (!animalId || !name || !email) {
    return {
      ok: false,
      message: "Name and email are required.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      ok: false,
      message: "Enter a valid email address.",
    };
  }

  const animal = await prisma.animal.findFirst({
    where: {
      id: animalId,
      status: AnimalStatus.AVAILABLE,
    },
    select: {
      id: true,
      shelterId: true,
      name: true,
    },
  });

  if (!animal) {
    return {
      ok: false,
      message: "This animal is no longer available for enquiries.",
    };
  }

  await prisma.adoptionEnquiry.create({
    data: {
      animalId: animal.id,
      shelterId: animal.shelterId,
      name,
      email,
      phone: phone || null,
      message: message || null,
    },
  });

  return {
    ok: true,
    message: `Your enquiry about ${animal.name} has been sent.`,
  };
}

function parseSpecies(value: string) {
  const normalised = value.trim().toUpperCase().replace(/\s+/g, "_");
  return Object.values(Species).includes(normalised as Species) ? (normalised as Species) : null;
}

export async function createSavedSearchAlert(_: EnquiryResult, formData: FormData): Promise<EnquiryResult> {
  const email = getRequiredValue(formData, "email");
  const query = getRequiredValue(formData, "query");
  const species = parseSpecies(getRequiredValue(formData, "species"));
  const suburb = getRequiredValue(formData, "suburb");

  if (!email) {
    return {
      ok: false,
      message: "Email is required.",
    };
  }

  if (!isValidEmail(email)) {
    return {
      ok: false,
      message: "Enter a valid email address.",
    };
  }

  await prisma.savedSearchAlert.create({
    data: {
      email,
      query: query || null,
      species,
      suburb: suburb && suburb !== "All" ? suburb : null,
    },
  });

  return {
    ok: true,
    message: "Alert saved. New matching listings will be tracked for this search.",
  };
}

export async function registerShelter(_: EnquiryResult, formData: FormData): Promise<EnquiryResult> {
  const shelterName = getRequiredValue(formData, "shelterName");
  const shelterEmail = getRequiredValue(formData, "shelterEmail").toLowerCase();
  const primaryName = getRequiredValue(formData, "primaryName");
  const primaryEmail = getRequiredValue(formData, "primaryEmail").toLowerCase();
  const password = getRequiredValue(formData, "password");
  const suburb = getRequiredValue(formData, "suburb");
  const city = getRequiredValue(formData, "city") || "Cape Town";

  if (!shelterName || !shelterEmail || !primaryName || !primaryEmail || !password) {
    return {
      ok: false,
      message: "Shelter name, emails, primary contact, and password are required.",
    };
  }

  if (!isValidEmail(shelterEmail) || !isValidEmail(primaryEmail)) {
    return {
      ok: false,
      message: "Enter valid email addresses.",
    };
  }

  if (password.length < 8) {
    return {
      ok: false,
      message: "Password must be at least 8 characters.",
    };
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      email: primaryEmail,
    },
    select: {
      id: true,
    },
  });

  if (existingUser) {
    return {
      ok: false,
      message: "An account already exists for that primary contact email.",
    };
  }

  const shelter = await prisma.shelter.create({
    data: {
      name: shelterName,
      slug: await uniqueShelterSlug(shelterName),
      email: shelterEmail,
      status: ShelterStatus.PENDING,
      phone: getRequiredValue(formData, "phone") || null,
      websiteUrl: nullableUrl(getRequiredValue(formData, "websiteUrl")),
      facebookUrl: nullableUrl(getRequiredValue(formData, "facebookUrl")),
      instagramUrl: nullableUrl(getRequiredValue(formData, "instagramUrl")),
      suburb: suburb || null,
      city,
      bio: getRequiredValue(formData, "bio") || null,
    },
    select: {
      id: true,
    },
  });

  try {
    const signup = await auth.api.signUpEmail({
      body: {
        email: primaryEmail,
        password,
        name: primaryName,
      },
    });

    await prisma.user.update({
      where: {
        id: signup.user.id,
      },
      data: {
        role: UserRole.SHELTER_ADMIN,
        shelterId: shelter.id,
      },
    });
  } catch (error) {
    await prisma.shelter.delete({
      where: {
        id: shelter.id,
      },
    });

    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not create the shelter account.",
    };
  }

  redirect("/shelter");
}
