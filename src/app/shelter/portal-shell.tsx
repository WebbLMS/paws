import Link from "next/link";
import type { ReactNode } from "react";

import { SignOutButton } from "./sign-out-button";

function PawIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <ellipse cx="7.5" cy="10" rx="2.5" ry="3" />
      <ellipse cx="16.5" cy="10" rx="2.5" ry="3" />
      <ellipse cx="4" cy="5.5" rx="2" ry="2.5" />
      <ellipse cx="20" cy="5.5" rx="2" ry="2.5" />
      <path d="M12 20c-4 0-7-3-7-5.5S9 10 12 10s7 2 7 4.5S16 20 12 20z" />
    </svg>
  );
}

type PortalShelter = {
  city: string;
  name: string;
  suburb: string | null;
};

type ShelterPortalShellProps = {
  shelter: PortalShelter;
  active?: "dashboard" | "animals" | "enquiries" | "profile";
  enquiryCount?: number;
  children: ReactNode;
};

export function ShelterPortalShell({ shelter, active = "dashboard", enquiryCount = 0, children }: ShelterPortalShellProps) {
  return (
    <main className="portal-shell">
      <aside className="portal-sidebar">
        <Link href="/" className="portal-brand">
          <span>
            <PawIcon />
          </span>
          <strong>Paws of Cape Town</strong>
        </Link>

        <nav className="portal-nav" aria-label="Shelter navigation">
          <Link href="/shelter" className={active === "dashboard" ? "active" : ""}>
            <span>▦</span>
            Dashboard
          </Link>
          <Link href="/shelter/animals" className={active === "animals" ? "active" : ""}>
            <span>◌</span>
            My Animals
          </Link>
          <Link href="/shelter/enquiries" className={active === "enquiries" ? "active" : ""}>
            <span>✉</span>
            Enquiries
            {enquiryCount ? <em>{enquiryCount}</em> : null}
          </Link>
          <Link href="/shelter/enquiries" className="muted-link">
            <span>□</span>
            Messages
          </Link>
          <Link href="/shelter/profile" className={active === "profile" ? "active portal-nav-spaced" : "portal-nav-spaced"}>
            <span>◈</span>
            Shelter Profile
          </Link>
        </nav>

        <div className="portal-shelter-card">
          <div className="portal-building">▦</div>
          <div>
            <strong>{shelter.name}</strong>
            <span>{shelter.suburb ?? shelter.city}</span>
          </div>
        </div>
      </aside>

      <section className="portal-main">
        <header className="portal-top-actions" aria-label="Shelter account actions">
          <Link href="/">Home</Link>
          <SignOutButton />
        </header>
        {children}
      </section>
    </main>
  );
}
