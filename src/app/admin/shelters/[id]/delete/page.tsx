import Link from "next/link";
import { notFound } from "next/navigation";

import { requireAdminSession } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

import { deleteShelter } from "../../../actions";
import { AdminShell } from "../../../admin-shell";

export const dynamic = "force-dynamic";

export default async function DeleteAdminShelterPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, session] = await Promise.all([params, requireAdminSession()]);
  const shelter = await prisma.shelter.findUnique({
    where: {
      id,
    },
    include: {
      _count: {
        select: {
          animals: true,
          enquiries: true,
          users: true,
        },
      },
    },
  });

  if (!shelter) notFound();

  return (
    <AdminShell session={session} active="shelters">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Delete Shelter and Listings</h1>
            <p>This permanently removes {shelter.name}, its animal listings, enquiries, and profile view records.</p>
          </div>
        </div>
        <article className="admin-panel admin-delete-panel">
          <form action={deleteShelter} className="admin-form">
            <input type="hidden" name="shelterId" value={shelter.id} />
            <p>
              Deleting this shelter deletes {shelter._count.animals} associated animal listings and {shelter._count.enquiries} enquiries. It also unlinks {shelter._count.users} users from this shelter.
            </p>
            <label>
              <span>Type DELETE to confirm</span>
              <input name="confirmation" required />
            </label>
            <div className="admin-form-actions">
              <Link href={`/admin/shelters/${shelter.id}`}>Cancel</Link>
              <button className="danger" type="submit">Delete Shelter</button>
            </div>
          </form>
        </article>
      </div>
    </AdminShell>
  );
}
