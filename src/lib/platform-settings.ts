import { prisma } from "@/lib/prisma";

export async function getPlatformSettings() {
  return prisma.platformSettings.findUnique({
    where: {
      id: "platform",
    },
  });
}

export async function getPublicBranding() {
  const settings = await prisma.platformSettings.findUnique({
    where: {
      id: "platform",
    },
    select: {
      siteLogoUrl: true,
      siteIconUrl: true,
    },
  });

  return {
    siteLogoUrl: settings?.siteLogoUrl ?? null,
    siteIconUrl: settings?.siteIconUrl ?? null,
  };
}
