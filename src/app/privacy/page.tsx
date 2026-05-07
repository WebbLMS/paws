import type { Metadata } from "next";
import Link from "next/link";

import { PublicFooter, PublicHeader } from "@/app/public-chrome";
import { ScrollToTop } from "@/app/scroll-to-top";
import { defaultSiteName } from "@/lib/branding";
import { getPublicBranding } from "@/lib/platform-settings";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const branding = await getPublicBranding();
  const siteName = branding.siteName ?? defaultSiteName;

  return {
    title: `Privacy Policy | ${siteName}`,
    description: `How ${siteName} handles personal information under South African privacy law.`,
  };
}

export default async function PrivacyPage() {
  const branding = await getPublicBranding();

  return (
    <>
      <ScrollToTop />
      <PublicHeader branding={branding} />
      <main className="legal-page">
        <section className="legal-hero">
          <p className="eyebrow">Privacy Policy</p>
          <h1>Your information stays for platform use</h1>
          <p>
            This policy explains how PAWS handles personal information when people search, enquire, create alerts, or
            manage shelter listings.
          </p>
          <span>Last updated: 04 May 2026</span>
        </section>

        <section className="legal-grid" aria-label="Privacy Policy">
          <article className="legal-card">
            <h2>What we collect</h2>
            <p>
              PAWS may collect contact details, enquiry messages, shelter account details, animal listing content, photos,
              and basic usage or analytics data needed to run and improve the platform.
            </p>
          </article>

          <article className="legal-card">
            <h2>How we use it</h2>
            <ul>
              <li>Send adoption enquiries to the shelter or rescue responsible for the animal.</li>
              <li>Manage shelter accounts, listings, alerts, and platform administration.</li>
              <li>Keep the platform secure, diagnose issues, and understand how the service is used.</li>
              <li>Comply with legal obligations under South African law.</li>
            </ul>
          </article>

          <article className="legal-card">
            <h2>Who receives it</h2>
            <p>
              If you enquire about an animal, your enquiry details are shared with the listed shelter so they can respond
              directly. PAWS is not a shelter or rescue and does not handle animal enquiries or placements.
            </p>
            <p>
              Information is not resold. We only share it with relevant shelters, service providers that help operate the
              platform, or where required by law.
            </p>
          </article>

          <article className="legal-card">
            <h2>Your POPIA rights</h2>
            <p>
              Under the Protection of Personal Information Act, 2013 (POPIA), you may request access to, correction of,
              or deletion of your personal information, subject to lawful retention requirements.
            </p>
            <p>
              You may also object to certain processing or lodge a complaint with{" "}
              <Link href="https://inforegulator.org.za/" target="_blank" rel="noreferrer">
                South Africa&apos;s Information Regulator
              </Link>{" "}
              if you believe your information has not been handled correctly.
            </p>
          </article>
        </section>
      </main>
      <PublicFooter branding={branding} />
    </>
  );
}
