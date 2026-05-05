import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";

type ActivityInput = {
  category: string;
  action: string;
  summary: string;
  detail?: string | null;
  actorName?: string | null;
  actorEmail?: string | null;
  userId?: string | null;
  path?: string | null;
  metadata?: Record<string, unknown> | null;
};

export async function recordPlatformActivity(input: ActivityInput) {
  try {
    const headerStore = await headers();
    const path = input.path ?? headerStore.get("referer") ?? null;

    await prisma.platformActivity.create({
      data: {
        category: input.category,
        action: input.action,
        summary: input.summary,
        detail: input.detail ?? null,
        actorName: input.actorName ?? null,
        actorEmail: input.actorEmail?.toLowerCase() ?? null,
        userId: input.userId ?? null,
        path,
        metadata: input.metadata ? JSON.parse(JSON.stringify(input.metadata)) : undefined,
      },
    });
  } catch (error) {
    console.error("Could not record platform activity", error);
  }
}
