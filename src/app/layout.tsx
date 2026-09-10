import type { Metadata, Viewport } from "next";
import { Archivo, Geist, Geist_Mono, Martian_Mono } from "next/font/google";
import localFont from "next/font/local";
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

/* Zodiak, pris chez Fontshare et hébergé ici.

   Il n'est pas sur Google Fonts, donc next/font/local plutôt que next/font/google,
   et le fichier vit dans le dépôt. La licence libre d'ITF autorise
   explicitement l'auto-hébergement ; elle est déposée à côté du fichier, ce
   qu'elle demande.

   La variable et non les douze coupes : trente-sept kilo-octets pour toute la
   famille, du maigre au noir, contre une requête par graisse. C'est aussi ce
   qui permet aux titres de prendre exactement le poids qu'on leur donne au
   lieu du plus proche disponible.

   « swap » : une page qui attend sa police est une page sans texte. Le lecteur
   voit d'abord la substitution, puis Zodiak — jamais rien. */
const zodiak = localFont({
  src: [
    { path: "../fonts/Zodiak-Variable.woff2", weight: "100 900", style: "normal" },
    { path: "../fonts/Zodiak-VariableItalic.woff2", weight: "100 900", style: "italic" },
  ],
  variable: "--font-zodiak",
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

export const metadata: Metadata = {
  metadataBase: new URL("https://www.dalnova.com"),
  title: {
    default: "Dalnova Technologies — Services informatiques à Dakar",
    template: "%s · Dalnova Technologies",
  },
  description:
    "Développement, réseaux, téléphonie IP, sécurité physique, IA appliquée, infogérance et équipements. Une équipe unique, un interlocuteur unique, une facture unique. Dakar, Sénégal.",
  keywords: [
    "services informatiques Dakar",
    "infogérance Sénégal",
    "réseaux et systèmes",
    "téléphonie IP",
    "vidéosurveillance",
    "développement d'applications",
    "IA appliquée en entreprise",
    "serveur MCP",
  ],
  openGraph: {
    type: "website",
    siteName: "Dalnova Technologies",
    title: "Dalnova Technologies — Services informatiques à Dakar",
    description:
      "Du serveur à l'application métier, en passant par le réseau et la sécurité de vos locaux. Une équipe unique, un interlocuteur unique, une facture unique.",
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
      className={`${zodiak.variable} ${archivo.variable} ${martian.variable} ${geist.variable} ${geistMono.variable}`}
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
        </SiteProvider>
      </body>
    </html>
  );
}
