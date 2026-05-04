"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    startTransition(async () => {
      const result =
        mode === "signin"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name });

      if (result.error) {
        setError(result.error.message ?? "Authentication failed.");
        return;
      }

      router.push("/shelter");
      router.refresh();
    });
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Shelter authentication mode">
        <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => setMode("signin")}>
          Sign In
        </button>
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => setMode("signup")}>
          Create Access
        </button>
      </div>

      <form className="listing-form auth-form" onSubmit={submit}>
        {mode === "signup" ? (
          <label>
            <span>Name</span>
            <input name="name" required autoComplete="name" placeholder="Shelter admin name" />
          </label>
        ) : null}
        <label>
          <span>Shelter Email</span>
          <input name="email" type="email" required autoComplete="email" placeholder="adoptions@shelter.org.za" />
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
        </label>
        {error ? <p className="form-error">{error}</p> : null}
        <button type="submit" disabled={isPending}>
          {isPending ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
        </button>
      </form>
    </div>
  );
}
