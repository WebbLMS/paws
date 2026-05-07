"use server";

import { redirect } from "next/navigation";

import { AnimalStatus, ShelterStatus, Species, UserRole } from "@/generated/prisma/enums";
import { currentAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth";
import { paragraphsToHtml, sendPlatformEmail } from "@/lib/email";
import { recordPlatformActivity } from "@/lib/platform-activity";
import { getSiteName } from "@/lib/platform-settings";
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
      slug: true,
      shelter: {
        select: {
          name: true,
          email: true,
        },
      },
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

  await recordPlatformActivity({
    category: "enquiry",
    action: "created",
    summary: `${name} enquired about ${animal.name} at ${animal.shelter.name}.`,
    detail: message || null,
    actorName: name,
    actorEmail: email,
    path: `/animals/${animal.slug}`,
    metadata: {
      animalId: animal.id,
      shelterId: animal.shelterId,
      phone: phone || null,
    },
  });

  const animalUrl = await currentAppUrl(`/animals/${animal.slug}`);
  await Promise.allSettled([
    sendPlatformEmail({
      to: animal.shelter.email,
      replyTo: email,
      subject: `New adoption enquiry for ${animal.name}`,
      text: [
        `A new enquiry was submitted for ${animal.name}.`,
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : "Phone: Not supplied",
        message ? `Message: ${message}` : "Message: Not supplied",
        `View the listing: ${animalUrl}`,
      ].join("\n\n"),
      html: paragraphsToHtml([
        `A new enquiry was submitted for ${animal.name}.`,
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : "Phone: Not supplied",
        message ? `Message: ${message}` : "Message: Not supplied",
        `View the listing: ${animalUrl}`,
      ]),
    }),
    sendPlatformEmail({
      to: email,
      subject: `Your enquiry about ${animal.name}`,
      text: [
        `Thanks ${name}, your enquiry about ${animal.name} has been sent to ${animal.shelter.name}.`,
        "The shelter handles all adoption conversations and placements directly.",
        `Animal profile: ${animalUrl}`,
      ].join("\n\n"),
      html: paragraphsToHtml([
        `Thanks ${name}, your enquiry about ${animal.name} has been sent to ${animal.shelter.name}.`,
        "The shelter handles all adoption conversations and placements directly.",
        `Animal profile: ${animalUrl}`,
      ]),
    }),
  ]);

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
  const siteName = await getSiteName();
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

  await recordPlatformActivity({
    category: "search",
    action: "alert_created",
    summary: `${email} saved a search alert.`,
    actorEmail: email,
    metadata: {
      query: query || null,
      species,
      suburb: suburb && suburb !== "All" ? suburb : null,
    },
  });

  await sendPlatformEmail({
    to: email,
    subject: `Your ${siteName} search alert is active`,
    text: [
      "Your rescue animal search alert has been saved.",
      query ? `Search: ${query}` : "Search: All animals",
      species ? `Species: ${species.toLowerCase()}` : "Species: Any",
      suburb && suburb !== "All" ? `Area: ${suburb}` : "Area: Any",
      "PAWS will use this alert to track matching listings.",
    ].join("\n\n"),
    html: paragraphsToHtml([
      "Your rescue animal search alert has been saved.",
      query ? `Search: ${query}` : "Search: All animals",
      species ? `Species: ${species.toLowerCase()}` : "Species: Any",
      suburb && suburb !== "All" ? `Area: ${suburb}` : "Area: Any",
      "PAWS will use this alert to track matching listings.",
    ]),
  });

  return {
    ok: true,
    message: "Alert saved. New matching listings will be tracked for this search.",
  };
}

export async function registerShelter(_: EnquiryResult, formData: FormData): Promise<EnquiryResult> {
  const siteName = await getSiteName();
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
      name: true,
      email: true,
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

  await recordPlatformActivity({
    category: "shelter",
    action: "registration_submitted",
    summary: `${shelter.name} submitted a registration request.`,
    actorName: primaryName,
    actorEmail: primaryEmail,
    metadata: {
      shelterId: shelter.id,
      shelterEmail: shelter.email,
      suburb: suburb || null,
      city,
    },
  });

  const shelterLoginUrl = await currentAppUrl("/shelter/login");

  await Promise.allSettled([
    sendPlatformEmail({
      to: primaryEmail,
      subject: `${shelter.name} registration received`,
      text: [
        `Thanks ${primaryName}, ${shelter.name} has been submitted for review.`,
        "You can sign in, but the public shelter profile and available listings will only show once the PAWS admin approves the shelter.",
        `Shelter login: ${shelterLoginUrl}`,
      ].join("\n\n"),
      html: paragraphsToHtml([
        `Thanks ${primaryName}, ${shelter.name} has been submitted for review.`,
        "You can sign in, but the public shelter profile and available listings will only show once the PAWS admin approves the shelter.",
        `Shelter login: ${shelterLoginUrl}`,
      ]),
    }),
    shelter.email !== primaryEmail
      ? sendPlatformEmail({
          to: shelter.email,
          subject: `${shelter.name} registration received`,
          text: [
            `${shelter.name} has been submitted for review on ${siteName}.`,
            `Primary contact: ${primaryName} <${primaryEmail}>`,
          ].join("\n\n"),
          html: paragraphsToHtml([
            `${shelter.name} has been submitted for review on ${siteName}.`,
            `Primary contact: ${primaryName} <${primaryEmail}>`,
          ]),
        })
      : Promise.resolve(),
  ]);

  redirect("/shelter");
}

export async function recordPublicSearchActivity(formData: FormData) {
  const query = getRequiredValue(formData, "query");
  const species = getRequiredValue(formData, "species");
  const size = getRequiredValue(formData, "size");
  const area = getRequiredValue(formData, "area");
  const shelters = getRequiredValue(formData, "shelters");
  const health = getRequiredValue(formData, "health");
  const results = Number.parseInt(getRequiredValue(formData, "results"), 10);
  const action = getRequiredValue(formData, "action") || "searched";

  await recordPlatformActivity({
    category: "search",
    action,
    summary: query ? `Public visitor searched "${query}".` : "Public visitor changed animal filters.",
    actorName: "Public visitor",
    metadata: {
      query: query || null,
      species,
      size,
      area,
      shelters: shelters ? shelters.split(",").filter(Boolean) : [],
      health: health ? health.split(",").filter(Boolean) : [],
      results: Number.isFinite(results) ? results : null,
    },
  });
}
