import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { updateShelter } from "../../../actions";
import { AdminShell } from "../../../admin-shell";
import { AdminShelterForm } from "../../../resource-forms";

export const dynamic = "force-dynamic";

export default async function EditAdminShelterPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireAdminSession()]);
  const shelter = await prisma.shelter.findUnique({
    where: {
      id,
    },
  });

  if (!shelter) notFound();

  return (
    <AdminShell session={session} active="shelters">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Edit Shelter</h1>
            <p>Update {shelter.name} and its public profile fields.</p>
          </div>
        </div>
        <article className="admin-panel">
          <AdminShelterForm action={updateShelter} shelter={shelter} submitLabel="Save Shelter" />
        </article>
      </div>
    </AdminShell>
  );
}
