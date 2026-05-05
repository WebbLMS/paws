import Link from "next/link";

import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "../admin-shell";
import { ClickableRow } from "../clickable-row";

export const dynamic = "force-dynamic";

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatSessionDate(date: Date | null) {
  if (!date) return "No recent sessions";

  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function AdminUsersPage() {
  const session = await requireAdminSession();
  const users = await prisma.user.findMany({
    include: {
      shelter: true,
      sessions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
      _count: {
        select: {
          sessions: true,
          accounts: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <AdminShell session={session} active="users">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Users</h1>
            <p>Manage shelter staff accounts and their linked shelter access.</p>
          </div>
          <Link className="admin-title-action" href="/admin/users/new">Add User</Link>
        </div>

        <article className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Role</th>
                  <th>Shelter</th>
                  <th>Sessions</th>
                  <th>Recent session</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <ClickableRow href={`/admin/users/${user.id}`} tableRow key={user.id}>
                    <td>
                      <span>{user.name.slice(0, 2).toUpperCase()}</span>
                      <Link href={`/admin/users/${user.id}`}>{user.name}</Link>
                    </td>
                    <td>{displayEnum(user.role)}</td>
                    <td>{user.shelter ? <Link href={`/admin/shelters/${user.shelter.id}`}>{user.shelter.name}</Link> : "No shelter"}</td>
                    <td>{user._count.sessions}</td>
                    <td>{formatSessionDate(user.sessions[0]?.createdAt ?? null)}</td>
                    <td>
                      <Link className="table-action" href={`/admin/users/${user.id}/edit`}>Edit</Link>
                    </td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </AdminShell>
  );
}
