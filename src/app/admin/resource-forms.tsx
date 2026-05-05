import Link from "next/link";

import { ShelterStatus, UserRole } from "@/generated/prisma/enums";

import { ShelterImageUploadField } from "../shelter/profile/shelter-image-upload-field";

type AdminShelterFormData = {
  id?: string;
  name?: string;
  email?: string;
  status?: ShelterStatus;
  phone?: string | null;
  websiteUrl?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  coverImageUrl?: string | null;
  logoImageUrl?: string | null;
  registrationNumber?: string | null;
  suburb?: string | null;
  city?: string | null;
  province?: string | null;
  bio?: string | null;
};

type AdminUserFormData = {
  id?: string;
  name?: string;
  email?: string;
  role?: UserRole;
  shelterId?: string | null;
  suspendedAt?: Date | null;
  passwordResetRequired?: boolean;
};

type ShelterOption = {
  id: string;
  name: string;
};

function displayEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function AdminShelterForm({
  action,
  shelter,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  shelter?: AdminShelterFormData;
  submitLabel: string;
}) {
  return (
    <form action={action} className="admin-form">
      {shelter?.id ? <input type="hidden" name="shelterId" value={shelter.id} /> : null}
      <div className="admin-form-grid">
        <label>
          <span>Shelter Name</span>
          <input name="name" required defaultValue={shelter?.name ?? ""} />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required defaultValue={shelter?.email ?? ""} />
        </label>
        <label>
          <span>Status</span>
          <select name="status" defaultValue={shelter?.status ?? ShelterStatus.PENDING}>
            {Object.values(ShelterStatus).map((status) => (
              <option value={status} key={status}>{displayEnum(status)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Phone</span>
          <input name="phone" type="tel" defaultValue={shelter?.phone ?? ""} />
        </label>
        <label>
          <span>Suburb</span>
          <input name="suburb" defaultValue={shelter?.suburb ?? ""} />
        </label>
        <label>
          <span>City</span>
          <input name="city" defaultValue={shelter?.city ?? "Cape Town"} />
        </label>
        <label>
          <span>Province</span>
          <input name="province" defaultValue={shelter?.province ?? "Western Cape"} />
        </label>
        <label>
          <span>Registration Number</span>
          <input name="registrationNumber" defaultValue={shelter?.registrationNumber ?? ""} />
        </label>
        <label>
          <span>Website URL</span>
          <input name="websiteUrl" type="url" defaultValue={shelter?.websiteUrl ?? ""} />
        </label>
        <label>
          <span>Facebook URL</span>
          <input name="facebookUrl" type="url" defaultValue={shelter?.facebookUrl ?? ""} />
        </label>
        <label>
          <span>Instagram URL</span>
          <input name="instagramUrl" type="url" defaultValue={shelter?.instagramUrl ?? ""} />
        </label>
        <label className="wide-field">
          <span>Bio</span>
          <textarea name="bio" rows={5} defaultValue={shelter?.bio ?? ""} />
        </label>
        <div className="wide-field shelter-branding-upload-grid">
          <ShelterImageUploadField
            name="coverImage"
            existingName="existingCoverImageUrl"
            label="Cover image"
            help="Wide banner used at the top of the public shelter profile."
            initialUrl={shelter?.coverImageUrl}
            variant="cover"
          />
          <ShelterImageUploadField
            name="logoImage"
            existingName="existingLogoImageUrl"
            label="Logo / profile image"
            help="Square logo shown on profile cards, shelter pages, and partner lists."
            initialUrl={shelter?.logoImageUrl}
            variant="logo"
          />
        </div>
      </div>
      <div className="admin-form-actions">
        <Link href={shelter?.id ? `/admin/shelters/${shelter.id}` : "/admin/shelters"}>Cancel</Link>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}

export function AdminUserForm({
  action,
  user,
  shelters,
  submitLabel,
}: {
  action: (formData: FormData) => void | Promise<void>;
  user?: AdminUserFormData;
  shelters: ShelterOption[];
  submitLabel: string;
}) {
  return (
    <form action={action} className="admin-form">
      {user?.id ? <input type="hidden" name="userId" value={user.id} /> : null}
      <div className="admin-form-grid">
        <label>
          <span>Name</span>
          <input name="name" required defaultValue={user?.name ?? ""} />
        </label>
        <label>
          <span>Email</span>
          <input name="email" type="email" required defaultValue={user?.email ?? ""} />
        </label>
        <label>
          <span>Role</span>
          <select name="role" defaultValue={user?.role ?? UserRole.SHELTER_STAFF}>
            {Object.values(UserRole).map((role) => (
              <option value={role} key={role}>{displayEnum(role)}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Shelter</span>
          <select name="shelterId" defaultValue={user?.shelterId ?? ""}>
            <option value="">No shelter</option>
            {shelters.map((shelter) => (
              <option value={shelter.id} key={shelter.id}>{shelter.name}</option>
            ))}
          </select>
        </label>
        {user?.id ? (
          <label className="admin-toggle-field wide-field">
            <input name="isSuspended" type="checkbox" defaultChecked={Boolean(user.suspendedAt)} />
            <span>Suspend this user and block shelter login</span>
          </label>
        ) : (
          <label className="wide-field">
            <span>Password</span>
            <input name="password" type="password" required minLength={8} autoComplete="new-password" />
          </label>
        )}
      </div>
      <div className="admin-form-actions">
        <Link href={user?.id ? `/admin/users/${user.id}` : "/admin/users"}>Cancel</Link>
        <button type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
