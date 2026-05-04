"use client";

import { useActionState } from "react";

import { createAdoptionEnquiry, type EnquiryResult } from "../../actions";

type ProfileEnquiryProps = {
  animalId: string;
  animalName: string;
  shelterName: string;
};

export function ProfileEnquiry({ animalId, animalName, shelterName }: ProfileEnquiryProps) {
  const [state, action, isSubmitting] = useActionState<EnquiryResult, FormData>(createAdoptionEnquiry, {
    ok: false,
    message: "",
  });

  if (state.ok) {
    return (
      <div className="profile-enquiry-success">
        <h2>Enquiry Sent</h2>
        <p>{state.message}</p>
      </div>
    );
  }

  return (
    <form action={action} className="enquiry-form profile-enquiry-form">
      <input type="hidden" name="animalId" value={animalId} />
      <div>
        <h2>Enquire About {animalName}</h2>
        <p>Your message goes directly into {shelterName}&apos;s shelter dashboard.</p>
      </div>
      <label>
        <span>Your Name</span>
        <input name="name" required autoComplete="name" />
      </label>
      <label>
        <span>Email Address</span>
        <input name="email" type="email" required autoComplete="email" />
      </label>
      <label>
        <span>Phone Number</span>
        <input name="phone" type="tel" autoComplete="tel" />
      </label>
      <label>
        <span>Message</span>
        <textarea name="message" rows={5} placeholder="Tell the shelter about your home and why you could be a good match." />
      </label>
      {state.message ? <p className="form-error">{state.message}</p> : null}
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send Enquiry"}
      </button>
    </form>
  );
}
