"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

import { authClient } from "@/lib/auth-client";

export function SignOutButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      className="secondary"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await authClient.signOut();
          router.push("/shelter/login");
          router.refresh();
        });
      }}
    >
      {isPending ? "Signing Out..." : "Sign Out"}
    </button>
  );
}
