import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import SessionProvider from "@/components/providers/SessionProvider";
import { constructMetadata } from "@/lib/metadata";

export const metadata: Metadata = constructMetadata({
  title: "90-Dagars Challenge - Personlig Träning & Nutrition",
  description: "Bygg din personliga 90-dagarsplan för kost och träning. Få professionell coaching, träningsprogram, kostplaner och uppföljning.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "90-Dagars Challenge",
  },
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#FFD700",
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
          {children}
          <Toaster />
          <Sonner />
        </SessionProvider>
      </body>
    </html>
  );
}
