import { prisma } from "@/lib/prisma";

import { defaultSiteName } from "./branding";

export { defaultSiteName };

export async function getPlatformSettings() {
  try {
    return await prisma.platformSettings.findUnique({
      where: {
        id: "platform",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load platform settings.", error);
    }

    return null;
  }
}

export async function getPublicBranding() {
  let settings = null;

  try {
    settings = await prisma.platformSettings.findUnique({
      where: {
        id: "platform",
      },
      select: {
        siteName: true,
        siteLogoUrl: true,
        siteIconUrl: true,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load public branding.", error);
    }
  }

  return {
    siteName: settings?.siteName ?? defaultSiteName,
    siteLogoUrl: settings?.siteLogoUrl ?? null,
    siteIconUrl: settings?.siteIconUrl ?? null,
  };
}

export async function getSiteName() {
  let settings = null;

  try {
    settings = await prisma.platformSettings.findUnique({
      where: {
        id: "platform",
      },
      select: {
        siteName: true,
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Could not load site name.", error);
    }
  }

  return settings?.siteName ?? defaultSiteName;
}
