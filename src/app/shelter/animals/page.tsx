import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimalStatus, EnquiryStatus } from "@/generated/prisma/enums";
import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";
import { prisma } from "@/lib/prisma";

import { ShelterPortalShell } from "../portal-shell";

export const dynamic = "force-dynamic";

const statusFilters = [
  { label: "All", value: "" },
  { label: "Available", value: AnimalStatus.AVAILABLE },
  { label: "Draft", value: AnimalStatus.DRAFT },
  { label: "Reserved", value: AnimalStatus.RESERVED },
  { label: "Adopted", value: AnimalStatus.ADOPTED },
  { label: "Archived", value: AnimalStatus.ARCHIVED },
];

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAge(ageMonths: number | null) {
  if (!ageMonths) return "Unknown age";
  if (ageMonths < 12) return `${ageMonths} mo`;

  const years = Math.floor(ageMonths / 12);
  return `${years} yr${years === 1 ? "" : "s"}`;
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function parseStatus(value: string | string[] | undefined) {
  if (typeof value !== "string") return null;
  return Object.values(AnimalStatus).includes(value as AnimalStatus) ? (value as AnimalStatus) : null;
}

export default async function ShelterAnimalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const params = await searchParams;
  const activeStatus = parseStatus(params.status);
  const [session, shelter] = await Promise.all([getCurrentSession(), getActiveShelter()]);

  if (!session) {
    redirect("/shelter/login");
  }

  if (!shelter) {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-empty">
          <h1>No shelter access</h1>
          <p>This account is not linked to a shelter yet.</p>
        </section>
      </main>
    );
  }

  const [animals, totalAnimals, availableAnimals, draftAnimals, newEnquiryCount] = await Promise.all([
    prisma.animal.findMany({
      where: {
        shelterId: shelter.id,
        ...(activeStatus ? { status: activeStatus } : {}),
      },
      include: {
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
    }),
    prisma.animal.count({
      where: {
        shelterId: shelter.id,
      },
    }),
    prisma.animal.count({
      where: {
        shelterId: shelter.id,
        status: AnimalStatus.AVAILABLE,
      },
    }),
    prisma.animal.count({
      where: {
        shelterId: shelter.id,
        status: AnimalStatus.DRAFT,
      },
    }),
    prisma.adoptionEnquiry.count({
      where: {
        shelterId: shelter.id,
        status: EnquiryStatus.NEW,
      },
    }),
  ]);

  return (
    <ShelterPortalShell shelter={shelter} active="animals" enquiryCount={newEnquiryCount}>
      <section className="portal-form-page">
        <header className="dashboard-header my-animals-header">
          <div>
            <Link href="/shelter" className="dashboard-back">
              Back to dashboard
            </Link>
            <h1>My Animals</h1>
            <p>{shelter.name} · {animals.length} listing{animals.length === 1 ? "" : "s"} shown</p>
          </div>
          <Link href="/shelter/animals/new" className="portal-primary-action">
            <span>+</span>
            Add Animal
          </Link>
        </header>

        <section className="my-animals-summary" aria-label="Animal listing summary">
          <article>
            <span>Total Listings</span>
            <strong>{totalAnimals}</strong>
          </article>
          <article>
            <span>Available</span>
            <strong>{availableAnimals}</strong>
          </article>
          <article>
            <span>Drafts</span>
            <strong>{draftAnimals}</strong>
          </article>
        </section>

        <nav className="status-filter" aria-label="Animal status filter">
          {statusFilters.map((option) => {
            const href = option.value ? `/shelter/animals?status=${option.value}` : "/shelter/animals";
            const isActive = option.value === (activeStatus ?? "");

            return (
              <Link key={option.label} href={href} className={isActive ? "active" : ""}>
                {option.label}
              </Link>
            );
          })}
        </nav>

        <section className="dashboard-panel my-animals-panel">
          <div className="panel-heading">
            <div>
              <h2>Animal Listings</h2>
              <p>Review public status, engagement, and update each profile.</p>
            </div>
          </div>

          {animals.length ? (
            <div className="my-animals-list">
              {animals.map((animal) => (
                <Link className="my-animal-row" href={`/shelter/animals/${animal.id}/edit`} key={animal.id}>
                  <Image
                    src={animal.profileImageUrl ?? "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=240&h=240&fit=crop"}
                    alt={animal.name}
                    width={72}
                    height={72}
                    unoptimized
                  />
                  <div className="my-animal-main">
                    <strong>{animal.name}</strong>
                    <span>
                      {displayEnum(animal.species)} · {animal.breed ?? "Mixed breed"} · {formatAge(animal.ageMonths)}
                    </span>
                    <small>Updated {formatDate(animal.updatedAt)}</small>
                  </div>
                  <div className="my-animal-metrics" aria-label={`${animal.name} listing metrics`}>
                    <span>{animal._count.profileViews} views</span>
                    <span>{animal._count.enquiries} enquiries</span>
                  </div>
                  <em className={`inventory-status ${animal.status.toLowerCase()}`}>{displayEnum(animal.status)}</em>
                  <span className="table-action">Edit</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="panel-empty">
              <h1>No animals found</h1>
              <p>Try a different status filter or add a new listing.</p>
            </div>
          )}
        </section>
      </section>
    </ShelterPortalShell>
  );
}
