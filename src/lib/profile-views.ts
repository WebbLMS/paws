import "server-only";

import { ProfileViewType } from "@/generated/prisma/enums";

import { prisma } from "./prisma";

export async function recordAnimalProfileView({
  animalId,
  shelterId,
  slug,
}: {
  animalId: string;
  shelterId: string;
  slug: string;
}) {
  await prisma.profileView.create({
    data: {
      animalId,
      shelterId,
      type: ProfileViewType.ANIMAL,
      path: `/animals/${slug}`,
    },
  });
}

export async function recordShelterProfileView({ shelterId, slug }: { shelterId: string; slug: string }) {
  await prisma.profileView.create({
    data: {
      shelterId,
      type: ProfileViewType.SHELTER,
      path: `/shelters/${slug}`,
    },
  });
}
