import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { sendUserPasswordResetEmail, updateUser } from "../../../actions";
import { AdminShell } from "../../../admin-shell";
import { AdminUserForm } from "../../../resource-forms";

export const dynamic = "force-dynamic";

export default async function EditAdminUserPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ reset?: string }>;
}) {
  const [{ id }, query, session, shelters] = await Promise.all([
    params,
    searchParams,
    requireAdminSession(),
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
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });

  if (!user) notFound();

  return (
    <AdminShell session={session} active="users">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Edit User</h1>
            <p>Update {user.name}&apos;s role, shelter link, and login access.</p>
          </div>
        </div>
        <article className="admin-panel">
          <AdminUserForm action={updateUser} user={user} shelters={shelters} submitLabel="Save User" />
        </article>
        <article className="admin-panel admin-reset-panel">
          <header>
            <h2>Password Reset</h2>
          </header>
          <div>
            {query.reset === "sent" ? <p className="admin-success">Password reset email sent to {user.email}.</p> : null}
            <p>
              Send a one-time reset link to the user. Their active sessions will be cleared and they must set a new
              password before using the shelter dashboard again.
            </p>
            <form action={sendUserPasswordResetEmail} className="admin-inline-form">
              <input type="hidden" name="userId" value={user.id} />
              <button type="submit">Send Password Reset Email</button>
            </form>
          </div>
        </article>
      </div>
    </AdminShell>
  );
}
