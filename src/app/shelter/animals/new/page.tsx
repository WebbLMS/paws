import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimalSize, Sex, Species } from "@/generated/prisma/enums";
import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";

import { createAnimalListing } from "../../actions";
import { ShelterPortalShell } from "../../portal-shell";
import { PhotoUploadField } from "../photo-upload-field";
import { popularAnimalTraits } from "../trait-options";

export const dynamic = "force-dynamic";

export default async function NewAnimalPage() {
  const [session, shelter] = await Promise.all([getCurrentSession(), getActiveShelter()]);

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

  return (
    <ShelterPortalShell shelter={shelter} active="animals">
      <section className="portal-form-page">
        <Link href="/shelter/animals" className="dashboard-back">
          Back to My Animals
        </Link>
        <div className="form-card">
          <div className="form-heading">
            <div>
              <h1>Add Animal</h1>
              <p>Create a listing for {shelter.name}.</p>
            </div>
          </div>

          <form action={createAnimalListing} className="listing-form">
            <div className="form-grid">
              <label>
                <span>Name</span>
                <input name="name" required placeholder="Luna" />
              </label>
              <label>
                <span>Species</span>
                <select name="species" required defaultValue={Species.DOG}>
                  <option value={Species.DOG}>Dog</option>
                  <option value={Species.CAT}>Cat</option>
                  <option value={Species.RABBIT}>Rabbit</option>
                  <option value={Species.BIRD}>Bird</option>
                  <option value={Species.OTHER}>Other</option>
                </select>
              </label>
              <label>
                <span>Breed</span>
                <input name="breed" placeholder="Mixed breed" />
              </label>
              <label>
                <span>Age in Months</span>
                <input name="ageMonths" type="number" min="0" placeholder="24" />
              </label>
              <label>
                <span>Sex</span>
                <select name="sex" required defaultValue={Sex.UNKNOWN}>
                  <option value={Sex.UNKNOWN}>Unknown</option>
                  <option value={Sex.MALE}>Male</option>
                  <option value={Sex.FEMALE}>Female</option>
                </select>
              </label>
              <label>
                <span>Size</span>
                <select name="size" required defaultValue={AnimalSize.UNKNOWN}>
                  <option value={AnimalSize.UNKNOWN}>Unknown</option>
                  <option value={AnimalSize.SMALL}>Small</option>
                  <option value={AnimalSize.MEDIUM}>Medium</option>
                  <option value={AnimalSize.LARGE}>Large</option>
                  <option value={AnimalSize.EXTRA_LARGE}>Extra Large</option>
                </select>
              </label>
              <label>
                <span>Suburb</span>
                <input name="suburb" placeholder={shelter?.suburb ?? "Cape Town"} />
              </label>
            </div>

            <div className="wide-field">
              <div className="field-heading">
                <span>Traits</span>
                <em>Select the qualities adopters commonly filter for. Keep it honest and specific.</em>
              </div>
              <div className="trait-select-grid">
                {popularAnimalTraits.map((trait) => (
                  <label className="trait-select-chip" key={trait}>
                    <input name="traits" type="checkbox" value={trait} />
                    <span>{trait}</span>
                  </label>
                ))}
              </div>
            </div>
            <label>
              <span>Summary</span>
              <input name="summary" placeholder="A short public card description." />
            </label>
            <label>
              <span>Description</span>
              <textarea name="description" rows={5} placeholder="Longer notes for the animal profile." />
            </label>

            <div className="wide-field">
              <div className="field-heading">
                <span>Health & Medical</span>
                <em>These show on the public animal profile and can be used as search filters.</em>
              </div>
              <div className="health-checkbox-grid">
                <label className="checkbox-row">
                  <input name="vaccinationsUpToDate" type="checkbox" />
                  <span>Vaccinations up to date</span>
                </label>
                <label className="checkbox-row">
                  <input name="neutered" type="checkbox" />
                  <span>Neutered</span>
                </label>
                <label className="checkbox-row">
                  <input name="microchipped" type="checkbox" />
                  <span>Microchipped</span>
                </label>
                <label className="checkbox-row">
                  <input name="tickFleaPreventionActive" type="checkbox" />
                  <span>Tick/Flea prevention active</span>
                </label>
              </div>
            </div>

            <label className="checkbox-row">
              <input name="isUrgent" type="checkbox" />
              <span>Mark as urgent</span>
            </label>

            <div className="wide-field compact-photo-field">
              <div className="field-heading">
                <span>Animal Photos</span>
                <em>Upload photos, then choose the primary image shown on public cards and profiles.</em>
              </div>
              <PhotoUploadField />
            </div>

            <div className="form-actions">
              <Link href="/shelter/animals">Cancel</Link>
              <button type="submit" disabled={!shelter}>Create Listing</button>
            </div>
          </form>
        </div>
      </section>
    </ShelterPortalShell>
  );
}
