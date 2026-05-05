import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { createUser } from "../../actions";
import { AdminShell } from "../../admin-shell";
import { AdminUserForm } from "../../resource-forms";

export const dynamic = "force-dynamic";

export default async function NewAdminUserPage({
  searchParams,
}: {
  searchParams: Promise<{ shelterId?: string | string[] }>;
}) {
  const [session, params, shelters] = await Promise.all([
    requireAdminSession(),
    searchParams,
    prisma.shelter.findMany({
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);
  const shelterId = typeof params.shelterId === "string" ? params.shelterId : "";

  return (
    <AdminShell session={session} active="users">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Add User</h1>
            <p>Create a shelter user account with password login.</p>
          </div>
        </div>
        <article className="admin-panel">
          <AdminUserForm action={createUser} shelters={shelters} user={{ shelterId }} submitLabel="Create User" />
        </article>
      </div>
    </AdminShell>
  );
}
