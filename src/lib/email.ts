import nodemailer from "nodemailer";

import { prisma } from "@/lib/prisma";

type MailMessage = {
  to: string | string[];
  subject: string;
  text: string;
  html?: string;
  replyTo?: string;
};

function asList(value: string | string[]) {
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function paragraphsToHtml(paragraphs: string[]) {
  return paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join("");
}

export async function sendPlatformEmail(message: MailMessage) {
  const settings = await prisma.platformSettings.findUnique({
    where: {
      id: "platform",
    },
    select: {
      smtpEnabled: true,
      smtpHost: true,
      smtpPort: true,
      smtpSecurity: true,
      smtpAuthType: true,
      smtpUsername: true,
      smtpPassword: true,
      smtpSessionLimit: true,
      smtpNoReplyEmail: true,
      smtpNoReplyName: true,
    },
  });

  if (
    !settings?.smtpEnabled ||
    !settings.smtpHost ||
    !settings.smtpUsername ||
    !settings.smtpPassword ||
    !settings.smtpNoReplyEmail ||
    !asList(message.to).length
  ) {
    return { sent: false, reason: "smtp-not-configured" as const };
  }

  const security = settings.smtpSecurity.toUpperCase();
  const secure = security === "SSL";
  const requireTLS = security === "TLS";
  const fromName = settings.smtpNoReplyName || "Paws of Cape Town";

  const transporter = nodemailer.createTransport({
    host: settings.smtpHost,
    port: settings.smtpPort,
    secure,
    requireTLS,
    pool: true,
    maxConnections: Math.max(1, settings.smtpSessionLimit || 3),
    authMethod: settings.smtpAuthType || "LOGIN",
    auth: {
      user: settings.smtpUsername,
      pass: settings.smtpPassword,
    },
  });

  try {
    await transporter.sendMail({
      from: {
        name: fromName,
        address: settings.smtpNoReplyEmail,
      },
      to: asList(message.to),
      subject: message.subject,
      text: message.text,
      html: message.html,
      replyTo: message.replyTo,
    });

    return { sent: true as const };
  } catch (error) {
    console.error("Email delivery failed", error);
    return { sent: false, reason: "delivery-failed" as const };
  } finally {
    transporter.close();
  }
}
