import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { deleteUser } from "../../../actions";
import { AdminShell } from "../../../admin-shell";

export const dynamic = "force-dynamic";

export default async function DeleteAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireAdminSession()]);
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      shelter: true,
    },
  });

  if (!user) notFound();

  return (
    <AdminShell session={session} active="users">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Delete User</h1>
            <p>This permanently removes {user.name}&apos;s login account and sessions.</p>
          </div>
        </div>
        <article className="admin-panel admin-delete-panel">
          <form action={deleteUser} className="admin-form">
            <input type="hidden" name="userId" value={user.id} />
            <p>
              {user.email} {user.shelter ? `currently has access to ${user.shelter.name}.` : "is not linked to a shelter."}
            </p>
            <label>
              <span>Type DELETE to confirm</span>
              <input name="confirmation" required />
            </label>
            <div className="admin-form-actions">
              <Link href={`/admin/users/${user.id}`}>Cancel</Link>
              <button className="danger" type="submit">Delete User</button>
            </div>
          </form>
        </article>
      </div>
    </AdminShell>
  );
}
