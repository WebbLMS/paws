import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimalSize, Sex, Species } from "@/generated/prisma/enums";
import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";

import { createAnimalListing } from "../../actions";

export const dynamic = "force-dynamic";

export default async function NewAnimalPage() {
  const [session, shelter] = await Promise.all([getCurrentSession(), getActiveShelter()]);

  if (!session) {
    redirect("/shelter/login");
  }

  return (
    <main className="dashboard-shell">
      <section className="form-page">
        <Link href="/shelter" className="dashboard-back">
          Back to dashboard
        </Link>
        <div className="form-card">
          <div className="form-heading">
            <div>
              <h1>Add Animal</h1>
              <p>{shelter ? `Create a listing for ${shelter.name}.` : "This account is not linked to a shelter yet."}</p>
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
              <label>
                <span>Photo URL</span>
                <input name="profileImageUrl" type="url" placeholder="https://images.unsplash.com/..." />
              </label>
            </div>

            <label>
              <span>Additional Photo URLs</span>
              <textarea name="imageUrls" rows={4} placeholder="One photo URL per line." />
            </label>

            <label>
              <span>Traits</span>
              <input name="traits" placeholder="Gentle, playful, good with kids" />
            </label>
            <label>
              <span>Summary</span>
              <input name="summary" placeholder="A short public card description." />
            </label>
            <label>
              <span>Description</span>
              <textarea name="description" rows={5} placeholder="Longer notes for the animal profile." />
            </label>
            <label className="checkbox-row">
              <input name="isUrgent" type="checkbox" />
              <span>Mark as urgent</span>
            </label>

            <div className="form-actions">
              <Link href="/shelter">Cancel</Link>
              <button type="submit" disabled={!shelter}>Create Listing</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}
