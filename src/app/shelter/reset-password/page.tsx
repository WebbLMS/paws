import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

import { setPasswordFromResetToken, setRequiredPassword } from "./actions";

export const dynamic = "force-dynamic";

export default async function ShelterResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = params.token?.trim();
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: {
          id: session.user.id,
        },
        select: {
          passwordResetRequired: true,
          suspendedAt: true,
        },
      })
    : null;

  if (!token && (!session?.user?.id || !user?.passwordResetRequired || user.suspendedAt)) {
    redirect("/shelter/login");
  }

  return (
    <main className="dashboard-shell auth-shell">
      <section className="auth-layout">
        <div>
          <Link href="/shelter/login" className="dashboard-back">
            Back to login
          </Link>
          <h1>Set New Password</h1>
          <p>Choose a new password before continuing to the shelter dashboard.</p>
        </div>

        <div className="auth-card reset-password-card">
          <form action={token ? setPasswordFromResetToken : setRequiredPassword} className="listing-form auth-form">
            {token ? <input type="hidden" name="token" value={token} /> : null}
            <label>
              <span>New Password</span>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            <label>
              <span>Confirm Password</span>
              <input name="confirmPassword" type="password" required minLength={8} autoComplete="new-password" />
            </label>
            {params.error === "invalid-password" ? (
              <p className="form-error">Passwords must match and be at least 8 characters.</p>
            ) : null}
            {params.error === "invalid-token" ? (
              <p className="form-error">This reset link is invalid or has expired. Ask an admin to send a new one.</p>
            ) : null}
            <button type="submit">Set Password</button>
          </form>
        </div>
      </section>
    </main>
  );
}
