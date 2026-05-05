import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimalSize, AnimalStatus, Sex, Species } from "@/generated/prisma/enums";
import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";
import { prisma } from "@/lib/prisma";

import { updateAnimalListing } from "../../../actions";
import { PhotoUploadField } from "../../photo-upload-field";
import { popularAnimalTraits } from "../../trait-options";
import { ShelterPortalShell } from "../../../portal-shell";

export const dynamic = "force-dynamic";

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default async function EditAnimalPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session, shelter] = await Promise.all([params, getCurrentSession(), getActiveShelter()]);

  if (!session) {
    redirect("/shelter/login");
  }

  const animal = shelter
    ? await prisma.animal.findFirst({
        where: {
          id,
          shelterId: shelter.id,
        },
        include: {
          _count: {
            select: {
              profileViews: true,
            },
          },
          profileViews: {
            orderBy: {
              createdAt: "desc",
            },
            take: 5,
          },
          enquiries: {
            orderBy: {
              createdAt: "desc",
            },
            include: {
              notes: {
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
              },
              events: {
                orderBy: {
                  createdAt: "desc",
                },
                take: 1,
              },
            },
          },
        },
      })
    : null;

  if (!shelter || !animal) {
    return (
      <main className="dashboard-shell">
        <section className="dashboard-empty">
          <h1>Listing not found</h1>
          <p>This animal is not available for the active shelter.</p>
          <Link href="/shelter" className="empty-link">
            Back to dashboard
          </Link>
        </section>
      </main>
    );
  }

  const traitOptions = [
    ...popularAnimalTraits,
    ...animal.traits.filter((trait) => !popularAnimalTraits.some((option) => option.toLowerCase() === trait.toLowerCase())),
  ];

  return (
    <ShelterPortalShell shelter={shelter} active="animals">
      <section className="portal-form-page animal-management-page">
        <Link href="/shelter/animals" className="dashboard-back">
          Back to My Animals
        </Link>
        <div className="form-card">
          <div className="form-heading split-heading">
            <div>
              <h1>Edit {animal.name}</h1>
              <p>Manage the listing details and adoption availability for {shelter.name}.</p>
            </div>
            <div className="animal-admin-stats">
              <span className="status-pill">{displayEnum(animal.status)}</span>
              <span className="status-pill">{animal._count.profileViews} views</span>
            </div>
          </div>

          <form action={updateAnimalListing} className="listing-form">
            <input type="hidden" name="animalId" value={animal.id} />

            <div className="form-grid">
              <label>
                <span>Name</span>
                <input name="name" required defaultValue={animal.name} />
              </label>
              <label>
                <span>Status</span>
                <select name="status" required defaultValue={animal.status}>
                  <option value={AnimalStatus.DRAFT}>Draft</option>
                  <option value={AnimalStatus.AVAILABLE}>Available</option>
                  <option value={AnimalStatus.RESERVED}>Reserved</option>
                  <option value={AnimalStatus.ADOPTED}>Adopted</option>
                  <option value={AnimalStatus.ARCHIVED}>Archived</option>
                </select>
              </label>
              <label>
                <span>Species</span>
                <select name="species" required defaultValue={animal.species}>
                  <option value={Species.DOG}>Dog</option>
                  <option value={Species.CAT}>Cat</option>
                  <option value={Species.RABBIT}>Rabbit</option>
                  <option value={Species.BIRD}>Bird</option>
                  <option value={Species.OTHER}>Other</option>
                </select>
              </label>
              <label>
                <span>Breed</span>
                <input name="breed" defaultValue={animal.breed ?? ""} placeholder="Mixed breed" />
              </label>
              <label>
                <span>Age in Months</span>
                <input name="ageMonths" type="number" min="0" defaultValue={animal.ageMonths ?? ""} />
              </label>
              <label>
                <span>Sex</span>
                <select name="sex" required defaultValue={animal.sex}>
                  <option value={Sex.UNKNOWN}>Unknown</option>
                  <option value={Sex.MALE}>Male</option>
                  <option value={Sex.FEMALE}>Female</option>
                </select>
              </label>
              <label>
                <span>Size</span>
                <select name="size" required defaultValue={animal.size}>
                  <option value={AnimalSize.UNKNOWN}>Unknown</option>
                  <option value={AnimalSize.SMALL}>Small</option>
                  <option value={AnimalSize.MEDIUM}>Medium</option>
                  <option value={AnimalSize.LARGE}>Large</option>
                  <option value={AnimalSize.EXTRA_LARGE}>Extra Large</option>
                </select>
              </label>
              <label>
                <span>Suburb</span>
                <input name="suburb" defaultValue={animal.suburb ?? ""} placeholder={shelter.suburb ?? "Cape Town"} />
              </label>
            </div>

            <div className="wide-field">
              <div className="field-heading">
                <span>Traits</span>
                <em>Select the qualities adopters commonly filter for. Existing custom traits are kept below.</em>
              </div>
              <div className="trait-select-grid">
                {traitOptions.map((trait) => (
                  <label className="trait-select-chip" key={trait}>
                    <input
                      name="traits"
                      type="checkbox"
                      value={trait}
                      defaultChecked={animal.traits.some((selectedTrait) => selectedTrait.toLowerCase() === trait.toLowerCase())}
                    />
                    <span>{trait}</span>
                  </label>
                ))}
              </div>
            </div>
            <label>
              <span>Summary</span>
              <input name="summary" defaultValue={animal.summary ?? ""} placeholder="A short public card description." />
            </label>
            <label>
              <span>Description</span>
              <textarea
                name="description"
                rows={5}
                defaultValue={animal.description ?? ""}
                placeholder="Longer notes for the animal profile."
              />
            </label>

            <div className="wide-field">
              <div className="field-heading">
                <span>Health & Medical</span>
                <em>These show on the public animal profile and can be used as search filters.</em>
              </div>
              <div className="health-checkbox-grid">
                <label className="checkbox-row">
                  <input name="vaccinationsUpToDate" type="checkbox" defaultChecked={animal.vaccinationsUpToDate} />
                  <span>Vaccinations up to date</span>
                </label>
                <label className="checkbox-row">
                  <input name="neutered" type="checkbox" defaultChecked={animal.neutered} />
                  <span>Neutered</span>
                </label>
                <label className="checkbox-row">
                  <input name="microchipped" type="checkbox" defaultChecked={animal.microchipped} />
                  <span>Microchipped</span>
                </label>
                <label className="checkbox-row">
                  <input name="tickFleaPreventionActive" type="checkbox" defaultChecked={animal.tickFleaPreventionActive} />
                  <span>Tick/Flea prevention active</span>
                </label>
              </div>
            </div>

            <label className="checkbox-row">
              <input name="isUrgent" type="checkbox" defaultChecked={animal.isUrgent} />
              <span>Mark as urgent</span>
            </label>

            <div className="wide-field compact-photo-field">
              <div className="field-heading">
                <span>Animal Photos</span>
                <em>Keep this tight: upload photos, remove weak images, and set the card/profile primary.</em>
              </div>
              <PhotoUploadField
                existingPhotos={[animal.profileImageUrl, ...animal.imageUrls]
                  .filter((photo): photo is string => Boolean(photo))
                  .map((url) => ({
                    url,
                    isPrimary: url === animal.profileImageUrl,
                  }))}
              />
            </div>

            <div className="form-actions">
              <Link href="/shelter/animals">Cancel</Link>
              <button type="submit">Save Changes</button>
            </div>
          </form>
        </div>

        <article className="dashboard-panel animal-activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Activity</h2>
              <p>Enquiries, profile views, and latest CRM movement for this animal.</p>
            </div>
            <span className="status-pill">{animal.enquiries.length} enquiries · {animal._count.profileViews} views</span>
          </div>

          {animal.profileViews.length ? (
            <div className="animal-view-strip">
              {animal.profileViews.map((view) => (
                <div key={view.id}>
                  <strong>Profile view</strong>
                  <span>{formatDate(view.createdAt)}</span>
                </div>
              ))}
            </div>
          ) : null}

          {animal.enquiries.length ? (
            <div className="animal-activity-list">
              {animal.enquiries.map((enquiry) => {
                const latestEvent = enquiry.events[0];
                const latestNote = enquiry.notes[0];

                return (
                  <div className="animal-activity-item" key={enquiry.id}>
                    <div>
                      <span className="status-pill">{displayEnum(enquiry.status)}</span>
                      <h3>{enquiry.name}</h3>
                      <p>{enquiry.message ?? "No enquiry message supplied."}</p>
                    </div>
                    <dl>
                      <div>
                        <dt>Email</dt>
                        <dd>
                          <a href={`mailto:${enquiry.email}`}>{enquiry.email}</a>
                        </dd>
                      </div>
                      <div>
                        <dt>Phone</dt>
                        <dd>{enquiry.phone ? <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a> : "Not supplied"}</dd>
                      </div>
                      <div>
                        <dt>Received</dt>
                        <dd>{formatDate(enquiry.createdAt)}</dd>
                      </div>
                      <div>
                        <dt>Latest CRM</dt>
                        <dd>
                          {latestNote
                            ? `${latestNote.author}: ${latestNote.body}`
                            : latestEvent
                              ? `${latestEvent.actor}: ${displayEnum(latestEvent.toStatus)}`
                              : "No internal activity yet"}
                        </dd>
                      </div>
                    </dl>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="panel-empty">No enquiries for this animal yet.</div>
          )}
        </article>
      </section>
    </ShelterPortalShell>
  );
}
