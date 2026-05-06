import Link from "next/link";

import { AnimalStatus, ShelterStatus } from "@/generated/prisma/enums";
import { requireAdminSession } from "@/lib/admin-auth";
import { defaultSiteName } from "@/lib/branding";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "./admin-shell";
import { approveShelter, rejectShelter } from "./actions";
import { ClickableRow } from "./clickable-row";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function timeLabel(date: Date) {
  const diffMs = Date.now() - date.getTime();
  const minutes = Math.max(1, Math.floor(diffMs / 60000));
  if (minutes < 60) return `${minutes} mins ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hours ago`;
  return formatDate(date);
}

async function getAdminDashboard() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    verifiedShelters,
    pendingShelters,
    activeListings,
    adoptedAnimals,
    publicUsers,
    pendingQueue,
    shelters,
    recentAnimals,
    recentEnquiries,
    recentShelters,
    loggedActivity,
    settings,
  ] = await Promise.all([
    prisma.shelter.count({
      where: {
        status: ShelterStatus.APPROVED,
      },
    }),
    prisma.shelter.count({
      where: {
        status: ShelterStatus.PENDING,
      },
    }),
    prisma.animal.count({
      where: {
        status: AnimalStatus.AVAILABLE,
      },
    }),
    prisma.animal.count({
      where: {
        status: AnimalStatus.ADOPTED,
      },
    }),
    prisma.user.count(),
    prisma.shelter.findMany({
      where: {
        status: ShelterStatus.PENDING,
      },
      orderBy: {
        createdAt: "asc",
      },
      take: 8,
    }),
    prisma.shelter.findMany({
      where: {
        status: ShelterStatus.APPROVED,
      },
      include: {
        animals: {
          select: {
            status: true,
            updatedAt: true,
          },
        },
        enquiries: {
          select: {
            createdAt: true,
          },
        },
      },
      take: 8,
    }),
    prisma.animal.findMany({
      include: {
        shelter: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.adoptionEnquiry.findMany({
      include: {
        animal: true,
        shelter: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.shelter.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    }),
    prisma.platformActivity.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 7,
    }),
    prisma.platformSettings.findUnique({
      where: {
        id: "platform",
      },
      select: {
        siteName: true,
      },
    }),
  ]);

  const topShelters = shelters
    .map((shelter) => {
      const activeCount = shelter.animals.filter((animal) => animal.status === AnimalStatus.AVAILABLE).length;
      const enquiryCount = shelter.enquiries.filter((enquiry) => enquiry.createdAt >= thirtyDaysAgo).length;
      const adoptionCount = shelter.animals.filter(
        (animal) => animal.status === AnimalStatus.ADOPTED && animal.updatedAt >= thirtyDaysAgo,
      ).length;

      return {
        id: shelter.id,
        name: shelter.name,
        slug: shelter.slug,
        activeCount,
        enquiryCount,
        adoptionCount,
      };
    })
    .sort((a, b) => b.enquiryCount + b.activeCount - (a.enquiryCount + a.activeCount))
    .slice(0, 5);

  const fallbackActivity = [
    ...recentAnimals.map((animal) => ({
      id: `animal-${animal.id}`,
      tone: animal.status === AnimalStatus.ADOPTED ? "green" : "blue",
      createdAt: animal.createdAt,
      message:
        animal.status === AnimalStatus.ADOPTED
          ? `${animal.shelter.name} marked ${animal.name} as adopted.`
          : `${animal.shelter.name} added ${animal.name}.`,
    })),
    ...recentEnquiries.map((enquiry) => ({
      id: `enquiry-${enquiry.id}`,
      tone: "teal",
      createdAt: enquiry.createdAt,
      message: `${enquiry.name} enquired about ${enquiry.animal.name} at ${enquiry.shelter.name}.`,
    })),
    ...recentShelters.map((shelter) => ({
      id: `shelter-${shelter.id}`,
      tone: shelter.status === ShelterStatus.PENDING ? "amber" : "slate",
      createdAt: shelter.createdAt,
      message: `${shelter.name} ${shelter.status === ShelterStatus.PENDING ? "submitted a registration request" : "joined the platform"}.`,
    })),
  ]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 7);
  const activity = loggedActivity.length
    ? loggedActivity.map((item) => ({
        id: item.id,
        tone: item.category === "search" ? "blue" : item.category === "enquiry" ? "teal" : item.category === "shelter" ? "amber" : "slate",
        createdAt: item.createdAt,
        message: item.summary,
      }))
    : fallbackActivity;

  return {
    stats: {
      verifiedShelters,
      pendingShelters,
      activeListings,
      adoptedAnimals,
      publicUsers,
    },
    pendingQueue,
    topShelters,
    activity,
    siteName: settings?.siteName ?? defaultSiteName,
  };
}

export default async function AdminDashboardPage() {
  const [session, dashboard] = await Promise.all([requireAdminSession(), getAdminDashboard()]);

  return (
    <AdminShell session={session} active="overview">
        <div className="admin-content">
          <div className="admin-page-title">
            <div>
              <h1>Platform Overview</h1>
              <p>Global statistics and pending actions across {dashboard.siteName}.</p>
            </div>
          </div>

          <section className="admin-stat-grid">
            <Link href="/admin/shelters?status=APPROVED" aria-label="View verified shelters">
              <article>
                <span className="blue">▦</span>
                <strong>{dashboard.stats.verifiedShelters}</strong>
                <p>Verified Shelters</p>
              </article>
            </Link>
            <Link href="/admin/animals?status=AVAILABLE" aria-label="View active listings">
              <article>
                <span className="teal">◌</span>
                <strong>{dashboard.stats.activeListings}</strong>
                <p>Total Active Listings</p>
              </article>
            </Link>
            <Link href="/admin/animals?status=ADOPTED" aria-label="View adopted animals">
              <article>
                <span className="pink">♡</span>
                <strong>{dashboard.stats.adoptedAnimals}</strong>
                <p>Total Adoptions</p>
              </article>
            </Link>
            <Link href="/admin/shelters?status=PENDING" aria-label="View pending approvals">
              <article className="pending">
                <span>▣</span>
                <strong>{dashboard.stats.pendingShelters}</strong>
                <p>Pending Approvals</p>
              </article>
            </Link>
          </section>

          <section className="admin-dashboard-grid">
            <div className="admin-left-column">
              <article className="admin-panel" id="pending-approvals">
                <header>
                  <h2>▦ Shelter Verification Queue</h2>
                </header>
                {dashboard.pendingQueue.length ? (
                  <div className="admin-queue">
                    {dashboard.pendingQueue.map((shelter) => (
                      <ClickableRow className="admin-queue-row" href={`/admin/shelters/${shelter.id}`} key={shelter.id}>
                        <div className="admin-queue-icon">▧</div>
                        <div>
                          <h3>{shelter.name}</h3>
                          <p>
                            <span>{shelter.suburb ?? shelter.city}</span>
                            <span>{shelter.registrationNumber ? `NPO: ${shelter.registrationNumber}` : "NPO not supplied"}</span>
                            <span>Applied {formatDate(shelter.createdAt)}</span>
                          </p>
                        </div>
                        <div className="admin-queue-actions">
                          <a href={`mailto:${shelter.email}`}>Contact</a>
                          <form action={rejectShelter}>
                            <input type="hidden" name="shelterId" value={shelter.id} />
                            <button type="submit" className="reject">Reject</button>
                          </form>
                          <form action={approveShelter}>
                            <input type="hidden" name="shelterId" value={shelter.id} />
                            <button type="submit">Approve</button>
                          </form>
                        </div>
                      </ClickableRow>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty">No shelters are waiting for approval.</div>
                )}
              </article>

              <article className="admin-panel" id="top-shelters">
                <header>
                  <h2>Top Performing Shelters</h2>
                  <Link href="/admin/shelters">Manage Shelters</Link>
                </header>
                <div className="admin-table-wrap">
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Shelter Name</th>
                        <th>Active Listings</th>
                        <th>Enquiries</th>
                        <th>Adoptions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.topShelters.map((shelter) => (
                        <tr key={shelter.id}>
                          <td>
                            <span>{initials(shelter.name)}</span>
                            <Link href={`/admin/shelters/${shelter.id}`}>{shelter.name}</Link>
                          </td>
                          <td>{shelter.activeCount}</td>
                          <td>{shelter.enquiryCount}</td>
                          <td className="green">{shelter.adoptionCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>
            </div>

            <Link className="admin-activity-panel-link" href="/admin/activity">
              <aside className="admin-panel admin-activity" id="activity">
                <header>
                  <h2>Platform Activity</h2>
                </header>
                <div className="admin-activity-list">
                  {dashboard.activity.map((item) => (
                    <div className={`admin-activity-item ${item.tone}`} key={item.id}>
                      <span></span>
                      <small>{timeLabel(item.createdAt)}</small>
                      <p>{item.message}</p>
                    </div>
                  ))}
                </div>
                <footer>{dashboard.stats.publicUsers} registered shelter users</footer>
              </aside>
            </Link>
          </section>
        </div>
    </AdminShell>
  );
}
