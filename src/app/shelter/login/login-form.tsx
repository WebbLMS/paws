"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useActionState, useState, useTransition } from "react";

import { authClient } from "@/lib/auth-client";

import { requestPasswordResetEmail, type PasswordResetRequestResult } from "../reset-password/actions";

function isValidEmail(email: string) {
  const [localPart, domain] = email.split("@");

  if (!localPart || !domain || email.split("@").length !== 2) return false;
  if (localPart.startsWith(".") || localPart.endsWith(".") || localPart.includes("..")) return false;
  if (!domain.includes(".") || domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function getAuthErrorMessage(message: string | undefined, mode: "signin" | "signup") {
  if (!message) {
    return mode === "signin" ? "Could not sign in. Check the email and password." : "Could not create the account. Check the details and try again.";
  }

  const normalized = message.toLowerCase();

  if (normalized.includes("body.email") || normalized.includes("invalid email") || normalized.includes("email")) {
    return "Enter a valid shelter email address, for example adoptions@shelter.org.za.";
  }

  if (normalized.includes("password")) {
    return "Password must be at least 8 characters.";
  }

  return message;
}

export function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const [resetState, resetAction, isResetPending] = useActionState<PasswordResetRequestResult, FormData>(requestPasswordResetEmail, {
    ok: false,
    message: "",
  });

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");
    const name = String(formData.get("name") ?? "").trim();

    if (!isValidEmail(email)) {
      setError("Enter a valid shelter email address, for example adoptions@shelter.org.za.");
      return;
    }

    startTransition(async () => {
      const result =
        mode === "signin"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name });

      if (result.error) {
        setError(getAuthErrorMessage(result.error.message, mode === "signin" ? "signin" : "signup"));
        return;
      }

      router.push("/shelter");
      router.refresh();
    });
  }

  return (
    <div className="auth-card">
      <div className="auth-tabs" role="tablist" aria-label="Shelter authentication mode">
        <button type="button" className={mode === "signin" ? "active" : ""} onClick={() => { setMode("signin"); setError(""); }}>
          Sign In
        </button>
        <button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>
          Create Access
        </button>
      </div>

      {mode === "reset" ? (
        <form className="listing-form auth-form" action={resetAction}>
          <div className="auth-reset-heading">
            <h2>Reset Password</h2>
            <p>Enter your shelter account email and we will send a secure reset link.</p>
          </div>
          <label>
            <span>Shelter Email</span>
            <input name="email" type="email" required autoComplete="email" placeholder="adoptions@shelter.org.za" />
          </label>
          {resetState.message ? (
            <p className={resetState.ok ? "form-success" : "form-error"} role="alert">
              {resetState.message}
            </p>
          ) : null}
          <button type="submit" disabled={isResetPending}>
            {isResetPending ? "Sending..." : "Send Reset Email"}
          </button>
          <button type="button" className="auth-text-button" onClick={() => { setMode("signin"); setError(""); }}>
            Back to sign in
          </button>
        </form>
      ) : (
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
          {error ? <p className="form-error" role="alert">{error}</p> : null}
          <button type="submit" disabled={isPending}>
            {isPending ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
          </button>
          {mode === "signin" ? (
            <button type="button" className="auth-text-button" onClick={() => { setMode("reset"); setError(""); }}>
              Forgot password?
            </button>
          ) : null}
        </form>
      )}
    </div>
  );
}
