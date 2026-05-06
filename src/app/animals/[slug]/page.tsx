import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoViewer } from "@/app/photo-viewer";
import { PublicFooter, PublicHeader } from "@/app/public-chrome";
import { AnimalStatus, ShelterStatus } from "@/generated/prisma/enums";
import { defaultSiteName } from "@/lib/branding";
import { getPublicBranding } from "@/lib/platform-settings";
import { prisma } from "@/lib/prisma";
import { recordAnimalProfileView } from "@/lib/profile-views";

import { ProfileEnquiry } from "./profile-enquiry";
import { ScrollToTop } from "./scroll-to-top";

export const dynamic = "force-dynamic";

const fallbackPhoto = "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&h=900&fit=crop";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatAge(ageMonths: number | null) {
  if (!ageMonths) return "Age unknown";
  if (ageMonths < 12) return `${ageMonths} months`;

  const years = Math.floor(ageMonths / 12);
  const months = ageMonths % 12;

  if (!months) return `${years} year${years === 1 ? "" : "s"}`;
  return `${years} yr ${months} mo`;
}

function SocialIcon({ platform }: { platform: "facebook" | "instagram" | "whatsapp" }) {
  if (platform === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M13.6 18v-5.1h1.8l.3-2.2h-2.1V9.2c0-.6.2-1.1 1.2-1.1h1V6.2c-.5-.1-1.1-.2-1.8-.2-2 0-3.4 1.2-3.4 3.4v1.3H8.8v2.2h1.8V18h3Z" />
      </svg>
    );
  }

  if (platform === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4.5" y="4.5" width="15" height="15" rx="4.4" />
        <circle cx="12" cy="12" r="3.4" />
        <circle cx="16.6" cy="7.4" r="1.1" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5.1 20 6.2 16.3A7.7 7.7 0 1 1 9 19.1L5.1 20Z" />
      <path d="M9.3 8.3c-.2-.4-.4-.4-.7-.4h-.5c-.2 0-.6.1-.9.4-.3.4-.9 1-.9 2.3 0 1.4 1 2.7 1.1 2.9.1.2 2 3.2 4.9 4.3 2.4.9 2.9.7 3.4.7.6-.1 1.8-.7 2-1.5.2-.7.2-1.3.1-1.5-.1-.1-.3-.2-.6-.4l-1.9-.9c-.3-.1-.5-.2-.7.2l-.8 1c-.2.3-.4.3-.7.1-.3-.1-1.3-.5-2.5-1.6-.9-.8-1.5-1.8-1.7-2.2-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2Z" />
    </svg>
  );
}

function ShareGlyph() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="m8.7 10.6 6.6-4.1" />
      <path d="m8.7 13.4 6.6 4.1" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3.8 11 8.2-7 8.2 7" />
      <path d="M6.4 9.2v10.1h11.2V9.2" />
      <path d="M9.7 19.3v-5.5h4.6v5.5" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function MapPinIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s7-4.8 7-11a7 7 0 1 0-14 0c0 6.2 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="5" y="3.8" width="14" height="16.4" rx="2" />
      <path d="M9 8h.01" />
      <path d="M12 8h.01" />
      <path d="M15 8h.01" />
      <path d="M9 12h.01" />
      <path d="M12 12h.01" />
      <path d="M15 12h.01" />
      <path d="M10 20.2v-4h4v4" />
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12h13" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

function FactIcon({ type }: { type: "breed" | "age" | "gender" }) {
  if (type === "breed") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="7.5" cy="8.5" r="2.1" />
        <circle cx="12" cy="5.6" r="2.1" />
        <circle cx="16.5" cy="8.5" r="2.1" />
        <path d="M7.8 15.1c0-2.1 1.9-4 4.2-4s4.2 1.9 4.2 4c0 1.7-1.2 2.9-2.7 2.4-.6-.2-1-.5-1.5-.5s-.9.3-1.5.5c-1.5.5-2.7-.7-2.7-2.4Z" />
        <path d="M19.3 13.3c1.4 1.3 1.5 3.5.2 4.9-1.1 1.2-3 1.5-4.3.6" />
      </svg>
    );
  }

  if (type === "age") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="4.5" y="5.8" width="15" height="14" rx="2.4" />
        <path d="M8.2 3.8v4" />
        <path d="M15.8 3.8v4" />
        <path d="M4.5 10h15" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="8.2" />
      <path d="M12 11v5" />
      <path d="M12 8h.01" />
    </svg>
  );
}

function healthItems(animal: {
  vaccinationsUpToDate: boolean;
  neutered: boolean;
  microchipped: boolean;
  tickFleaPreventionActive: boolean;
}) {
  return [
    animal.vaccinationsUpToDate ? "Vaccinations up to date" : null,
    animal.neutered ? "Neutered" : null,
    animal.microchipped ? "Microchipped" : null,
    animal.tickFleaPreventionActive ? "Tick/Flea prevention active" : null,
  ].filter((item): item is string => Boolean(item));
}

async function getAnimal(slug: string) {
  return prisma.animal.findFirst({
    where: {
      slug,
      status: AnimalStatus.AVAILABLE,
      shelter: {
        status: ShelterStatus.APPROVED,
      },
    },
    include: {
      shelter: true,
    },
  });
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const [animal, branding] = await Promise.all([getAnimal(slug), getPublicBranding()]);
  const siteName = branding.siteName ?? defaultSiteName;

  if (!animal) {
    return {
      title: `Animal Not Found | ${siteName}`,
    };
  }

  const title = `${animal.name} is available for adoption | ${siteName}`;
  const description = animal.summary ?? animal.description ?? `Meet ${animal.name} from ${animal.shelter.name}.`;
  const url = `${siteUrl}/animals/${animal.slug}`;
  const image = animal.profileImageUrl ?? fallbackPhoto;

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      images: [image],
      siteName,
      type: "website",
    },
  };
}

export default async function AnimalProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [animal, branding] = await Promise.all([getAnimal(slug), getPublicBranding()]);

  if (!animal) notFound();

  await recordAnimalProfileView({
    animalId: animal.id,
    shelterId: animal.shelterId,
    slug: animal.slug,
  });

  const photos = [animal.profileImageUrl ?? fallbackPhoto, ...animal.imageUrls].filter((photo): photo is string => Boolean(photo));
  const profileUrl = `${siteUrl}/animals/${animal.slug}`;
  const shareText = `${animal.name} is looking for a home through ${animal.shelter.name}.`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
  const instagramUrl = "https://www.instagram.com/";
  const medicalItems = healthItems(animal);

  return (
    <>
      <ScrollToTop />
      <PublicHeader active="adopt" branding={branding} />
      <main className="profile-shell">
        <section className="profile-page-inner">
          <div className="profile-intro-row">
            <div>
              <nav className="profile-breadcrumb" aria-label="Breadcrumb">
                <Link href="/" className="profile-breadcrumb-home">
                  <HomeIcon />
                  Home
                </Link>
                <span aria-hidden="true"><ChevronIcon /></span>
                <Link href={`/?species=${encodeURIComponent(displayEnum(animal.species))}#animals`}>{displayEnum(animal.species)}s</Link>
                <span aria-hidden="true"><ChevronIcon /></span>
                <strong>{animal.name}</strong>
              </nav>

              <header className="profile-title-row">
                <div>
                  <h1>Meet {animal.name}</h1>
                  <p>
                    <MapPinIcon />
                    <Link href={`/shelters/${animal.shelter.slug}`} prefetch={false}>{animal.shelter.name}</Link>
                    <span>·</span>
                    <span>{animal.suburb ?? animal.shelter.suburb ?? animal.city}</span>
                  </p>
                </div>
              </header>
            </div>
          </div>

          <div className="profile-main-grid">
          <div className="profile-left-column">
            <div className="profile-gallery-card">
              <PhotoViewer animalName={animal.name} photos={photos} />
              <span className="availability-pill">
                <span></span>
                Available Now
              </span>
            </div>

            <article className="profile-info-panel">
              <h2>About {animal.name}</h2>
              {animal.traits.length ? (
                <div className="profile-about-traits">
                  {animal.traits.map((trait) => (
                    <span key={trait}>{trait}</span>
                  ))}
                </div>
              ) : null}
              <p>{animal.description ?? animal.summary ?? "The shelter has not added a longer profile yet."}</p>
            </article>

            {medicalItems.length ? (
              <article className="profile-health-panel">
                <h2>Health & Medical</h2>
                <div className="profile-health-grid">
                  {medicalItems.map((item) => (
                    <div key={item}>
                      <span>✓</span>
                      <strong>{item}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ) : null}
          </div>

          <aside className="profile-right-column">
            <section className="profile-action-card">
              <div className="profile-fact-grid" aria-label={`${animal.name} facts`}>
                <div>
                  <span className="fact-icon"><FactIcon type="breed" /></span>
                  <small>Breed</small>
                  <strong>{animal.breed ?? "Mixed breed"}</strong>
                </div>
                <div>
                  <span className="fact-icon"><FactIcon type="age" /></span>
                  <small>Age</small>
                  <strong>{formatAge(animal.ageMonths)}</strong>
                </div>
                <div>
                  <span className="fact-icon"><FactIcon type="gender" /></span>
                  <small>Gender</small>
                  <strong>{displayEnum(animal.sex)}</strong>
                </div>
              </div>

              <ProfileEnquiry animalId={animal.id} animalName={animal.name} shelterName={animal.shelter.name} />
              <p className="reply-note">Typically replies within 24 hours.</p>
              <div className="profile-share-panel profile-card-share" aria-label={`Share ${animal.name}`}>
                <span className="profile-share-kicker"><ShareGlyph /> Share</span>
                <div className="profile-title-actions">
                  <a href={facebookUrl} target="_blank" rel="noreferrer" className="facebook" aria-label={`Share ${animal.name} on Facebook`}>
                    <span><SocialIcon platform="facebook" /></span>
                  </a>
                  <a href={instagramUrl} target="_blank" rel="noreferrer" className="instagram" aria-label={`Open Instagram to share ${animal.name}`}>
                    <span><SocialIcon platform="instagram" /></span>
                  </a>
                  <a href={whatsappUrl} target="_blank" rel="noreferrer" className="whatsapp" aria-label={`Share ${animal.name} on WhatsApp`}>
                    <span><SocialIcon platform="whatsapp" /></span>
                  </a>
                </div>
              </div>
            </section>

            <section className="profile-shelter-card">
              <h2>Cared for by</h2>
              <div className="profile-shelter-card-header">
                <span className="shelter-building-icon"><BuildingIcon /></span>
                <div>
                  <h3>
                    <Link href={`/shelters/${animal.shelter.slug}`} prefetch={false}>{animal.shelter.name}</Link>
                  </h3>
                  <p className="profile-shelter-location"><MapPinIcon />{animal.shelter.suburb ?? animal.suburb ?? "Cape Town"}, {animal.shelter.city}</p>
                </div>
              </div>
              <p>{animal.shelter.bio ?? `${animal.shelter.name} manages rescue animals looking for suitable homes across the Western Cape.`}</p>
              <Link className="profile-shelter-profile-link" href={`/shelters/${animal.shelter.slug}`} prefetch={false}>
                View all animals at this shelter
                <ArrowRightIcon />
              </Link>
            </section>

          </aside>
          </div>
        </section>
      </main>
      <PublicFooter branding={branding} />
    </>
  );
}
