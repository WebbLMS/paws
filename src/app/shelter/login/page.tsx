import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/active-shelter";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

export default async function ShelterLoginPage() {
  const session = await getCurrentSession();

  if (session) {
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
        <LoginForm />
      </section>
    </main>
  );
}
