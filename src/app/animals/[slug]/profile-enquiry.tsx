"use client";

import { useActionState, useState } from "react";

import { createAdoptionEnquiry, type EnquiryResult } from "../../actions";

type ProfileEnquiryProps = {
  animalId: string;
  animalName: string;
  shelterName: string;
};

export function ProfileEnquiry({ animalId, animalName, shelterName }: ProfileEnquiryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, action, isSubmitting] = useActionState<EnquiryResult, FormData>(createAdoptionEnquiry, {
    ok: false,
    message: "",
  });

  return (
    <>
      <button type="button" className="profile-enquire-button" onClick={() => setIsOpen(true)}>
        Enquire to Adopt
      </button>

      {isOpen ? (
        <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsOpen(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="profile-enquiry-title" onMouseDown={(event) => event.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2 id="profile-enquiry-title">Enquire About {animalName}</h2>
                <p>Your message goes directly into {shelterName}&apos;s shelter dashboard.</p>
              </div>
              <button type="button" aria-label="Close enquiry form" onClick={() => setIsOpen(false)}>
                ×
              </button>
            </div>

            {state.ok ? (
              <div className="enquiry-success">
                <h3>Enquiry Sent</h3>
                <p>{state.message}</p>
                <button type="button" onClick={() => setIsOpen(false)}>Done</button>
              </div>
            ) : (
              <form action={action} className="enquiry-form">
                <input type="hidden" name="animalId" value={animalId} />
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
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
