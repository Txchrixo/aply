import type { Metadata } from "next";
import { Fraunces, Poppins } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/aply/theme-provider";

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

const poppins = Poppins({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Aply · Your 24/7 Auto-Application Agent",
  description:
    "Aply monitors 190+ job platforms around the clock, drafts authentic cover letters with GLM, and asks for your approval before every submission. FR · EN · DE.",
  keywords: [
    "Aply",
    "job application agent",
    "auto apply",
    "cover letter AI",
    "GLM",
    "Chrome extension",
    "job board monitor",
  ],
  authors: [{ name: "Aply" }],
  icons: {
    icon: "/logo.svg",
  },
  openGraph: {
    title: "Aply · Your 24/7 Auto-Application Agent",
    description:
      "Monitor 190+ platforms, draft authentic applications with GLM, approve via WhatsApp/email.",
    siteName: "Aply",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body
        className={`${fraunces.variable} ${poppins.variable} antialiased aply-paper min-h-screen flex flex-col pb-14 lg:pb-0`}
      >
        <ThemeProvider>
          {children}
        </ThemeProvider>
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}
