import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";

import { defaultSiteName } from "@/lib/branding";
import { getPlatformSettings } from "@/lib/platform-settings";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getPlatformSettings();
  const siteName = settings?.siteName ?? defaultSiteName;

  return {
    title: `${siteName} | Rescue Animal Marketplace`,
    description:
      "Search rescue animals from Cape Town shelters and enquire about adoption in one place.",
    icons: settings?.siteIconUrl
      ? {
          icon: settings.siteIconUrl,
          shortcut: settings.siteIconUrl,
          apple: settings.siteIconUrl,
        }
      : undefined,
  };
}

async function GoogleAnalytics() {
  const settings = await getPlatformSettings();

  const googleAnalyticsId = settings?.googleAnalyticsId;
  if (!googleAnalyticsId) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(googleAnalyticsId)}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', ${JSON.stringify(googleAnalyticsId)});
        `}
      </Script>
    </>
  );
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
