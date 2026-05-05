import Link from "next/link";

import { AnimalStatus, ShelterStatus } from "@/generated/prisma/enums";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "../admin-shell";

export const dynamic = "force-dynamic";

type ActivityRow = {
  id: string;
  createdAt: Date;
  category: string;
  action: string;
  actorName: string | null;
  actorEmail: string | null;
  userName?: string | null;
  userEmail?: string | null;
  summary: string;
  detail: string | null;
  path: string | null;
};

type ActivitySearchParams = {
  category?: string | string[];
  actor?: string | string[];
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) return value[0];
  return value;
}

function listParam(value: string | string[] | undefined) {
  const values = Array.isArray(value) ? value : value ? [value] : [];
  return values.map((item) => item.toLowerCase()).filter(Boolean);
}

function activityHref(category: string | undefined, actors: string[]) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  actors.forEach((actor) => params.append("actor", actor));
  const query = params.toString();
  return query ? `/admin/activity?${query}` : "/admin/activity";
}

function display(value: string | null) {
  if (!value) return "Unassigned";
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatDateParts(date: Date) {
  return {
    date: new Intl.DateTimeFormat("en-ZA", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }).format(date),
    time: new Intl.DateTimeFormat("en-ZA", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(date),
  };
}

function pathLabel(path: string | null) {
  if (!path) return "Not captured";
  try {
    return new URL(path).pathname;
  } catch {
    return path;
  }
}

async function getFallbackActivity() {
  const [recentAnimals, recentEnquiries, recentShelters] = await Promise.all([
    prisma.animal.findMany({
      include: {
        shelter: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 75,
    }),
    prisma.adoptionEnquiry.findMany({
      include: {
        animal: true,
        shelter: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 75,
    }),
    prisma.shelter.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 75,
    }),
  ]);

  return [
    ...recentAnimals.map((animal): ActivityRow => ({
      id: `animal-${animal.id}`,
      createdAt: animal.createdAt,
      category: "animal",
      action: animal.status === AnimalStatus.ADOPTED ? "adopted" : "created",
      actorName: animal.shelter.name,
      actorEmail: animal.shelter.email,
      summary:
        animal.status === AnimalStatus.ADOPTED
          ? `${animal.shelter.name} marked ${animal.name} as adopted.`
          : `${animal.shelter.name} added ${animal.name}.`,
      detail: `${animal.name} · ${display(animal.status)}`,
      path: `/animals/${animal.slug}`,
    })),
    ...recentEnquiries.map((enquiry): ActivityRow => ({
      id: `enquiry-${enquiry.id}`,
      createdAt: enquiry.createdAt,
      category: "enquiry",
      action: "created",
      actorName: enquiry.name,
      actorEmail: enquiry.email,
      summary: `${enquiry.name} enquired about ${enquiry.animal.name} at ${enquiry.shelter.name}.`,
      detail: enquiry.message || null,
      path: `/shelter/enquiries`,
    })),
    ...recentShelters.map((shelter): ActivityRow => ({
      id: `shelter-${shelter.id}`,
      createdAt: shelter.createdAt,
      category: "shelter",
      action: shelter.status === ShelterStatus.PENDING ? "registered" : "joined",
      actorName: shelter.name,
      actorEmail: shelter.email,
      summary: `${shelter.name} ${shelter.status === ShelterStatus.PENDING ? "submitted a registration request" : "joined the platform"}.`,
      detail: `${display(shelter.status)} · ${shelter.suburb ?? shelter.city}`,
      path: `/admin/shelters/${shelter.id}`,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
}

export default async function AdminActivityPage({
  searchParams,
}: {
  searchParams: Promise<ActivitySearchParams>;
}) {
  const [session, params] = await Promise.all([requireAdminSession(), searchParams]);
  const categoryParam = firstParam(params.category);
  const category = typeof categoryParam === "string" && categoryParam ? categoryParam : undefined;
  const selectedActors = listParam(params.actor);
  const selectedActorSet = new Set(selectedActors);

  const where = {
    ...(category ? { category } : {}),
    ...(selectedActors.length ? { actorEmail: { in: selectedActors } } : {}),
  };

  const [loggedActivities, fallbackActivities, userSource] = await Promise.all([
    prisma.platformActivity.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 150,
    }),
    getFallbackActivity(),
    prisma.platformActivity.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 500,
      select: {
        actorEmail: true,
        actorName: true,
      },
    }),
  ]);
  const loggedRows: ActivityRow[] = loggedActivities.map((item) => ({
    id: item.id,
    createdAt: item.createdAt,
    category: item.category,
    action: item.action,
    actorName: item.actorName,
    actorEmail: item.actorEmail,
    userName: item.user?.name,
    userEmail: item.user?.email,
    summary: item.summary,
    detail: item.detail,
    path: item.path,
  }));
  const fallbackRows = fallbackActivities.filter((item) => {
    if (category && item.category !== category) return false;
    if (selectedActorSet.size && (!item.actorEmail || !selectedActorSet.has(item.actorEmail.toLowerCase()))) return false;
    return true;
  });
  const activities = [...loggedRows, ...fallbackRows]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 150);
  const userRows = [
    ...userSource.map((item) => ({
      actorEmail: item.actorEmail,
      actorName: item.actorName,
    })),
    ...fallbackActivities.map((item) => ({
      actorEmail: item.actorEmail,
      actorName: item.actorName,
    })),
  ];
  const users = Array.from(
    userRows
      .reduce((map, item) => {
        const key = item.actorEmail?.toLowerCase() ?? item.actorName ?? "Visitor";
        const existing = map.get(key) ?? {
          actorEmail: item.actorEmail,
          actorName: item.actorName,
          count: 0,
        };
        existing.count += 1;
        map.set(key, existing);
        return map;
      }, new Map<string, { actorEmail: string | null; actorName: string | null; count: number }>())
      .values(),
  )
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
  const filterUserCount = users.filter((user) => user.actorEmail).length;

  return (
    <AdminShell session={session} active="activity">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Platform Activity</h1>
            <p>Search, filter, enquiry, shelter, and user activity across the platform.</p>
          </div>
        </div>

        <div className="admin-activity-layout">
          <article className="admin-panel admin-activity-stream">
            <header>
              <h2>Activity Stream</h2>
              <div className="admin-filter-links">
                <Link className={!category ? "active" : ""} href={activityHref(undefined, selectedActors)}>All</Link>
                <Link className={category === "search" ? "active" : ""} href={activityHref("search", selectedActors)}>Search</Link>
                <Link className={category === "enquiry" ? "active" : ""} href={activityHref("enquiry", selectedActors)}>Enquiries</Link>
                <Link className={category === "shelter" ? "active" : ""} href={activityHref("shelter", selectedActors)}>Shelters</Link>
                <details className="admin-filter-dropdown">
                  <summary>
                    Users
                    {selectedActors.length ? <span>{selectedActors.length}</span> : null}
                  </summary>
                  <form action="/admin/activity">
                    {category ? <input name="category" type="hidden" value={category} /> : null}
                    <div className="admin-filter-menu">
                      {users.map((user) => {
                        const email = user.actorEmail?.toLowerCase();
                        if (!email) return null;
                        const label = user.actorEmail ?? user.actorName ?? "Visitor";
                        const isSelected = selectedActorSet.has(email);
                        return (
                          <label key={`${user.actorEmail}-${user.actorName}`}>
                            <input defaultChecked={isSelected} name="actor" type="checkbox" value={email} />
                            <span>{(user.actorName ?? label).slice(0, 2).toUpperCase()}</span>
                            <strong>{user.actorName ?? "Visitor"}</strong>
                            <small>{user.count}</small>
                          </label>
                        );
                      })}
                      {!filterUserCount ? <p>No users captured yet.</p> : null}
                    </div>
                    <footer>
                      <Link href={activityHref(category, [])}>Clear</Link>
                      <button type="submit">Apply</button>
                    </footer>
                  </form>
                </details>
              </div>
            </header>
            <div className="admin-table-wrap">
              <table className="admin-table admin-activity-table">
                <thead>
                  <tr>
                    <th>When</th>
                    <th>Type</th>
                    <th>Actor</th>
                    <th>Activity</th>
                    <th>Path</th>
                  </tr>
                </thead>
                <tbody>
                  {activities.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <time dateTime={item.createdAt.toISOString()}>
                          <strong>{formatDateParts(item.createdAt).date}</strong>
                          <small>{formatDateParts(item.createdAt).time}</small>
                        </time>
                      </td>
                      <td>
                        <strong className="admin-activity-badge">{display(item.category)}</strong>
                        <small>{display(item.action)}</small>
                      </td>
                      <td>
                        <strong>{item.actorName ?? item.userName ?? "Visitor"}</strong>
                        <small>{item.actorEmail ?? item.userEmail ?? "No email"}</small>
                      </td>
                      <td>
                        <strong>{item.summary}</strong>
                        {item.detail ? <small>{item.detail}</small> : null}
                      </td>
                      <td>
                        <code>{pathLabel(item.path)}</code>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        </div>
      </div>
    </AdminShell>
  );
}
