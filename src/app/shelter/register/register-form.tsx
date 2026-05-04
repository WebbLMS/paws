"use client";

import Link from "next/link";
import { useActionState } from "react";

import { registerShelter, type EnquiryResult } from "@/app/actions";

export function RegisterShelterForm() {
  const [state, action, isPending] = useActionState<EnquiryResult, FormData>(registerShelter, {
    ok: false,
    message: "",
  });

  return (
    <form action={action} className="listing-form registration-form">
      <div className="form-grid">
        <label>
          <span>Shelter Name</span>
          <input name="shelterName" required placeholder="Cape Town Rescue" />
        </label>
        <label>
          <span>Shelter Email</span>
          <input name="shelterEmail" type="email" required placeholder="hello@shelter.org.za" />
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" placeholder="+27..." />
        </label>
        <label>
          <span>Suburb</span>
          <input name="suburb" placeholder="Grassy Park" />
        </label>
        <label>
          <span>City</span>
          <input name="city" defaultValue="Cape Town" />
        </label>
        <label>
          <span>Website</span>
          <input name="websiteUrl" type="url" placeholder="https://..." />
        </label>
        <label>
          <span>Facebook</span>
          <input name="facebookUrl" type="url" placeholder="https://facebook.com/..." />
        </label>
        <label>
          <span>Instagram</span>
          <input name="instagramUrl" type="url" placeholder="https://instagram.com/..." />
        </label>
      </div>

      <label>
        <span>Shelter Bio</span>
        <textarea name="bio" rows={4} placeholder="Briefly describe your rescue and adoption area." />
      </label>

      <div className="registration-section">
        <h2>Primary Contact</h2>
        <p>This person becomes the first shelter admin.</p>
      </div>

      <div className="form-grid">
        <label>
          <span>Name</span>
          <input name="primaryName" required placeholder="Primary contact name" />
        </label>
        <label>
          <span>Email</span>
          <input name="primaryEmail" type="email" required placeholder="admin@shelter.org.za" />
        </label>
        <label className="wide-field">
          <span>Password</span>
          <input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </label>
      </div>

      {state.message ? <p className="form-error">{state.message}</p> : null}

      <div className="form-actions">
        <Link href="/">Cancel</Link>
        <button type="submit" disabled={isPending}>
          {isPending ? "Creating..." : "Create Shelter"}
        </button>
      </div>
    </form>
  );
}
