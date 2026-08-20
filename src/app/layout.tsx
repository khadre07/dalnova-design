import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono } from "next/font/google";
import { SiteProvider } from "@/lib/site-state";
import "./globals.css";

/* Archivo is here for its width axis. Set expanded and uppercase it reads as
   machined signage, which is the register we want, and it is not the grotesk
   every other infrastructure company reaches for. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://dalnova.tech"),
  title: {
    default: "Dalnova Technologies — Infogérance, IA appliquée et blockchain",
    template: "%s · Dalnova Technologies",
  },
  description:
    "Dalnova exploite votre infrastructure, met vos modèles d'IA en production et sécurise vos registres blockchain. Supervision 24/7, prise en charge sous 15 minutes.",
  keywords: [
    "infogérance",
    "support informatique 24/7",
    "intelligence artificielle en production",
    "blockchain entreprise",
    "supervision infrastructure",
  ],
  openGraph: {
    type: "website",
    siteName: "Dalnova Technologies",
    title: "Dalnova Technologies — Infogérance, IA appliquée et blockchain",
    description:
      "Une seule équipe pour exploiter votre infrastructure, industrialiser vos modèles et sécuriser vos registres.",
  },
};

export const viewport: Viewport = {
  themeColor: "#05070a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${archivo.variable} ${geist.variable} ${geistMono.variable}`}>
      <head>
        {/* Runs before paint, so the reveal animations only ever hide content
            on a browser that is definitely able to bring it back. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.dataset.js="on"`,
          }}
        />
      </head>
      <body>
        <SiteProvider>{children}</SiteProvider>
      </body>
    </html>
  );
}
