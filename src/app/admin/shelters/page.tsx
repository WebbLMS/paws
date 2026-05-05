import Link from "next/link";

import { ShelterStatus } from "@/generated/prisma/enums";
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
  return value && Object.values(ShelterStatus).includes(value as ShelterStatus) ? (value as ShelterStatus) : undefined;
}

export default async function AdminSheltersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const [session, params] = await Promise.all([requireAdminSession(), searchParams]);
  const status = parseStatus(params.status);
  const shelters = await prisma.shelter.findMany({
    where: status ? { status } : undefined,
    include: {
      _count: {
        select: {
          animals: true,
          enquiries: true,
          users: true,
        },
      },
    },
    orderBy: {
      updatedAt: "desc",
    },
  });

  return (
    <AdminShell session={session} active="shelters">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Shelters</h1>
            <p>{status ? `${displayEnum(status)} shelters.` : "Manage shelter records, public profile metadata, and approval status."}</p>
          </div>
          <Link className="admin-title-action" href="/admin/shelters/new">Add Shelter</Link>
        </div>

        <article className="admin-panel">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Shelter</th>
                  <th>Status</th>
                  <th>Users</th>
                  <th>Animals</th>
                  <th>Enquiries</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {shelters.map((shelter) => (
                  <ClickableRow href={`/admin/shelters/${shelter.id}`} tableRow key={shelter.id}>
                    <td>
                      <span>{shelter.name.slice(0, 2).toUpperCase()}</span>
                      <Link href={`/admin/shelters/${shelter.id}`}>{shelter.name}</Link>
                    </td>
                    <td>{displayEnum(shelter.status)}</td>
                    <td>{shelter._count.users}</td>
                    <td>{shelter._count.animals}</td>
                    <td>{shelter._count.enquiries}</td>
                    <td>
                      <Link className="table-action" href={`/admin/shelters/${shelter.id}/edit`}>Edit</Link>
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
