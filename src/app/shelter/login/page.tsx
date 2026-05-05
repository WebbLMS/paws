import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";

import { LoginForm } from "./login-form";
import { SignOutButton } from "../sign-out-button";

export const dynamic = "force-dynamic";

export default async function ShelterLoginPage() {
  const [session, shelter] = await Promise.all([getCurrentSession(), getActiveShelter()]);

  if (session && shelter) {
    redirect("/shelter");
  }

  return (
    <main className="dashboard-shell auth-shell">
      <section className="auth-layout">
        <div>
          <Link href="/" className="dashboard-back">
            Back to search
          </Link>
          <h1>Shelter Login</h1>
          <p>
            Sign in with your shelter&apos;s registered email. New accounts are linked automatically when the email matches a shelter record.
          </p>
        </div>
        {session ? (
          <div className="auth-card auth-session-card">
            <p className="form-error" role="alert">
              This signed-in account is not linked to a shelter. Sign out, then use the email address registered on the shelter record.
            </p>
            <SignOutButton />
          </div>
        ) : null}
        {!session ? <LoginForm /> : null}
      </section>
    </main>
  );
}
