import Link from "next/link";
import { redirect } from "next/navigation";

import { EnquiryStatus, ShelterStatus } from "@/generated/prisma/enums";
import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";
import { prisma } from "@/lib/prisma";

import { SignOutButton } from "./sign-out-button";

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

  const [animalCount, availableCount, newEnquiryCount, enquiries, animals] = await Promise.all([
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
    prisma.adoptionEnquiry.count({
      where: {
        shelterId: shelter.id,
        status: EnquiryStatus.NEW,
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
      newEnquiryCount,
      enquiryCount: enquiries.length,
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
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <Link href="/" className="dashboard-back">
            Paws of Cape Town
          </Link>
          <h1>{dashboard.shelter.name}</h1>
          <p>{dashboard.shelter.suburb ?? "Cape Town"} shelter dashboard</p>
        </div>
        <div className="dashboard-actions">
          <Link href="/shelter/animals/new">Add Animal</Link>
          <Link href="/shelter/enquiries" className="secondary">View Enquiries</Link>
          <SignOutButton />
        </div>
      </header>

      {dashboard.shelter.status !== ShelterStatus.APPROVED ? (
        <section className="dashboard-notice">
          <strong>Pending shelter review</strong>
          <p>Your account is active, but public animal profiles from this shelter stay hidden until the shelter is approved.</p>
        </section>
      ) : null}

      <section className="metric-grid" aria-label="Shelter metrics">
        <article>
          <span>Total Listings</span>
          <strong>{dashboard.stats.animalCount}</strong>
        </article>
        <article>
          <span>Available</span>
          <strong>{dashboard.stats.availableCount}</strong>
        </article>
        <article>
          <span>New Enquiries</span>
          <strong>{dashboard.stats.newEnquiryCount}</strong>
        </article>
        <article>
          <span>Recent Enquiries</span>
          <strong>{dashboard.stats.enquiryCount}</strong>
        </article>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-panel" id="enquiries">
          <div className="panel-heading">
            <div>
              <h2>Recent Enquiries</h2>
              <p>Latest adoption interest for this shelter.</p>
            </div>
          </div>

          {dashboard.enquiries.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Animal</th>
                    <th>Enquirer</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.enquiries.map((enquiry) => (
                    <tr key={enquiry.id}>
                      <td>
                        <strong>{enquiry.animal.name}</strong>
                        <span>{enquiry.message ?? "No message supplied"}</span>
                      </td>
                      <td>
                        <strong>{enquiry.name}</strong>
                        <span>{enquiry.email}</span>
                      </td>
                      <td>
                        <span className="status-pill">{displayEnum(enquiry.status)}</span>
                      </td>
                      <td>{formatDate(enquiry.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel-empty">No adoption enquiries yet.</div>
          )}
        </article>

        <article className="dashboard-panel">
          <div className="panel-heading">
            <div>
              <h2>Animal Listings</h2>
              <p>Current listings managed by this shelter.</p>
            </div>
          </div>

          {dashboard.animals.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Species</th>
                    <th>Status</th>
                    <th>Updated</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {dashboard.animals.map((animal) => (
                    <tr key={animal.id}>
                      <td>
                        <strong>{animal.name}</strong>
                        <span>{animal.breed ?? "Mixed breed"} · {formatAge(animal.ageMonths)}</span>
                      </td>
                      <td>{displayEnum(animal.species)}</td>
                      <td>
                        <span className="status-pill">{displayEnum(animal.status)}</span>
                      </td>
                      <td>{formatDate(animal.updatedAt)}</td>
                      <td>
                        <Link href={`/shelter/animals/${animal.id}/edit`} className="table-action">
                          Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="panel-empty">No animal listings yet.</div>
          )}
        </article>
      </section>
    </main>
  );
}
