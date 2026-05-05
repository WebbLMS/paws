import Link from "next/link";
import { redirect } from "next/navigation";

import { getAdminSession } from "@/lib/admin-auth";

import { loginAdmin } from "../actions";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const [session, params] = await Promise.all([getAdminSession(), searchParams]);

  if (session) {
    redirect("/admin");
  }

  return (
    <main className="admin-login-shell">
      <section className="admin-login-card">
        <Link href="/" className="dashboard-back">
          Back to site
        </Link>
        <div className="admin-login-mark">✓</div>
        <h1>Admin</h1>
        <p>Platform controls for shelter approvals, listings, and operational health.</p>
        {params.error ? <div className="admin-login-error">Invalid admin username or password.</div> : null}
        <form action={loginAdmin} className="admin-login-form">
          <label>
            <span>Username</span>
            <input name="username" required autoComplete="username" defaultValue="admin" />
          </label>
          <label>
            <span>Password</span>
            <input name="password" type="password" required autoComplete="current-password" />
          </label>
          <button type="submit">Sign In</button>
        </form>
      </section>
    </main>
  );
}
