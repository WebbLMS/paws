import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const ADMIN_COOKIE = "paws_admin_session";
const LEGACY_ADMIN_COOKIES = ["paws_master_admin"];
const ADMIN_COOKIE_DOMAINS = [undefined, "localhost", ".localhost"];
const ADMIN_COOKIE_PATHS = ["/", "/admin", "/admin/login"];
const DEFAULT_ADMIN_USERNAME = "admin";
const DEFAULT_ADMIN_PASSWORD = "password1234";

function adminUsername() {
  return process.env.MASTER_ADMIN_USERNAME?.trim() || DEFAULT_ADMIN_USERNAME;
}

function adminPassword() {
  return process.env.MASTER_ADMIN_PASSWORD?.trim() || DEFAULT_ADMIN_PASSWORD;
}

function secret() {
  return process.env.BETTER_AUTH_SECRET || "paws-local-admin-secret";
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function isValidSignature(value: string, signature: string) {
  const expected = Buffer.from(sign(value), "hex");
  const actual = Buffer.from(signature, "hex");

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function validateAdminCredentials(username: string, password: string) {
  return username.trim() === adminUsername() && password === adminPassword();
}

export async function createAdminSession(username: string) {
  const cookieStore = await cookies();
  const value = `${username}.${sign(username)}`;

  cookieStore.set(ADMIN_COOKIE, value, {
    httpOnly: true,
    maxAge: 60 * 60 * 8,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();

  for (const name of [ADMIN_COOKIE, ...LEGACY_ADMIN_COOKIES]) {
    cookieStore.set(name, "", {
      ...expiredAdminCookieOptions(),
      path: "/",
    });
  }
}

function expiredAdminCookieOptions() {
  return {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  } as const;
}

export function expiredAdminSessionCookieHeaders() {
  const headers: string[] = [];
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  for (const name of [ADMIN_COOKIE, ...LEGACY_ADMIN_COOKIES]) {
    for (const domain of ADMIN_COOKIE_DOMAINS) {
      for (const path of ADMIN_COOKIE_PATHS) {
        headers.push(
          `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0${
            domain ? `; Domain=${domain}` : ""
          }; HttpOnly; SameSite=Lax${secure}`,
        );
      }
    }
  }

  return headers;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(ADMIN_COOKIE)?.value;

  if (!value) return null;

  const [username, signature] = value.split(".");
  if (!username || !signature || !isValidSignature(username, signature)) return null;

  return {
    username,
  };
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  return session;
}
