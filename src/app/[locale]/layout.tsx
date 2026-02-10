import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getMessages } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Meetup - Agile Sprint Management for GitHub",
    template: "%s | Meetup",
  },
  description:
    "Meetup helps teams manage agile sprints directly integrated with GitHub. Plan, track, and deliver your projects faster with seamless GitHub integration.",
  keywords: [
    "sprint management",
    "agile",
    "scrum",
    "GitHub",
    "project management",
    "Meetup",
  ],
  authors: [{ name: "Meetup" }],
  creator: "Meetup",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Meetup",
    title: "Meetup - Agile Sprint Management for GitHub",
    description:
      "Meetup helps teams manage agile sprints directly integrated with GitHub. Plan, track, and deliver your projects faster.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Meetup - Agile Sprint Management for GitHub",
    description:
      "Meetup helps teams manage agile sprints directly integrated with GitHub. Plan, track, and deliver your projects faster.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/site.webmanifest",
  icons: {
    icon: "/favicon.ico",
  },
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!routing.locales.includes(locale as "en" | "es" | "fr")) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            themes={["light", "dark"]}
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
