import Link from "next/link";

import { AnimalStatus } from "@/generated/prisma/enums";
import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { AdminShell } from "../admin-shell";
import { ClickableRow } from "../clickable-row";

export const dynamic = "force-dynamic";

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function parseStatus(value?: string) {
  return value && Object.values(AnimalStatus).includes(value as AnimalStatus) ? (value as AnimalStatus) : undefined;
}

export default async function AdminAnimalsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [session, params] = await Promise.all([requireAdminSession(), searchParams]);
  const status = parseStatus(params.status);
  const animals = await prisma.animal.findMany({
    where: status ? { status } : undefined,
    include: {
      shelter: true,
      _count: {
        select: {
          enquiries: true,
          profileViews: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
    take: 200,
  });

  return (
    <AdminShell session={session} active="overview">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>{status ? `${displayEnum(status)} Animals` : "Animals"}</h1>
            <p>Review animal listings across all shelters.</p>
          </div>
        </div>

        <article className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Animal</th>
                  <th>Status</th>
                  <th>Shelter</th>
                  <th>Enquiries</th>
                  <th>Views</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {animals.map((animal) => (
                  <ClickableRow href={`/animals/${animal.slug}`} tableRow key={animal.id}>
                    <td>
                      <span>{animal.name.slice(0, 2).toUpperCase()}</span>
                      <Link href={`/animals/${animal.slug}`}>{animal.name}</Link>
                    </td>
                    <td>{displayEnum(animal.status)}</td>
                    <td><Link href={`/admin/shelters/${animal.shelter.id}`}>{animal.shelter.name}</Link></td>
                    <td>{animal._count.enquiries}</td>
                    <td>{animal._count.profileViews}</td>
                    <td>
                      <Link className="table-action" href={`/animals/${animal.slug}`}>Public Profile</Link>
                    </td>
                  </ClickableRow>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </div>
    </AdminShell>
  );
}
