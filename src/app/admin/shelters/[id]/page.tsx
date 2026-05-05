import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { ShelterStatus } from "@/generated/prisma/enums";

import { approveShelter, rejectShelter, suspendShelter } from "../../actions";
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
  }).format(date);
}

function StatIcon({ type }: { type: "users" | "animals" | "enquiries" | "views" }) {
  if (type === "users") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3.8 19c.7-3.4 2.5-5.1 5.2-5.1s4.5 1.7 5.2 5.1" />
        <circle cx="17" cy="9.3" r="2.4" />
        <path d="M15.5 14.4c2.5.2 4.1 1.7 4.7 4.6" />
      </svg>
    );
  }

  if (type === "animals") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="7.5" cy="8.5" r="2.1" />
        <circle cx="12" cy="5.6" r="2.1" />
        <circle cx="16.5" cy="8.5" r="2.1" />
        <path d="M7.8 15.1c0-2.1 1.9-4 4.2-4s4.2 1.9 4.2 4c0 1.7-1.2 2.9-2.7 2.4-.6-.2-1-.5-1.5-.5s-.9.3-1.5.5c-1.5.5-2.7-.7-2.7-2.4Z" />
      </svg>
    );
  }

  if (type === "enquiries") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4" y="6" width="16" height="12" rx="2.4" />
        <path d="m5.2 7.6 6.8 5.2 6.8-5.2" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3.5 12s3.1-5.5 8.5-5.5 8.5 5.5 8.5 5.5-3.1 5.5-8.5 5.5S3.5 12 3.5 12Z" />
      <circle cx="12" cy="12" r="2.7" />
    </svg>
  );
}

export default async function AdminShelterDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireAdminSession()]);
  const shelter = await prisma.shelter.findUnique({
    where: {
      id,
    },
    include: {
      users: {
        orderBy: {
          name: "asc",
        },
      },
      animals: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 8,
      },
      _count: {
        select: {
          animals: true,
          enquiries: true,
          profileViews: true,
          users: true,
        },
      },
    },
  });

  if (!shelter) notFound();
  const returnTo = `/admin/shelters/${shelter.id}`;

  return (
    <AdminShell session={session} active="shelters">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <Link className="dashboard-back" href="/admin/shelters">Back to shelters</Link>
            <h1>{shelter.name}</h1>
            <p>{shelter.suburb ?? shelter.city} · {displayEnum(shelter.status)}</p>
          </div>
          <div className="admin-title-actions">
            {shelter.status === ShelterStatus.PENDING ? (
              <>
                <form action={rejectShelter}>
                  <input type="hidden" name="shelterId" value={shelter.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className="admin-danger-link">Reject</button>
                </form>
                <form action={approveShelter}>
                  <input type="hidden" name="shelterId" value={shelter.id} />
                  <input type="hidden" name="returnTo" value={returnTo} />
                  <button type="submit" className="admin-title-action">Approve</button>
                </form>
              </>
            ) : null}
            {shelter.status === ShelterStatus.SUSPENDED ? (
              <form action={approveShelter}>
                <input type="hidden" name="shelterId" value={shelter.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button type="submit" className="admin-title-action">Restore</button>
              </form>
            ) : shelter.status !== ShelterStatus.PENDING ? (
              <form action={suspendShelter}>
                <input type="hidden" name="shelterId" value={shelter.id} />
                <input type="hidden" name="returnTo" value={returnTo} />
                <button type="submit" className="admin-warning-link">Suspend</button>
              </form>
            ) : null}
            <Link className="admin-title-action" href={`/shelters/${shelter.slug}`} prefetch={false}>Public Profile</Link>
            <Link className="admin-title-action" href={`/admin/shelters/${shelter.id}/edit`}>Edit</Link>
            <Link className="admin-danger-link" href={`/admin/shelters/${shelter.id}/delete`}>Delete</Link>
          </div>
        </div>

        <section className="admin-stat-grid">
          <article>
            <span className="teal"><StatIcon type="users" /></span>
            <strong>{shelter._count.users}</strong>
            <p>Users</p>
          </article>
          <article>
            <span className="blue"><StatIcon type="animals" /></span>
            <strong>{shelter._count.animals}</strong>
            <p>Animals</p>
          </article>
          <article>
            <span className="pink"><StatIcon type="enquiries" /></span>
            <strong>{shelter._count.enquiries}</strong>
            <p>Enquiries</p>
          </article>
          <article>
            <span className="teal"><StatIcon type="views" /></span>
            <strong>{shelter._count.profileViews}</strong>
            <p>Profile Views</p>
          </article>
        </section>

        <section className="admin-detail-grid">
          <article className="admin-panel admin-detail-card">
            <header>
              <h2>Shelter Details</h2>
            </header>
            <dl>
              <div><dt>Email</dt><dd><a href={`mailto:${shelter.email}`}>{shelter.email}</a></dd></div>
              <div><dt>Status</dt><dd>{displayEnum(shelter.status)}</dd></div>
              <div><dt>Phone</dt><dd>{shelter.phone || "Not supplied"}</dd></div>
              <div><dt>Website</dt><dd>{shelter.websiteUrl ? <a href={shelter.websiteUrl}>{shelter.websiteUrl}</a> : "Not supplied"}</dd></div>
              <div><dt>Registration</dt><dd>{shelter.registrationNumber || "Not supplied"}</dd></div>
              <div><dt>Created</dt><dd>{formatDate(shelter.createdAt)}</dd></div>
              <div><dt>Bio</dt><dd>{shelter.bio || "No bio added."}</dd></div>
            </dl>
          </article>

          <article className="admin-panel">
            <header>
              <h2>Users</h2>
              <Link href={`/admin/users/new?shelterId=${shelter.id}`}>Add User</Link>
            </header>
            {shelter.users.length ? (
              <div className="admin-linked-list">
                {shelter.users.map((user) => (
                  <Link href={`/admin/users/${user.id}`} key={user.id}>
                    <strong>{user.name}</strong>
                    <span>{user.email} · {displayEnum(user.role)}</span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="admin-empty">No users linked to this shelter.</div>
            )}
          </article>
        </section>
      </div>
    </AdminShell>
  );
}
