import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentSession } from "@/lib/active-shelter";

import { RegisterShelterForm } from "./register-form";

export const dynamic = "force-dynamic";

export default async function RegisterShelterPage() {
  const session = await getCurrentSession();

  if (session) {
    redirect("/shelter");
  }

  return (
    <main className="dashboard-shell">
      <section className="form-page registration-page">
        <Link href="/" className="dashboard-back">
          Back to search
        </Link>
        <div className="form-card">
          <div className="form-heading">
            <div>
              <h1>Register Shelter</h1>
              <p>Create the shelter record and first admin account. New shelters start pending review.</p>
            </div>
          </div>
          <RegisterShelterForm />
        </div>
      </section>
    </main>
  );
}
