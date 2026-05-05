import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function getShelterContext() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    include: {
      shelter: true,
    },
  });

  if (!user || user.suspendedAt) return null;

  if (user.passwordResetRequired) {
    redirect("/shelter/reset-password");
  }

  if (!user.shelter) return null;

  return {
    session,
    user,
    shelter: user.shelter,
  };
}

export async function getActiveShelter() {
  const context = await getShelterContext();
  return context?.shelter ?? null;
}

export async function getCurrentActorName() {
  const context = await getShelterContext();
  return context?.user.name || context?.user.email || "Shelter team";
}

export async function getCurrentSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}
