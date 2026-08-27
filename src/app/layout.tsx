import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono, Martian_Mono } from "next/font/google";
import PreviewNotice from "@/components/PreviewNotice";
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

/* The spec face, for numbers only — never prose.

   An extended monospace with squared bowls: the wide, machined letterform of
   an instrument readout. Chosen over the obvious "futuristic" picks, which are
   costume rather than engineering.

   The reason it is this one specifically: its zero is slashed by design, not
   behind an OpenType feature. Checked, not assumed — Archivo, Chakra Petch,
   Geist and Geist Mono all expose no `zero` feature at all, so asking for a
   slashed zero on any of them silently does nothing. */
const martian = Martian_Mono({
  subsets: ["latin"],
  weight: ["600", "700"],
  variable: "--font-martian",
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

/* Safe by default: the site is treated as a prototype unless someone sets
   NEXT_PUBLIC_PREVIEW=0. While it is a prototype it carries invented SLA
   figures and contact details, and must not be indexed. */
const IS_PREVIEW = process.env.NEXT_PUBLIC_PREVIEW !== "0";

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
  robots: IS_PREVIEW ? { index: false, follow: false } : undefined,
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
    /* The pre-paint script below stamps data-js onto this element, so the
       client tree legitimately carries an attribute the server never sent.
       Without this, every single page load reported a hydration mismatch. */
    <html
      lang="fr"
      className={`${archivo.variable} ${martian.variable} ${geist.variable} ${geistMono.variable}`}
      suppressHydrationWarning
    >
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
        <SiteProvider>
          {children}
          {IS_PREVIEW ? <PreviewNotice /> : null}
        </SiteProvider>
      </body>
    </html>
  );
}
