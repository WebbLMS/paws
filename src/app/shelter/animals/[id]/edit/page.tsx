import Link from "next/link";
import { redirect } from "next/navigation";

import { AnimalSize, AnimalStatus, Sex, Species } from "@/generated/prisma/enums";
import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";
import { prisma } from "@/lib/prisma";
import { PhotoViewer } from "@/app/photo-viewer";

import { updateAnimalListing } from "../../../actions";

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

  return (
    <main className="dashboard-shell">
      <section className="form-page animal-management-page">
        <Link href="/shelter" className="dashboard-back">
          Back to dashboard
        </Link>
        <div className="form-card">
          <div className="form-heading split-heading">
            <div>
              <h1>Edit {animal.name}</h1>
              <p>Manage the listing details and adoption availability for {shelter.name}.</p>
            </div>
            <span className="status-pill">{displayEnum(animal.status)}</span>
          </div>

          <form action={updateAnimalListing} className="listing-form">
            <input type="hidden" name="animalId" value={animal.id} />

            <div className="photo-management-grid">
              <PhotoViewer animalName={animal.name} photos={[animal.profileImageUrl, ...animal.imageUrls].filter((photo): photo is string => Boolean(photo))} />
              <div className="photo-fields">
                <label>
                  <span>Primary Photo URL</span>
                  <input
                    name="profileImageUrl"
                    type="url"
                    defaultValue={animal.profileImageUrl ?? ""}
                    placeholder="https://images.unsplash.com/..."
                  />
                </label>
                <label>
                  <span>Additional Photo URLs</span>
                  <textarea
                    name="imageUrls"
                    rows={7}
                    defaultValue={animal.imageUrls.join("\n")}
                    placeholder="One photo URL per line. Remove a line to delete that photo."
                  />
                </label>
              </div>
            </div>

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

            <label>
              <span>Traits</span>
              <input name="traits" defaultValue={animal.traits.join(", ")} placeholder="Gentle, playful, good with kids" />
            </label>
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
            <label className="checkbox-row">
              <input name="isUrgent" type="checkbox" defaultChecked={animal.isUrgent} />
              <span>Mark as urgent</span>
            </label>

            <div className="form-actions">
              <Link href="/shelter">Cancel</Link>
              <button type="submit">Save Changes</button>
            </div>
          </form>
        </div>

        <article className="dashboard-panel animal-activity-panel">
          <div className="panel-heading">
            <div>
              <h2>Activity</h2>
              <p>Enquiries and latest CRM movement for this animal.</p>
            </div>
            <span className="status-pill">{animal.enquiries.length} enquiries</span>
          </div>

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
    </main>
  );
}
