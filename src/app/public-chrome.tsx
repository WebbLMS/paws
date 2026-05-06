"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { authClient } from "@/lib/auth-client";

export type PublicBranding = {
  siteLogoUrl?: string | null;
  siteIconUrl?: string | null;
};

export function PawIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <ellipse cx="7.5" cy="10" rx="2.5" ry="3" />
      <ellipse cx="16.5" cy="10" rx="2.5" ry="3" />
      <ellipse cx="4" cy="5.5" rx="2" ry="2.5" />
      <ellipse cx="20" cy="5.5" rx="2" ry="2.5" />
      <path d="M12 20c-4 0-7-3-7-5.5S9 10 12 10s7 2 7 4.5S16 20 12 20z" />
    </svg>
  );
}

function BrandMark({ branding, size = 44 }: { branding?: PublicBranding; size?: number }) {
  if (branding?.siteLogoUrl) {
    return (
      <Image
        src={branding.siteLogoUrl}
        alt=""
        width={size}
        height={size}
        className="brand-logo-image"
        priority={size > 30}
      />
    );
  }

  return <PawIcon />;
}

export function PublicHeader({ active, branding }: { active?: "adopt" | "shelters"; branding?: PublicBranding }) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [isPending, startTransition] = useTransition();

  function signOut() {
    startTransition(async () => {
      await authClient.signOut();
      router.refresh();
    });
  }

  return (
    <header className="header">
      <div className="header-inner">
        <Link className="brand" href="/">
          <span className="brand-mark">
            <BrandMark branding={branding} />
          </span>
          <span>Paws of Cape Town</span>
        </Link>
        <nav className="nav" aria-label="Primary navigation">
          <Link href="/#animals" className={active === "adopt" ? "active-nav" : ""}>
            Adopt
          </Link>
          <Link href="/#shelters" className={active === "shelters" ? "active-nav" : ""}>
            Our Shelters
          </Link>
          {session ? (
            <>
              <Link href="/shelter">Shelter Dashboard</Link>
              <button type="button" onClick={signOut} disabled={isPending}>
                {isPending ? "Signing Out..." : "Log Out"}
              </button>
            </>
          ) : (
            <Link href="/shelter/login" className="nav-login">
              Shelter Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function PublicFooter({ branding }: { branding?: PublicBranding }) {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <div className="footer-brand">
            <span className="footer-brand-mark">
              <BrandMark branding={branding} size={24} />
            </span>
            <span>Paws of Cape Town</span>
          </div>
          <p>A centralised marketplace helping rescue animals across the Western Cape find suitable homes.</p>
        </div>
        <div>
          <h3>For the Public</h3>
          <Link href="/#animals">Search Animals</Link>
          <Link href="/#stories">Adoption Process</Link>
          <Link href="/#stories">Success Stories</Link>
          <Link href="/#stories">Foster an Animal</Link>
        </div>
        <div>
          <h3>For Shelters</h3>
          <Link href="/shelter/login">Shelter Login</Link>
          <Link href="/shelter/register">Partner With Us</Link>
          <Link href="/#shelters">Resources</Link>
          <Link href="/#shelters">Contact Support</Link>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2026 Paws of Cape Town. All rights reserved.</p>
        <div>
          <Link href="/privacy" scroll>
            Privacy Policy
          </Link>
          <Link href="/terms" scroll>
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
