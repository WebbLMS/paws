import Link from "next/link";
import type { ReactNode } from "react";

import { ShelterStatus } from "@/generated/prisma/enums";
import type { getAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

type AdminSession = NonNullable<Awaited<ReturnType<typeof getAdminSession>>>;

type AdminShellProps = {
  active?: "overview" | "shelters" | "users" | "activity" | "settings";
  children: ReactNode;
  session: AdminSession;
};

function AdminIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M12 3l7 3v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3z" />
      <path d="M9 12l2 2 4-5" />
    </svg>
  );
}

export async function AdminShell({ active = "overview", children }: AdminShellProps) {
  const pendingShelters = await prisma.shelter.count({
    where: {
      status: ShelterStatus.PENDING,
    },
  });

  return (
    <main className="admin-shell">
      <aside className="admin-sidebar">
        <Link href="/admin" className="admin-brand">
          <span>
            <AdminIcon />
          </span>
          <div>
            <strong>Admin</strong>
            <em>Paws of Cape Town</em>
          </div>
        </Link>

        <nav className="admin-nav" aria-label="Admin navigation">
          <p>Overview</p>
          <Link className={active === "overview" ? "active" : ""} href="/admin">Dashboard</Link>
          <p>Management</p>
          <Link className={active === "shelters" ? "active" : ""} href="/admin/shelters">
            Shelters {pendingShelters > 0 ? <span>{pendingShelters}</span> : null}
          </Link>
          <Link className={active === "users" ? "active" : ""} href="/admin/users">
            Users
          </Link>
          <p>System</p>
          <Link className={active === "activity" ? "active" : ""} href="/admin/activity">
            Platform Activity
          </Link>
          <Link className={active === "settings" ? "active" : ""} href="/admin/settings">
            Global Settings
          </Link>
        </nav>
      </aside>

      <section className="admin-main">
        <header className="admin-topbar">
          <form className="admin-search" action="/admin/search">
            <input name="q" type="search" placeholder="Global search for shelters, animals, or users..." />
            <button type="submit">Search</button>
          </form>
          <nav className="admin-exit-nav" aria-label="Exit admin">
            <Link href="/">Home</Link>
            <a href="/admin/logout">Logout</a>
          </nav>
        </header>

        {children}
      </section>
    </main>
  );
}
