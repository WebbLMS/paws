import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "../../admin-shell";

export const dynamic = "force-dynamic";

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireAdminSession()]);
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    include: {
      shelter: true,
      accounts: true,
      sessions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  if (!user) notFound();

  return (
    <AdminShell session={session} active="users">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <Link className="dashboard-back" href="/admin/users">Back to users</Link>
            <h1>{user.name}</h1>
            <p>{user.email} · {displayEnum(user.role)}</p>
          </div>
          <div className="admin-title-actions">
            <Link className="admin-title-action" href={`/admin/users/${user.id}/edit`}>Edit</Link>
            <Link className="admin-danger-link" href={`/admin/users/${user.id}/delete`}>Delete</Link>
          </div>
        </div>

        <section className="admin-detail-grid">
          <article className="admin-panel admin-detail-card">
            <header>
              <h2>User Details</h2>
            </header>
            <dl>
              <div><dt>Email</dt><dd><a href={`mailto:${user.email}`}>{user.email}</a></dd></div>
              <div><dt>Role</dt><dd>{displayEnum(user.role)}</dd></div>
              <div><dt>Email Verified</dt><dd>{user.emailVerified ? "Yes" : "No"}</dd></div>
              <div><dt>Shelter</dt><dd>{user.shelter ? <Link href={`/admin/shelters/${user.shelter.id}`}>{user.shelter.name}</Link> : "No shelter linked"}</dd></div>
              <div><dt>Accounts</dt><dd>{user.accounts.length}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(user.createdAt)}</dd></div>
            </dl>
          </article>

          <article className="admin-panel">
            <header>
              <h2>Recent Sessions</h2>
            </header>
            {user.sessions.length ? (
              <div className="admin-linked-list">
                {user.sessions.map((userSession) => (
                  <div key={userSession.id}>
                    <strong>{formatDate(userSession.createdAt)}</strong>
                    <span>{userSession.ipAddress ?? "No IP"} · expires {formatDate(userSession.expiresAt)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="admin-empty">No active sessions.</div>
            )}
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
