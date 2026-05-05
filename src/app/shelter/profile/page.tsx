import Link from "next/link";
import { redirect } from "next/navigation";

import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";

import { updateShelterProfile } from "../actions";
import { ShelterPortalShell } from "../portal-shell";
import { ShelterImageUploadField } from "./shelter-image-upload-field";

export const dynamic = "force-dynamic";

export default async function ShelterProfileAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string | string[] }>;
}) {
  const [params, session, shelter] = await Promise.all([searchParams, getCurrentSession(), getActiveShelter()]);

  if (!session) {
    redirect("/shelter/login");
  }

  if (!shelter) {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-empty">
          <h1>No shelter access</h1>
          <p>This account is not linked to a shelter yet.</p>
        </section>
      </main>
    );
  }

  const saved = params.saved === "1";

  return (
    <ShelterPortalShell shelter={shelter} active="profile">
      <section className="portal-form-page shelter-profile-admin">
        <div className="portal-page-header">
          <div>
            <h1>Shelter Profile</h1>
            <p>Public profile details, website link, and rescue branding.</p>
          </div>
          <Link href={`/shelters/${shelter.slug}`} prefetch={false} className="portal-secondary-action">
            View Public Profile
          </Link>
        </div>

        {saved ? (
          <div className="dashboard-notice profile-saved-notice">
            <strong>Profile saved</strong>
            <p>Your public shelter profile has been updated.</p>
          </div>
        ) : null}

        <form action={updateShelterProfile} className="form-card listing-form">
          <div className="form-heading">
            <div>
              <h2>Public Information</h2>
              <p>These details appear on the shelter profile and animal pages.</p>
            </div>
          </div>

          <div className="form-grid">
            <label>
              <span>Shelter Name</span>
              <input name="name" required defaultValue={shelter.name} />
            </label>
            <label>
              <span>Public Email</span>
              <input name="email" type="email" required defaultValue={shelter.email} />
            </label>
            <label>
              <span>Phone</span>
              <input name="phone" defaultValue={shelter.phone ?? ""} />
            </label>
            <label>
              <span>Website URL</span>
              <input name="websiteUrl" type="url" defaultValue={shelter.websiteUrl ?? ""} placeholder="https://www.shelter.org.za" />
            </label>
            <label>
              <span>Suburb</span>
              <input name="suburb" defaultValue={shelter.suburb ?? ""} placeholder="Sunnydale" />
            </label>
            <label>
              <span>City</span>
              <input name="city" defaultValue={shelter.city} />
            </label>
            <label>
              <span>Province</span>
              <input name="province" defaultValue={shelter.province} />
            </label>
            <label>
              <span>NPO / Registration Number</span>
              <input name="registrationNumber" defaultValue={shelter.registrationNumber ?? ""} placeholder="NPO 044-882" />
            </label>
            <label>
              <span>Facebook URL</span>
              <input name="facebookUrl" type="url" defaultValue={shelter.facebookUrl ?? ""} />
            </label>
            <label>
              <span>Instagram URL</span>
              <input name="instagramUrl" type="url" defaultValue={shelter.instagramUrl ?? ""} />
            </label>
          </div>

          <label>
            <span>Shelter Bio</span>
            <textarea
              name="bio"
              rows={5}
              defaultValue={shelter.bio ?? ""}
              placeholder="Briefly explain your rescue, area, and adoption approach."
            />
          </label>

          <div className="wide-field shelter-branding-upload-grid">
            <ShelterImageUploadField
              name="coverImage"
              existingName="existingCoverImageUrl"
              label="Cover image"
              help="Wide banner used at the top of your public shelter profile."
              initialUrl={shelter.coverImageUrl}
              variant="cover"
            />
            <ShelterImageUploadField
              name="logoImage"
              existingName="existingLogoImageUrl"
              label="Logo / profile image"
              help="Square logo shown on profile cards, shelter pages, and partner lists."
              initialUrl={shelter.logoImageUrl}
              variant="logo"
            />
          </div>

          <div className="form-actions">
            <Link href="/shelter">Cancel</Link>
            <button type="submit">Save Profile</button>
          </div>
        </form>
      </section>
    </ShelterPortalShell>
  );
}
