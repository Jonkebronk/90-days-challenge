import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import SessionProvider from "@/components/providers/SessionProvider";
import { constructMetadata } from "@/lib/metadata";
import { PWARegister } from "@/components/pwa-register";

export const metadata: Metadata = constructMetadata({
  title: "90-Dagars Utmaningen - Transform Din Kropp & Hälsa",
  description: "Transform din kropp och hälsa på 90 dagar. Få personlig coaching, skräddarsydda träningsprogram, kostplaner, dagliga check-ins och experthjälp för att nå dina hälsomål.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "90-Dagars Utmaningen",
  },
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#D4AF37", // Gold primary color
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sv">
      <body className="antialiased">
        <SessionProvider>
          <PWARegister />
          {children}
          <Toaster />
          <Sonner />
        </SessionProvider>
      </body>
    </html>
  );
}
