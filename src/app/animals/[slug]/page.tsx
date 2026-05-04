import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PhotoViewer } from "@/app/photo-viewer";
import { AnimalStatus, ShelterStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";

import { ProfileEnquiry } from "./profile-enquiry";

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
  const animal = await getAnimal(slug);

  if (!animal) {
    return {
      title: "Animal Not Found | Paws of Cape Town",
    };
  }

  const title = `${animal.name} is available for adoption | Paws of Cape Town`;
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
      siteName: "Paws of Cape Town",
      type: "website",
    },
  };
}

export default async function AnimalProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const animal = await getAnimal(slug);

  if (!animal) notFound();

  const photos = [animal.profileImageUrl ?? fallbackPhoto, ...animal.imageUrls].filter((photo): photo is string => Boolean(photo));
  const profileUrl = `${siteUrl}/animals/${animal.slug}`;
  const shareText = `${animal.name} is looking for a home through ${animal.shelter.name}.`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${profileUrl}`)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;

  return (
    <main className="profile-shell">
      <header className="profile-nav">
        <Link href="/" className="dashboard-back">
          Back to search
        </Link>
        <Link href="/shelter" className="profile-shelter-link">
          Shelter Login
        </Link>
      </header>

      <section className="profile-hero">
        <div className="profile-photo">
          <PhotoViewer animalName={animal.name} photos={photos} />
          {animal.isUrgent ? <span className="badge urgent">Urgent</span> : null}
        </div>
        <div className="profile-summary">
          <p className="profile-kicker">{animal.shelter.name} · {animal.suburb ?? animal.shelter.suburb ?? animal.city}</p>
          <h1>{animal.name}</h1>
          <p className="profile-lede">{animal.summary ?? "Contact the shelter to learn more about this animal."}</p>

          <div className="profile-facts" aria-label={`${animal.name} facts`}>
            <span>{displayEnum(animal.species)}</span>
            <span>{animal.breed ?? "Mixed breed"}</span>
            <span>{formatAge(animal.ageMonths)}</span>
            <span>{displayEnum(animal.sex)}</span>
            <span>{displayEnum(animal.size)}</span>
          </div>

          {animal.traits.length ? (
            <div className="profile-traits">
              {animal.traits.map((trait) => (
                <span key={trait}>{trait}</span>
              ))}
            </div>
          ) : null}

          <div className="profile-share">
            <a href={whatsappUrl} target="_blank" rel="noreferrer">
              Share on WhatsApp
            </a>
            <a href={facebookUrl} target="_blank" rel="noreferrer">
              Share on Facebook
            </a>
          </div>
        </div>
      </section>

      <section className="profile-content">
        <article>
          <h2>About {animal.name}</h2>
          <p>{animal.description ?? animal.summary ?? "The shelter has not added a longer profile yet."}</p>
        </article>
        <aside>
          <ProfileEnquiry animalId={animal.id} animalName={animal.name} shelterName={animal.shelter.name} />
        </aside>
      </section>
    </main>
  );
}
