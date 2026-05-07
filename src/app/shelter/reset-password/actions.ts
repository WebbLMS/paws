"use server";

import { createHash, randomBytes } from "crypto";

import { hashPassword } from "better-auth/crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { currentAppUrl } from "@/lib/app-url";
import { auth } from "@/lib/auth";
import { paragraphsToHtml, sendPlatformEmail } from "@/lib/email";
import { getSiteName } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";

export type PasswordResetRequestResult = {
  ok: boolean;
  message: string;
};

function getValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hashResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

async function upsertCredentialPassword(userId: string, password: string) {
  const now = new Date();
  const existingAccount = await prisma.account.findFirst({
    where: {
      userId,
      providerId: "credential",
    },
    select: {
      id: true,
    },
  });

  if (existingAccount) {
    await prisma.account.update({
      where: {
        id: existingAccount.id,
      },
      data: {
        password: await hashPassword(password),
        updatedAt: now,
      },
    });
    return;
  }

  await prisma.account.create({
    data: {
      id: randomBytes(16).toString("base64url"),
      accountId: userId,
      providerId: "credential",
      userId,
      password: await hashPassword(password),
      createdAt: now,
      updatedAt: now,
    },
  });
}

export async function requestPasswordResetEmail(
  _: PasswordResetRequestResult,
  formData: FormData,
): Promise<PasswordResetRequestResult> {
  const siteName = await getSiteName();
  const email = getValue(formData, "email").toLowerCase();

  if (!isValidEmail(email)) {
    return {
      ok: false,
      message: "Enter a valid shelter email address.",
    };
  }

  const genericMessage = "If this email is linked to a shelter account, a password reset link has been sent.";
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    include: {
      shelter: true,
    },
  });

  if (!user || user.suspendedAt) {
    return {
      ok: true,
      message: genericMessage,
    };
  }

  const token = randomBytes(32).toString("base64url");
  const identifier = `password-reset:${user.id}`;
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24);

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
        id: randomBytes(16).toString("base64url"),
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
      "We received a request to reset your PAWS shelter account password.",
      "Use the link below to set a new password. This link expires in 24 hours.",
      resetUrl,
      user.shelter ? `Shelter: ${user.shelter.name}` : null,
    ]
      .filter(Boolean)
      .join("\n\n"),
    html: paragraphsToHtml(
      [
        `Hi ${user.name},`,
        "We received a request to reset your PAWS shelter account password.",
        "Use the link below to set a new password. This link expires in 24 hours.",
        resetUrl,
        user.shelter ? `Shelter: ${user.shelter.name}` : null,
      ].filter(Boolean) as string[],
    ),
  });

  return {
    ok: true,
    message: genericMessage,
  };
}

export async function setPasswordFromResetToken(formData: FormData) {
  const token = getValue(formData, "token");
  const password = getValue(formData, "password");
  const confirmPassword = getValue(formData, "confirmPassword");

  if (!token || password.length < 8 || password !== confirmPassword) {
    redirect(`/shelter/reset-password?token=${encodeURIComponent(token)}&error=invalid-password`);
  }

  const verification = await prisma.verification.findFirst({
    where: {
      value: hashResetToken(token),
      expiresAt: {
        gt: new Date(),
      },
      identifier: {
        startsWith: "password-reset:",
      },
    },
  });

  if (!verification) {
    redirect("/shelter/reset-password?error=invalid-token");
  }

  const userId = verification.identifier.replace("password-reset:", "");
  await upsertCredentialPassword(userId, password);
  await prisma.$transaction([
    prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        passwordResetRequired: false,
      },
    }),
    prisma.verification.deleteMany({
      where: {
        identifier: verification.identifier,
      },
    }),
  ]);

  redirect("/shelter/login?reset=complete");
}

export async function setRequiredPassword(formData: FormData) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    redirect("/shelter/login");
  }

  const password = getValue(formData, "password");
  const confirmPassword = getValue(formData, "confirmPassword");

  if (password.length < 8 || password !== confirmPassword) {
    redirect("/shelter/reset-password?error=invalid-password");
  }

  await upsertCredentialPassword(session.user.id, password);
  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      passwordResetRequired: false,
    },
  });

  redirect("/shelter");
}
