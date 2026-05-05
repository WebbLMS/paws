import { requireAdminSession } from "@/lib/admin-auth";

import { createShelter } from "../../actions";
import { AdminShell } from "../../admin-shell";
import { AdminShelterForm } from "../../resource-forms";

export const dynamic = "force-dynamic";

export default async function NewAdminShelterPage() {
  const session = await requireAdminSession();

  return (
    <AdminShell session={session} active="shelters">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Add Shelter</h1>
            <p>Create a shelter record and set its approval state.</p>
          </div>
        </div>
        <article className="admin-panel">
          <AdminShelterForm action={createShelter} submitLabel="Create Shelter" />
        </article>
      </div>
    </AdminShell>
  );
}
