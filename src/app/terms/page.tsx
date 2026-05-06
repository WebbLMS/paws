import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter, PublicHeader } from "@/app/public-chrome";
import { defaultSiteName } from "@/lib/branding";
import { getPublicBranding } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getPublicBranding();
  const siteName = branding.siteName ?? defaultSiteName;

  return {
    title: `Terms of Service | ${siteName}`,
    description: `Terms for using the ${siteName} animal adoption marketplace.`,
  };
}

export default async function TermsPage() {
  const branding = await getPublicBranding();
  const siteName = branding.siteName ?? defaultSiteName;

  return (
    <>
      <PublicHeader branding={branding} />
      <main className="legal-page">
        <section className="legal-hero">
          <p className="eyebrow">Terms of Service</p>
          <h1>Using {siteName}</h1>
          <p>
            These terms explain the basic rules for using PAWS as a public animal listing platform for Cape Town and the
            Western Cape.
          </p>
          <span>Last updated: 04 May 2026</span>
        </section>

        <section className="legal-grid" aria-label="Terms of Service">
          <article className="legal-card">
            <h2>PAWS is a listing platform</h2>
            <p>
              {siteName} is not a shelter, rescue organisation, adoption agency, veterinary provider, or animal
              placement service. PAWS does not own animals, assess adopters, approve applications, handle animal
              enquiries, or arrange placements.
            </p>
            <p>
              Animal profiles and shelter details are supplied by participating shelters and rescues. Enquiries are sent
              to the relevant shelter, and that shelter is responsible for responding and managing any adoption process.
            </p>
          </article>

          <article className="legal-card">
            <h2>Listings and availability</h2>
            <p>
              Shelters are responsible for keeping their listings accurate, lawful, and up to date. PAWS cannot
              guarantee that an animal is still available, suitable for a particular home, or described completely.
            </p>
            <p>
              Users should confirm all details directly with the shelter before relying on a listing or making adoption
              decisions.
            </p>
          </article>

          <article className="legal-card">
            <h2>User responsibilities</h2>
            <ul>
              <li>Provide accurate contact and enquiry information.</li>
              <li>Use the platform lawfully and respectfully.</li>
              <li>Do not scrape, copy, harass, spam, impersonate others, or interfere with the service.</li>
              <li>Do not upload misleading, unlawful, or unauthorised content.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>Privacy and South African law</h2>
            <p>
              Personal information is handled under South African law, including the Protection of Personal Information
              Act, 2013 (POPIA), where applicable. Read the <Link href="/privacy">Privacy Policy</Link> for the short
              version of what we collect and why.
            </p>
            <p>
              These terms are governed by the laws of the Republic of South Africa. Nothing on PAWS is legal,
              veterinary, welfare, or adoption advice.
            </p>
          </article>
        </section>
      </main>
      <PublicFooter branding={branding} />
    </>
  );
}
