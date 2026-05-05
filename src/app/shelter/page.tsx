import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { AnimalStatus, EnquiryStatus, ProfileViewType, ShelterStatus } from "@/generated/prisma/enums";
import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";
import { prisma } from "@/lib/prisma";

import { ShelterPortalShell } from "./portal-shell";

export const dynamic = "force-dynamic";

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAge(ageMonths: number | null) {
  if (!ageMonths) return "Unknown";
  if (ageMonths < 12) return `${ageMonths} mo`;

  const years = Math.floor(ageMonths / 12);
  return `${years} yr${years === 1 ? "" : "s"}`;
}

async function getShelterDashboard() {
  const shelter = await getActiveShelter();

  if (!shelter) return null;

  const [
    animalCount,
    availableCount,
    adoptedCount,
    newEnquiryCount,
    profileViewCount,
    animalProfileViewCount,
    shelterProfileViewCount,
    enquiries,
    animals,
  ] = await Promise.all([
    prisma.animal.count({
      where: {
        shelterId: shelter.id,
      },
    }),
    prisma.animal.count({
      where: {
        shelterId: shelter.id,
        status: "AVAILABLE",
      },
    }),
    prisma.animal.count({
      where: {
        shelterId: shelter.id,
        status: AnimalStatus.ADOPTED,
      },
    }),
    prisma.adoptionEnquiry.count({
      where: {
        shelterId: shelter.id,
        status: EnquiryStatus.NEW,
      },
    }),
    prisma.profileView.count({
      where: {
        shelterId: shelter.id,
      },
    }),
    prisma.profileView.count({
      where: {
        shelterId: shelter.id,
        type: ProfileViewType.ANIMAL,
      },
    }),
    prisma.profileView.count({
      where: {
        shelterId: shelter.id,
        type: ProfileViewType.SHELTER,
      },
    }),
    prisma.adoptionEnquiry.findMany({
      where: {
        shelterId: shelter.id,
      },
      include: {
        animal: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 8,
    }),
    prisma.animal.findMany({
      where: {
        shelterId: shelter.id,
      },
      include: {
        _count: {
          select: {
            profileViews: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 8,
    }),
  ]);

  return {
    shelter,
    stats: {
      animalCount,
      availableCount,
      adoptedCount,
      newEnquiryCount,
      enquiryCount: enquiries.length,
      profileViewCount,
      animalProfileViewCount,
      shelterProfileViewCount,
    },
    enquiries,
    animals,
  };
}

export default async function ShelterDashboard() {
  const [session, dashboard] = await Promise.all([getCurrentSession(), getShelterDashboard()]);

  if (!session) {
    redirect("/shelter/login");
  }

  if (!dashboard) {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-empty">
          <h1>No shelter access</h1>
          <p>This account is not linked to a shelter yet. Sign in with the email address registered on the shelter record.</p>
          <Link href="/shelter/login" className="empty-link">
            Back to login
          </Link>
        </section>
      </main>
    );
  }

  return (
    <ShelterPortalShell shelter={dashboard.shelter} enquiryCount={dashboard.stats.newEnquiryCount}>
      <header className="portal-page-header">
        <div>
          <h1>Welcome back, Team!</h1>
          <p>Here is what is happening at {dashboard.shelter.name} today.</p>
        </div>
        <Link href="/shelter/animals/new" className="portal-primary-action">
          <span>+</span>
          Add New Animal
        </Link>
      </header>

      {dashboard.shelter.status !== ShelterStatus.APPROVED ? (
        <section className="dashboard-notice">
          <strong>Pending shelter review</strong>
          <p>Your account is active, but public animal profiles from this shelter stay hidden until the shelter is approved.</p>
        </section>
      ) : null}

      <section className="portal-kpi-grid" aria-label="Shelter metrics">
        <article className="blue">
          <span>◌</span>
          <div>
            <p>Active Listings</p>
            <strong>{dashboard.stats.availableCount}</strong>
          </div>
        </article>
        <article className="red">
          <span>✉</span>
          <div>
            <p>New Enquiries</p>
            <strong>{dashboard.stats.newEnquiryCount}</strong>
          </div>
        </article>
        <article className="green">
          <span>⌂</span>
          <div>
            <p>Adopted</p>
            <strong>{dashboard.stats.adoptedCount}</strong>
          </div>
        </article>
        <article className="purple">
          <span>◎</span>
          <div>
            <p>Profile Views</p>
            <strong>{dashboard.stats.profileViewCount}</strong>
            <small>{dashboard.stats.animalProfileViewCount} animal · {dashboard.stats.shelterProfileViewCount} shelter</small>
          </div>
        </article>
      </section>

      <section className="portal-dashboard-grid">
        <article className="portal-card portal-enquiry-card" id="enquiries">
          <div className="portal-card-heading">
            <h2>Recent Enquiries</h2>
            <Link href="/shelter/enquiries">View All</Link>
          </div>

          {dashboard.enquiries.length ? (
            <div className="portal-enquiry-list">
              {dashboard.enquiries.slice(0, 5).map((enquiry) => (
                <Link className="portal-enquiry-row" href={`/shelter/enquiries?status=${enquiry.status}#enquiry-${enquiry.id}`} key={enquiry.id}>
                  <div className="portal-avatar">{enquiry.name.slice(0, 2).toUpperCase()}</div>
                  <div>
                    <h3>
                      {enquiry.name}
                      {enquiry.status === EnquiryStatus.NEW ? <span>New</span> : null}
                    </h3>
                    <p>
                      Applied for <strong>{enquiry.animal.name}</strong> · {formatDate(enquiry.createdAt)}
                    </p>
                  </div>
                  <span className="portal-row-status">{displayEnum(enquiry.status)}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel-empty">No adoption enquiries yet.</div>
          )}
        </article>

        <article className="portal-card portal-inventory-card">
          <div className="portal-card-heading">
            <h2>Quick Inventory</h2>
            <span>⌕</span>
          </div>

          {dashboard.animals.length ? (
            <div className="portal-inventory-list">
              {dashboard.animals.map((animal) => (
                <Link className="portal-inventory-row" href={`/shelter/animals/${animal.id}/edit`} key={animal.id}>
                  <Image
                    src={animal.profileImageUrl ?? "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=200&h=200&fit=crop"}
                    alt={animal.name}
                    width={48}
                    height={48}
                    unoptimized
                  />
                  <div>
                    <strong>{animal.name}</strong>
                    <span>{displayEnum(animal.species)} · {formatAge(animal.ageMonths)} · {animal._count.profileViews} views</span>
                  </div>
                  <em className={`inventory-status ${animal.status.toLowerCase()}`}>{displayEnum(animal.status)}</em>
                </Link>
              ))}
              <Link className="portal-manage-all" href="/shelter/animals">Manage All {dashboard.stats.animalCount} Animals</Link>
            </div>
          ) : (
            <div className="panel-empty">No animal listings yet.</div>
          )}
        </article>
      </section>
    </ShelterPortalShell>
  );
}
