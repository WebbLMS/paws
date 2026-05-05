import Link from "next/link";
import { redirect } from "next/navigation";

import { EnquiryStatus } from "@/generated/prisma/enums";
import { getActiveShelter, getCurrentSession } from "@/lib/active-shelter";
import { prisma } from "@/lib/prisma";

import { addEnquiryNote, updateEnquiryStatus } from "../actions";
import { ShelterPortalShell } from "../portal-shell";

export const dynamic = "force-dynamic";

const statusOptions = [
  { label: "All", value: "" },
  { label: "New", value: EnquiryStatus.NEW },
  { label: "Contacted", value: EnquiryStatus.CONTACTED },
  { label: "Approved", value: EnquiryStatus.APPROVED },
  { label: "Declined", value: EnquiryStatus.DECLINED },
  { label: "Closed", value: EnquiryStatus.CLOSED },
];

const quickStatuses = [EnquiryStatus.CONTACTED, EnquiryStatus.APPROVED, EnquiryStatus.DECLINED, EnquiryStatus.CLOSED];

function formatDate(date: Date) {
  return new Intl.DateTimeFormat("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseStatus(value: string | string[] | undefined) {
  if (typeof value !== "string") return null;
  return Object.values(EnquiryStatus).includes(value as EnquiryStatus) ? (value as EnquiryStatus) : null;
}

export default async function ShelterEnquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  const params = await searchParams;
  const activeStatus = parseStatus(params.status);
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

  const enquiries = await prisma.adoptionEnquiry.findMany({
    where: {
      shelterId: shelter.id,
      ...(activeStatus ? { status: activeStatus } : {}),
    },
    include: {
      animal: true,
      events: {
        orderBy: {
          createdAt: "desc",
        },
      },
      notes: {
        orderBy: {
          createdAt: "desc",
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  const newEnquiryCount = await prisma.adoptionEnquiry.count({
    where: {
      shelterId: shelter.id,
      status: EnquiryStatus.NEW,
    },
  });

  return (
    <ShelterPortalShell shelter={shelter} active="enquiries" enquiryCount={newEnquiryCount}>
      <section className="portal-form-page">
        <header className="dashboard-header">
          <div>
            <Link href="/shelter" className="dashboard-back">
              Back to dashboard
            </Link>
            <h1>Adoption Enquiries</h1>
            <p>{shelter.name} · {enquiries.length} enquiry{enquiries.length === 1 ? "" : "ies"}</p>
          </div>
        </header>

        <nav className="status-filter" aria-label="Enquiry status filter">
          {statusOptions.map((option) => {
            const href = option.value ? `/shelter/enquiries?status=${option.value}` : "/shelter/enquiries";
            const isActive = option.value === (activeStatus ?? "");

            return (
              <Link key={option.label} href={href} className={isActive ? "active" : ""}>
                {option.label}
              </Link>
            );
          })}
        </nav>

        <section className="enquiry-list">
          {enquiries.length ? (
            enquiries.map((enquiry) => (
              <article className="enquiry-card" id={`enquiry-${enquiry.id}`} key={enquiry.id}>
                <div className="enquiry-main">
                  <div>
                    <span className="status-pill">{displayEnum(enquiry.status)}</span>
                    <h2>{enquiry.animal.name}</h2>
                    <p>{enquiry.message ?? "No message supplied."}</p>
                  </div>
                  <dl>
                    <div>
                      <dt>Enquirer</dt>
                      <dd>{enquiry.name}</dd>
                    </div>
                    <div>
                      <dt>Email</dt>
                      <dd><a href={`mailto:${enquiry.email}`}>{enquiry.email}</a></dd>
                    </div>
                    <div>
                      <dt>Phone</dt>
                      <dd>{enquiry.phone ? <a href={`tel:${enquiry.phone}`}>{enquiry.phone}</a> : "Not supplied"}</dd>
                    </div>
                    <div>
                      <dt>Received</dt>
                      <dd>{formatDate(enquiry.createdAt)}</dd>
                    </div>
                  </dl>
                </div>
                <div className="enquiry-actions">
                  {quickStatuses.map((status) => (
                    <form action={updateEnquiryStatus} key={status}>
                      <input type="hidden" name="enquiryId" value={enquiry.id} />
                      <input type="hidden" name="status" value={status} />
                      <input type="hidden" name="currentFilter" value={activeStatus ?? ""} />
                      <button type="submit" disabled={enquiry.status === status}>
                        {displayEnum(status)}
                      </button>
                    </form>
                  ))}
                </div>
                <div className="crm-panel">
                  <form action={addEnquiryNote} className="note-form">
                    <input type="hidden" name="enquiryId" value={enquiry.id} />
                    <input type="hidden" name="currentFilter" value={activeStatus ?? ""} />
                    <label>
                      <span>Internal Note</span>
                      <textarea name="body" rows={3} placeholder="Add a call note, follow-up reminder, or adoption context." required />
                    </label>
                    <button type="submit">Add Note</button>
                  </form>

                  <div className="activity-log">
                    <h3>Activity</h3>
                    {enquiry.notes.length || enquiry.events.length ? (
                      <ol>
                        {[
                          ...enquiry.notes.map((note) => ({
                            id: note.id,
                            type: "note" as const,
                            createdAt: note.createdAt,
                            label: note.body,
                            actor: note.author,
                          })),
                          ...enquiry.events.map((event) => ({
                            id: event.id,
                            type: "status" as const,
                            createdAt: event.createdAt,
                            label: `${event.fromStatus ? displayEnum(event.fromStatus) : "Unset"} → ${displayEnum(event.toStatus)}`,
                            actor: event.actor,
                          })),
                        ]
                          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
                          .map((item) => (
                            <li key={`${item.type}-${item.id}`}>
                              <span>{item.type === "note" ? "Note" : "Status"}</span>
                              <strong>{item.label}</strong>
                              <small>{item.actor} · {formatDate(item.createdAt)}</small>
                            </li>
                          ))}
                      </ol>
                    ) : (
                      <p>No internal activity yet.</p>
                    )}
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="dashboard-empty">
              <h1>No enquiries found</h1>
              <p>Try a different status filter.</p>
            </div>
          )}
        </section>
      </section>
    </ShelterPortalShell>
  );
}
