import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { nextCookies } from "better-auth/next-js";

import { UserRole } from "@/generated/prisma/enums";

import { prisma } from "./prisma";

async function getShelterForNewUser(email: string) {
  const devAdminEmail = process.env.DEV_SHELTER_ADMIN_EMAIL?.trim().toLowerCase();
  const devAdminShelterSlug = process.env.DEV_SHELTER_ADMIN_SHELTER_SLUG?.trim();

  if (devAdminEmail && devAdminShelterSlug && email.toLowerCase() === devAdminEmail) {
    return prisma.shelter.findUnique({
      where: {
        slug: devAdminShelterSlug,
      },
      select: {
        id: true,
      },
    });
  }

  return prisma.shelter.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
    },
  });
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
  },
  trustedOrigins: [process.env.BETTER_AUTH_URL ?? "http://localhost:3000"],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          const shelter = await getShelterForNewUser(user.email);

          if (!shelter) return;

          await prisma.user.update({
            where: {
              id: user.id,
            },
            data: {
              role: UserRole.SHELTER_ADMIN,
              shelterId: shelter.id,
            },
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});
