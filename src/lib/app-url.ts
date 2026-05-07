import type { NextRequest } from "next/server";
import { headers } from "next/headers";

function cleanBaseUrl(value: string) {
  return value.replace(/\/+$/, "");
}

function withPath(origin: string, pathname = "") {
  return `${origin}${pathname.startsWith("/") ? pathname : `/${pathname}`}`;
}

function originFromHost(host: string, protocol?: string | null) {
  const normalizedProtocol = protocol || (host.startsWith("localhost") ? "http" : "https");
  return `${normalizedProtocol}://${host}`;
}

export function configuredAppUrl() {
  const explicitUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL;
  if (explicitUrl) return cleanBaseUrl(explicitUrl);

  if (process.env.VERCEL_URL) return `https://${cleanBaseUrl(process.env.VERCEL_URL)}`;
  if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${cleanBaseUrl(process.env.NEXT_PUBLIC_VERCEL_URL)}`;

  return "http://localhost:3000";
}

export function appUrl(pathname = "") {
  return withPath(configuredAppUrl(), pathname);
}

export function requestAppUrl(request: NextRequest, pathname = "") {
  const host = request.headers.get("x-forwarded-host") || request.headers.get("host");
  if (!host) return appUrl(pathname);

  return withPath(originFromHost(host, request.headers.get("x-forwarded-proto")), pathname);
}

export async function currentAppUrl(pathname = "") {
  const headerStore = await headers();
  const host = headerStore.get("x-forwarded-host") || headerStore.get("host");
  if (!host) return appUrl(pathname);

  return withPath(originFromHost(host, headerStore.get("x-forwarded-proto")), pathname);
}
