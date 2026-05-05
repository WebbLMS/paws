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

function initials(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
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

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [session, params] = await Promise.all([requireAdminSession(), searchParams]);
  const query = params.q?.trim() ?? "";
  const searchFilter = {
    contains: query,
    mode: "insensitive" as const,
  };

  const [shelters, animals, users] = query
    ? await Promise.all([
        prisma.shelter.findMany({
          where: {
            OR: [
              { name: searchFilter },
              { email: searchFilter },
              { suburb: searchFilter },
              { city: searchFilter },
              { registrationNumber: searchFilter },
            ],
          },
          include: {
            _count: {
              select: {
                animals: true,
                users: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 12,
        }),
        prisma.animal.findMany({
          where: {
            OR: [
              { name: searchFilter },
              { breed: searchFilter },
              { summary: searchFilter },
              { description: searchFilter },
              { suburb: searchFilter },
              {
                shelter: {
                  name: searchFilter,
                },
              },
            ],
          },
          include: {
            shelter: true,
            _count: {
              select: {
                enquiries: true,
                profileViews: true,
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 12,
        }),
        prisma.user.findMany({
          where: {
            OR: [
              { name: searchFilter },
              { email: searchFilter },
              {
                shelter: {
                  name: searchFilter,
                },
              },
            ],
          },
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
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
          take: 12,
        }),
      ])
    : [[], [], []];

  const totalResults = shelters.length + animals.length + users.length;

  return (
    <AdminShell session={session}>
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Search</h1>
            <p>
              {query
                ? `${totalResults} result${totalResults === 1 ? "" : "s"} for "${query}".`
                : "Search across shelters, animals, and shelter users."}
            </p>
          </div>
        </div>

        {!query ? (
          <article className="admin-panel">
            <div className="admin-empty">Enter a search term in the admin header.</div>
          </article>
        ) : (
          <div className="admin-search-results">
            <article className="admin-panel">
              <header>
                <h2>Shelters</h2>
                <Link href="/admin/shelters">Manage Shelters</Link>
              </header>
              {shelters.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Shelter</th>
                        <th>Status</th>
                        <th>Location</th>
                        <th>Users</th>
                        <th>Animals</th>
                      </tr>
                    </thead>
                    <tbody>
                      {shelters.map((shelter) => (
                        <ClickableRow href={`/admin/shelters/${shelter.id}`} tableRow key={shelter.id}>
                          <td>
                            <span>{initials(shelter.name)}</span>
                            <Link href={`/admin/shelters/${shelter.id}`}>{shelter.name}</Link>
                          </td>
                          <td>{displayEnum(shelter.status)}</td>
                          <td>{[shelter.suburb, shelter.city].filter(Boolean).join(", ") || "Not supplied"}</td>
                          <td>{shelter._count.users}</td>
                          <td>{shelter._count.animals}</td>
                        </ClickableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty">No matching shelters.</div>
              )}
            </article>

            <article className="admin-panel">
              <header>
                <h2>Animals</h2>
                <Link href="/admin/animals">View Animals</Link>
              </header>
              {animals.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Animal</th>
                        <th>Status</th>
                        <th>Shelter</th>
                        <th>Enquiries</th>
                        <th>Views</th>
                      </tr>
                    </thead>
                    <tbody>
                      {animals.map((animal) => (
                        <ClickableRow href={`/animals/${animal.slug}`} tableRow key={animal.id}>
                          <td>
                            <span>{initials(animal.name)}</span>
                            <Link href={`/animals/${animal.slug}`}>{animal.name}</Link>
                          </td>
                          <td>{displayEnum(animal.status)}</td>
                          <td>
                            <Link href={`/admin/shelters/${animal.shelter.id}`}>{animal.shelter.name}</Link>
                          </td>
                          <td>{animal._count.enquiries}</td>
                          <td>{animal._count.profileViews}</td>
                        </ClickableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty">No matching animals.</div>
              )}
            </article>

            <article className="admin-panel">
              <header>
                <h2>Users</h2>
                <Link href="/admin/users">Manage Users</Link>
              </header>
              {users.length ? (
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Role</th>
                        <th>Shelter</th>
                        <th>Sessions</th>
                        <th>Recent session</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <ClickableRow href={`/admin/users/${user.id}`} tableRow key={user.id}>
                          <td>
                            <span>{initials(user.name)}</span>
                            <Link href={`/admin/users/${user.id}`}>{user.name}</Link>
                          </td>
                          <td>{displayEnum(user.role)}</td>
                          <td>{user.shelter ? <Link href={`/admin/shelters/${user.shelter.id}`}>{user.shelter.name}</Link> : "No shelter"}</td>
                          <td>{user._count.sessions}</td>
                          <td>{formatSessionDate(user.sessions[0]?.createdAt ?? null)}</td>
                        </ClickableRow>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="admin-empty">No matching users.</div>
              )}
            </article>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
