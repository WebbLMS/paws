"use server";

import { createHash, randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

import { hashPassword } from "better-auth/crypto";
import { revalidatePath } from "next/cache";
import { redirect, RedirectType } from "next/navigation";

import { ShelterStatus, UserRole } from "@/generated/prisma/enums";
import { createAdminSession, clearAdminSession, requireAdminSession, validateAdminCredentials } from "@/lib/admin-auth";
import { currentAppUrl } from "@/lib/app-url";
import { defaultSiteName } from "@/lib/branding";
import { paragraphsToHtml, sendPlatformEmail } from "@/lib/email";
import { recordPlatformActivity } from "@/lib/platform-activity";
import { getSiteName } from "@/lib/platform-settings";
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

function parseOptionalUrl(value: string) {
  if (!value) return null;

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
  return parseOptionalUrl(value);
}

function parseShelterStatus(value: string) {
  return Object.values(ShelterStatus).includes(value as ShelterStatus) ? (value as ShelterStatus) : ShelterStatus.PENDING;
}

function parseUserRole(value: string) {
  return Object.values(UserRole).includes(value as UserRole) ? (value as UserRole) : UserRole.SHELTER_STAFF;
}

function parseGoogleAnalyticsId(value: string) {
  if (!value) return null;

  const directValue = value.trim().toUpperCase();
  const directMatch = directValue.match(/^(G|GT|AW|DC)-[A-Z0-9-]{4,}$/);
  if (directMatch) return directValue;

  const snippetMatch = value.toUpperCase().match(/\b(G|GT|AW|DC)-[A-Z0-9-]{4,}\b/);
  return snippetMatch?.[0] ?? null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parsePositiveInt(value: string, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(max, Math.max(min, parsed));
}

function randomId() {
  return randomBytes(16).toString("base64url");
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function saveUploadedImage(formData: FormData, key: string) {
  const file = formData.get(key);
  if (!(file instanceof File) || file.size === 0) return null;

  const allowedTypes = new Map([
    ["image/png", "png"],
    ["image/jpeg", "jpg"],
    ["image/webp", "webp"],
    ["image/gif", "gif"],
    ["image/x-icon", "ico"],
    ["image/vnd.microsoft.icon", "ico"],
  ]);

  const extension = allowedTypes.get(file.type);
  if (!extension) {
    throw new Error("Upload a PNG, JPG, WebP, GIF, or ICO image.");
  }

  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Logo and icon uploads must be under 2MB.");
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "platform");
  await mkdir(uploadDir, { recursive: true });

  const filename = `${key}-${Date.now()}-${randomBytes(6).toString("hex")}.${extension}`;
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(uploadDir, filename), bytes);

  return `/uploads/platform/${filename}`;
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

async function uniqueShelterSlug(name: string, currentShelterId?: string) {
  const baseSlug = slugify(name) || "shelter";
  const existing = await prisma.shelter.findMany({
    where: {
      slug: {
        startsWith: baseSlug,
      },
      ...(currentShelterId
        ? {
            id: {
              not: currentShelterId,
            },
          }
        : {}),
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

export async function loginAdmin(formData: FormData) {
  const username = getValue(formData, "username");
  const password = getValue(formData, "password");

  if (!validateAdminCredentials(username, password)) {
    redirect("/admin/login?error=1");
  }

  await createAdminSession(username);
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  revalidatePath("/admin");
  revalidatePath("/admin/login");
  redirect("/admin/login", RedirectType.replace);
}

export async function approveShelter(formData: FormData) {
  await requireAdminSession();
  const siteName = await getSiteName();

  const shelterId = getValue(formData, "shelterId");
  const returnTo = getValue(formData, "returnTo");
  if (!shelterId) throw new Error("Shelter ID is required.");

  const shelter = await prisma.shelter.update({
    where: {
      id: shelterId,
    },
    data: {
      status: ShelterStatus.APPROVED,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  await recordPlatformActivity({
    category: "shelter",
    action: "approved",
    summary: `${shelter.name} was approved by admin.`,
    actorName: "Admin",
    metadata: {
      shelterId: shelter.id,
    },
  });

  const shelterDashboardUrl = await currentAppUrl("/shelter");

  await sendPlatformEmail({
    to: shelter.email,
    subject: `${shelter.name} has been approved`,
    text: [
      `${shelter.name} has been approved on ${siteName}.`,
      "Your public shelter profile and available animal listings can now appear on the site.",
      `Shelter dashboard: ${shelterDashboardUrl}`,
    ].join("\n\n"),
    html: paragraphsToHtml([
      `${shelter.name} has been approved on ${siteName}.`,
      "Your public shelter profile and available animal listings can now appear on the site.",
      `Shelter dashboard: ${shelterDashboardUrl}`,
    ]),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/shelters");
  if (returnTo.startsWith("/admin/")) {
    revalidatePath(returnTo);
    redirect(`${returnTo}?updated=approved`);
  }
  redirect("/admin?updated=approved");
}

export async function rejectShelter(formData: FormData) {
  await requireAdminSession();
  const siteName = await getSiteName();

  const shelterId = getValue(formData, "shelterId");
  const returnTo = getValue(formData, "returnTo");
  if (!shelterId) throw new Error("Shelter ID is required.");

  const shelter = await prisma.shelter.update({
    where: {
      id: shelterId,
    },
    data: {
      status: ShelterStatus.REJECTED,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  await recordPlatformActivity({
    category: "shelter",
    action: "rejected",
    summary: `${shelter.name} was rejected by admin.`,
    actorName: "Admin",
    metadata: {
      shelterId: shelter.id,
    },
  });

  await sendPlatformEmail({
    to: shelter.email,
    subject: `${shelter.name} registration update`,
    text: [
      `${shelter.name} was not approved on ${siteName} at this stage.`,
      "Contact PAWS support if you believe this needs review.",
    ].join("\n\n"),
    html: paragraphsToHtml([
      `${shelter.name} was not approved on ${siteName} at this stage.`,
      "Contact PAWS support if you believe this needs review.",
    ]),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/shelters");
  if (returnTo.startsWith("/admin/")) {
    revalidatePath(returnTo);
    redirect(`${returnTo}?updated=rejected`);
  }
  redirect("/admin?updated=rejected");
}

export async function suspendShelter(formData: FormData) {
  await requireAdminSession();
  const siteName = await getSiteName();

  const shelterId = getValue(formData, "shelterId");
  const returnTo = getValue(formData, "returnTo");
  if (!shelterId) throw new Error("Shelter ID is required.");

  const shelter = await prisma.shelter.update({
    where: {
      id: shelterId,
    },
    data: {
      status: ShelterStatus.SUSPENDED,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  await recordPlatformActivity({
    category: "shelter",
    action: "suspended",
    summary: `${shelter.name} was suspended by admin.`,
    actorName: "Admin",
    metadata: {
      shelterId: shelter.id,
    },
  });

  await sendPlatformEmail({
    to: shelter.email,
    subject: `${shelter.name} has been suspended`,
    text: [
      `${shelter.name} has been suspended on ${siteName}.`,
      "Public shelter profile and animal listings are hidden while the shelter is suspended.",
    ].join("\n\n"),
    html: paragraphsToHtml([
      `${shelter.name} has been suspended on ${siteName}.`,
      "Public shelter profile and animal listings are hidden while the shelter is suspended.",
    ]),
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/shelters");
  if (returnTo.startsWith("/admin/")) {
    revalidatePath(returnTo);
    redirect(`${returnTo}?updated=suspended`);
  }
  redirect("/admin/shelters?updated=suspended");
}

export async function createShelter(formData: FormData) {
  await requireAdminSession();

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

  const shelter = await prisma.shelter.create({
    data: {
      name,
      slug: await uniqueShelterSlug(name),
      email,
      status: parseShelterStatus(getValue(formData, "status")),
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

  await recordPlatformActivity({
    category: "shelter",
    action: "created",
    summary: `${shelter.name} was added by admin.`,
    actorName: "Admin",
    metadata: {
      shelterId: shelter.id,
      status: shelter.status,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/shelters");
  redirect(`/admin/shelters/${shelter.id}`);
}

export async function updateShelter(formData: FormData) {
  await requireAdminSession();

  const shelterId = getValue(formData, "shelterId");
  const name = getValue(formData, "name");
  const email = getValue(formData, "email").toLowerCase();
  const city = getValue(formData, "city") || "Cape Town";

  if (!shelterId || !name || !email) {
    throw new Error("Shelter ID, name, and email are required.");
  }

  const coverImageUrl =
    (await saveUploadedShelterImage(formData, "coverImage")) ?? parseStoredShelterImageUrl(getValue(formData, "existingCoverImageUrl"));
  const logoImageUrl =
    (await saveUploadedShelterImage(formData, "logoImage")) ?? parseStoredShelterImageUrl(getValue(formData, "existingLogoImageUrl"));

  await prisma.shelter.update({
    where: {
      id: shelterId,
    },
    data: {
      name,
      slug: await uniqueShelterSlug(name, shelterId),
      email,
      status: parseShelterStatus(getValue(formData, "status")),
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

  revalidatePath("/admin");
  revalidatePath("/admin/shelters");
  redirect(`/admin/shelters/${shelterId}`);
}

export async function deleteShelter(formData: FormData) {
  await requireAdminSession();

  const shelterId = getValue(formData, "shelterId");
  const confirmation = getValue(formData, "confirmation");

  if (!shelterId || confirmation !== "DELETE") {
    throw new Error("Type DELETE to confirm shelter deletion.");
  }

  await prisma.shelter.delete({
    where: {
      id: shelterId,
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/shelters");
  redirect("/admin/shelters?deleted=1");
}

export async function createUser(formData: FormData) {
  await requireAdminSession();

  const name = getValue(formData, "name");
  const email = getValue(formData, "email").toLowerCase();
  const password = getValue(formData, "password");
  const shelterId = getValue(formData, "shelterId") || null;

  if (!name || !email || password.length < 8) {
    throw new Error("Name, valid email, and an 8+ character password are required.");
  }

  const now = new Date();
  const user = await prisma.user.create({
    data: {
      id: randomId(),
      name,
      email,
      emailVerified: true,
      role: parseUserRole(getValue(formData, "role")),
      shelterId,
    },
  });

  await prisma.account.create({
    data: {
      id: randomId(),
      accountId: user.id,
      providerId: "credential",
      userId: user.id,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect(`/admin/users/${user.id}`);
}

export async function updateUser(formData: FormData) {
  await requireAdminSession();

  const userId = getValue(formData, "userId");
  const name = getValue(formData, "name");
  const email = getValue(formData, "email").toLowerCase();
  const shelterId = getValue(formData, "shelterId") || null;
  const isSuspended = formData.get("isSuspended") === "on";

  if (!userId || !name || !email) {
    throw new Error("User ID, name, and email are required.");
  }

  const existingUser = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      suspendedAt: true,
    },
  });

  await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      name,
      email,
      role: parseUserRole(getValue(formData, "role")),
      shelterId,
      suspendedAt: isSuspended ? existingUser?.suspendedAt ?? new Date() : null,
    },
  });

  if (isSuspended) {
    await prisma.session.deleteMany({
      where: {
        userId,
      },
    });
  }

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect(`/admin/users/${userId}`);
}

export async function sendUserPasswordResetEmail(formData: FormData) {
  await requireAdminSession();
  const siteName = await getSiteName();

  const userId = getValue(formData, "userId");
  if (!userId) throw new Error("User ID is required.");

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    include: {
      shelter: true,
    },
  });

  if (!user) throw new Error("User not found.");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);
  const identifier = `password-reset:${user.id}`;

  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        passwordResetRequired: true,
      },
    }),
    prisma.session.deleteMany({
      where: {
        userId: user.id,
      },
    }),
    prisma.verification.deleteMany({
      where: {
        identifier,
      },
    }),
    prisma.verification.create({
      data: {
        id: randomId(),
        identifier,
        value: hashResetToken(token),
        expiresAt,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    }),
  ]);

  const resetUrl = await currentAppUrl(`/shelter/reset-password?token=${encodeURIComponent(token)}`);

  await sendPlatformEmail({
    to: user.email,
    subject: `Reset your ${siteName} password`,
    text: [
      `Hi ${user.name},`,
      "A PAWS admin requested a password reset for your shelter account.",
      "Use the link below to set a new password. This link expires in 24 hours.",
      resetUrl,
      user.shelter ? `Shelter: ${user.shelter.name}` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    html: paragraphsToHtml(
      [
        `Hi ${user.name},`,
        "A PAWS admin requested a password reset for your shelter account.",
        "Use the link below to set a new password. This link expires in 24 hours.",
        resetUrl,
        user.shelter ? `Shelter: ${user.shelter.name}` : null,
      ].filter(Boolean) as string[],
    ),
  });

  revalidatePath(`/admin/users/${user.id}`);
  revalidatePath(`/admin/users/${user.id}/edit`);
  redirect(`/admin/users/${user.id}/edit?reset=sent`);
}

export async function deleteUser(formData: FormData) {
  await requireAdminSession();

  const userId = getValue(formData, "userId");
  const confirmation = getValue(formData, "confirmation");

  if (!userId || confirmation !== "DELETE") {
    throw new Error("Type DELETE to confirm user deletion.");
  }

  await prisma.user.delete({
    where: {
      id: userId,
    },
  });

  revalidatePath("/admin");
  revalidatePath("/admin/users");
  redirect("/admin/users?deleted=1");
}

export async function updatePlatformSettings(formData: FormData) {
  await requireAdminSession();

  const siteName = getValue(formData, "siteName") || defaultSiteName;
  const analyticsInput = getValue(formData, "googleAnalyticsId");
  const googleAnalyticsId = parseGoogleAnalyticsId(analyticsInput);
  const existingLogoUrl = getValue(formData, "existingSiteLogoUrl") || null;
  const existingIconUrl = getValue(formData, "existingSiteIconUrl") || null;
  const existingSettings = await prisma.platformSettings.findUnique({
    where: {
      id: "platform",
    },
    select: {
      smtpPassword: true,
    },
  });
  const smtpEnabled = formData.get("smtpEnabled") === "on";
  const smtpHost = getValue(formData, "smtpHost") || null;
  const smtpPort = parsePositiveInt(getValue(formData, "smtpPort"), 587, 1, 65535);
  const smtpSecurity = ["TLS", "SSL", "NONE"].includes(getValue(formData, "smtpSecurity"))
    ? getValue(formData, "smtpSecurity")
    : "TLS";
  const smtpAuthType = getValue(formData, "smtpAuthType") || "LOGIN";
  const smtpUsername = getValue(formData, "smtpUsername") || null;
  const submittedSmtpPassword = getValue(formData, "smtpPassword");
  const smtpPassword = submittedSmtpPassword || existingSettings?.smtpPassword || null;
  const smtpSessionLimit = parsePositiveInt(getValue(formData, "smtpSessionLimit"), 3, 1, 20);
  const smtpNoReplyEmail = getValue(formData, "smtpNoReplyEmail").toLowerCase() || null;
  const smtpNoReplyName = getValue(formData, "smtpNoReplyName") || defaultSiteName;

  if (analyticsInput && !googleAnalyticsId) {
    redirect("/admin/settings?error=invalid-analytics-id");
  }

  if (smtpEnabled && (!smtpHost || !smtpUsername || !smtpPassword || !smtpNoReplyEmail || !isValidEmail(smtpNoReplyEmail))) {
    redirect("/admin/settings?error=invalid-email-settings");
  }

  let siteLogoUrl = existingLogoUrl;
  let siteIconUrl = existingIconUrl;

  try {
    siteLogoUrl = (await saveUploadedImage(formData, "siteLogo")) ?? siteLogoUrl;
    siteIconUrl = (await saveUploadedImage(formData, "siteIcon")) ?? siteIconUrl;
  } catch {
    redirect("/admin/settings?error=invalid-image");
  }

  await prisma.platformSettings.upsert({
    where: {
      id: "platform",
    },
    create: {
      id: "platform",
      siteName,
      googleAnalyticsId,
      siteLogoUrl,
      siteIconUrl,
      smtpEnabled,
      smtpHost,
      smtpPort,
      smtpSecurity,
      smtpAuthType,
      smtpUsername,
      smtpPassword,
      smtpSessionLimit,
      smtpNoReplyEmail,
      smtpNoReplyName,
    },
    update: {
      siteName,
      googleAnalyticsId,
      siteLogoUrl,
      siteIconUrl,
      smtpEnabled,
      smtpHost,
      smtpPort,
      smtpSecurity,
      smtpAuthType,
      smtpUsername,
      smtpPassword,
      smtpSessionLimit,
      smtpNoReplyEmail,
      smtpNoReplyName,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin/settings");
  redirect("/admin/settings?saved=1");
}
