import type { Metadata, Viewport } from "next";
import "./globals.css";
import DemoBanner from "@/components/DemoBanner";

export const metadata: Metadata = {
  title: "WhatIf — The AI oracle for your hardest decisions",
  description:
    "Simulate three realistic futures for any decision in seconds. WhatIf is the AI oracle for the choices that actually matter.",
  openGraph: {
    title: "WhatIf — The AI oracle for your hardest decisions",
    description:
      "Simulate three realistic futures for any decision in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#07060d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">
        <div className="pointer-events-none fixed inset-0 -z-10 grid-bg opacity-60" />
        <div className="pointer-events-none fixed inset-0 -z-10 noise opacity-[0.35] mix-blend-overlay" />
        <DemoBanner />
        {children}
      </body>
    </html>
  );
}
