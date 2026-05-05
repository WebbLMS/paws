import Image from "next/image";
import { notFound } from "next/navigation";

import { AnimalStatus, ShelterStatus } from "@/generated/prisma/enums";
import { getPublicBranding } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { recordShelterProfileView } from "@/lib/profile-views";

import { PawIcon, PublicFooter, PublicHeader } from "@/app/public-chrome";

import { ShelterProfileAnimals, type ShelterProfileAnimal } from "./shelter-profile-animals";

export const dynamic = "force-dynamic";

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAge(ageMonths: number | null) {
  if (!ageMonths) return "Age unknown";
  if (ageMonths < 12) return `${ageMonths} mo old`;

  const years = Math.floor(ageMonths / 12);
  return `${years} year${years === 1 ? "" : "s"} old`;
}

function ExternalLinkIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M14 5h5v5" />
      <path d="M19 5 10 14" />
      <path d="M12 6H7a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}

function mapAnimals(animals: Awaited<ReturnType<typeof getShelter>>["animals"]): ShelterProfileAnimal[] {
  return animals.map((animal) => ({
    id: animal.id,
    slug: animal.slug,
    name: animal.name,
    species: displayEnum(animal.species),
    breed: animal.breed ?? "Mixed breed",
    age: formatAge(animal.ageMonths),
    photo: animal.profileImageUrl ?? "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&h=900&fit=crop",
    status: displayEnum(animal.status),
    urgent: animal.isUrgent,
  }));
}

async function getShelter(slug: string) {
  const shelter = await prisma.shelter.findFirst({
    where: {
      slug,
      status: ShelterStatus.APPROVED,
    },
    include: {
      animals: {
        where: {
          status: AnimalStatus.AVAILABLE,
        },
        orderBy: [
          {
            isUrgent: "desc",
          },
          {
            publishedAt: "desc",
          },
        ],
      },
    },
  });

  if (!shelter) notFound();
  return shelter;
}

export default async function ShelterProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [shelter, branding] = await Promise.all([getShelter(slug), getPublicBranding()]);
  await recordShelterProfileView({
    shelterId: shelter.id,
    slug: shelter.slug,
  });

  const animals = mapAnimals(shelter.animals);
  const fallbackPhoto = animals[0]?.photo ?? "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=1200&h=600&fit=crop";
  const coverImage = shelter.coverImageUrl ?? fallbackPhoto;
  const logoImage = shelter.logoImageUrl ?? animals[0]?.photo;
  const location = [shelter.suburb, shelter.city].filter(Boolean).join(", ");

  return (
    <>
      <PublicHeader active="shelters" branding={branding} />
      <main className="site-shell shelter-profile-page">
        <section className="shelter-profile-hero">
          <div className="shelter-cover">
            <Image src={coverImage} alt="" fill sizes="100vw" preload className="shelter-cover-image" />
          </div>
          <div className="shelter-profile-identity">
            <div className="shelter-profile-logo">
              {logoImage ? <Image src={logoImage} alt={shelter.name} fill sizes="140px" /> : <PawIcon />}
            </div>
            <div className="shelter-profile-title-card">
              <h1>{shelter.name}</h1>
              <div className="shelter-profile-meta">
                <span>{location || "Cape Town"}</span>
                <span className="shelter-profile-verified">Verified shelter</span>
                {shelter.registrationNumber ? <em>{shelter.registrationNumber}</em> : null}
              </div>
            </div>
            {shelter.websiteUrl ? (
              <a href={shelter.websiteUrl} target="_blank" rel="noreferrer" className="visit-website-button">
                <ExternalLinkIcon />
                Visit Website
              </a>
            ) : null}
          </div>
        </section>

        <section className="shelter-profile-animals">
          <div className="shelter-profile-section-header">
            <h2>
              <PawIcon />
              Available Animals ({animals.length})
            </h2>
          </div>
          <ShelterProfileAnimals animals={animals} />
        </section>
      </main>
      <PublicFooter branding={branding} />
    </>
  );
}
