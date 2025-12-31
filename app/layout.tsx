import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import SessionProvider from "@/components/providers/SessionProvider";
import { constructMetadata } from "@/lib/metadata";
import { PWARegister } from "@/components/pwa-register";
import { PullToRefresh } from "@/components/pull-to-refresh";

export const metadata: Metadata = constructMetadata({
  title: "Friskvårdskompassen - Din vägvisare till bättre hälsa",
  description: "Din vägvisare till bättre hälsa. Få personlig coaching, skräddarsydda träningsprogram, kostplaner och experthjälp för att nå dina hälsomål.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Friskvårdskompassen",
  },
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover", // Enable safe area insets on iOS
  themeColor: "#1f2937", // Dark gray to match mobile top bar
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv" className="overflow-x-hidden">
      <body className="antialiased overflow-x-hidden">
        <SessionProvider>
          {/* <PWARegister /> */}
          {/* Temporarily disabled to fix cache issues */}
          <PullToRefresh>
            {children}
          </PullToRefresh>
          <Toaster />
          <Sonner />
        </SessionProvider>
      </body>
    </html>
  );
}
