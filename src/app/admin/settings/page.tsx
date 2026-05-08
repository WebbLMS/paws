import Image from "next/image";

import { requireAdminSession } from "@/lib/admin-auth";
import { defaultSiteName } from "@/lib/branding";
import { prisma } from "@/lib/prisma";

import { updatePlatformSettings } from "../actions";
import { AdminShell } from "../admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; saved?: string | string[]; warning?: string | string[] }>;
}) {
  const [session, params, settings] = await Promise.all([
    requireAdminSession(),
    searchParams,
    prisma.platformSettings.findUnique({
      where: {
        id: "platform",
      },
    }),
  ]);

  const saved = params.saved === "1";
  const invalidAnalyticsId = params.error === "invalid-analytics-id";
  const invalidImage = params.error === "invalid-image";
  const invalidEmailSettings = params.error === "invalid-email-settings";
  const emailDisabled = params.warning === "email-disabled";

  return (
    <AdminShell session={session} active="settings">
      <div className="admin-content">
        <div className="admin-page-title">
          <div>
            <h1>Global Settings</h1>
            <p>Platform-wide configuration used across public and shelter pages.</p>
          </div>
        </div>

        <article className="admin-panel admin-settings-panel">
          <header>
            <h2>Global Settings</h2>
          </header>
          <form action={updatePlatformSettings} className="admin-form">
            {saved ? <div className="admin-success">Settings saved.</div> : null}
            {invalidAnalyticsId ? (
              <div className="admin-error">
                Enter a valid Google tag ID, for example G-XXXXXXXXXX. You can also paste the Google Analytics snippet and the ID will be extracted.
              </div>
            ) : null}
            {invalidImage ? (
              <div className="admin-error">Upload a PNG, JPG, WebP, GIF, or ICO image under 2MB.</div>
            ) : null}
            {invalidEmailSettings ? (
              <div className="admin-error">
                To enable email, add a valid SMTP host, username, password, and no-reply email address.
              </div>
            ) : null}
            {emailDisabled ? (
              <div className="admin-error">
                Branding was saved. Email delivery was left disabled because the SMTP settings are incomplete.
              </div>
            ) : null}

            <input type="hidden" name="existingSiteLogoUrl" value={settings?.siteLogoUrl ?? ""} />
            <input type="hidden" name="existingSiteIconUrl" value={settings?.siteIconUrl ?? ""} />

            <section className="admin-form-section">
              <h3>Analytics</h3>
              <div className="admin-form-grid">
                <label className="wide-field">
                  <span>Google Analytics Code</span>
                  <textarea
                    name="googleAnalyticsId"
                    rows={4}
                    defaultValue={settings?.googleAnalyticsId ?? ""}
                    placeholder="G-XXXXXXXXXX"
                  />
                </label>
              </div>
            </section>

            <section className="admin-form-section">
              <h3>Branding</h3>
              <div className="admin-form-grid">
                <label className="wide-field">
                  <span>Site Name</span>
                  <input name="siteName" defaultValue={settings?.siteName ?? defaultSiteName} />
                </label>
                <label>
                  <span>Site Logo</span>
                  <input name="siteLogo" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon" />
                </label>
                <label>
                  <span>Site Icon</span>
                  <input name="siteIcon" type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/x-icon" />
                </label>
              </div>
            </section>

            <div className="admin-branding-preview">
              <div>
                <span>Current Logo</span>
                {settings?.siteLogoUrl ? <Image src={settings.siteLogoUrl} alt="Current site logo" width={96} height={96} /> : <em>Default paw mark</em>}
              </div>
              <div>
                <span>Current Icon</span>
                {settings?.siteIconUrl ? <Image src={settings.siteIconUrl} alt="Current site icon" width={96} height={96} /> : <em>Default favicon</em>}
              </div>
            </div>

            <p className="admin-form-note">
              Leave Analytics blank to disable it. Uploaded logo and icon files are served from the platform and used on public pages.
            </p>

            <section className="admin-form-section">
              <div className="admin-section-heading-row">
                <div>
                  <h3>Email Delivery</h3>
                  <p>SendGrid SMTP is used for enquiry notifications, alert confirmations, and shelter account updates.</p>
                </div>
                <label className="admin-toggle-field">
                  <input name="smtpEnabled" type="checkbox" defaultChecked={settings?.smtpEnabled ?? false} />
                  <span>Enable email</span>
                </label>
              </div>

              <div className="admin-form-grid">
                <label>
                  <span>SMTP Host</span>
                  <input name="smtpHost" defaultValue={settings?.smtpHost ?? "smtp.sendgrid.net"} placeholder="smtp.sendgrid.net" />
                </label>
                <label>
                  <span>Security</span>
                  <select name="smtpSecurity" defaultValue={settings?.smtpSecurity ?? "TLS"}>
                    <option value="TLS">TLS / STARTTLS</option>
                    <option value="SSL">SSL</option>
                    <option value="NONE">None</option>
                  </select>
                </label>
                <label>
                  <span>SMTP Port</span>
                  <input name="smtpPort" type="number" min={1} max={65535} defaultValue={settings?.smtpPort ?? 587} />
                </label>
                <label>
                  <span>Auth Type</span>
                  <select name="smtpAuthType" defaultValue={settings?.smtpAuthType ?? "LOGIN"}>
                    <option value="LOGIN">LOGIN</option>
                  </select>
                </label>
                <label>
                  <span>Username</span>
                  <input name="smtpUsername" defaultValue={settings?.smtpUsername ?? "apikey"} autoComplete="username" />
                </label>
                <label>
                  <span>Password / API Key</span>
                  <input
                    name="smtpPassword"
                    type="password"
                    placeholder={settings?.smtpPassword ? "Existing API key saved" : "SendGrid API key"}
                    autoComplete="new-password"
                  />
                </label>
                <label>
                  <span>Sessions Limit</span>
                  <input name="smtpSessionLimit" type="number" min={1} max={20} defaultValue={settings?.smtpSessionLimit ?? 3} />
                </label>
                <label>
                  <span>No-reply Address</span>
                  <input
                    name="smtpNoReplyEmail"
                    type="email"
                    defaultValue={settings?.smtpNoReplyEmail ?? ""}
                    placeholder="no-reply@pawsofcapetown.org.za"
                    autoComplete="email"
                  />
                </label>
                <label className="wide-field">
                  <span>Email Display Name</span>
                  <input name="smtpNoReplyName" defaultValue={settings?.smtpNoReplyName ?? defaultSiteName} />
                </label>
              </div>

              <p className="admin-form-note">
                SendGrid SMTP defaults: host smtp.sendgrid.net, TLS on port 587, auth type LOGIN, username apikey.
                Leave the password blank to keep the saved API key.
              </p>
            </section>

            <div className="admin-form-actions">
              <button type="submit">Save Settings</button>
            </div>
          </form>
        </article>
      </div>
    </AdminShell>
  );
}
