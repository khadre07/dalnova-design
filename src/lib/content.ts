export type Lang = "fr" | "en";

/** Cyan marks what a machine does. Amber marks what a person does. */
export type Accent = "arc" | "ember";

export type Capability = {
  id: string;
  code: string;
  accent: Accent;
  title: string;
  lede: string;
  points: string[];
};

export type Content = {
  nav: { href: string; label: string }[];
  navCta: string;
  hero: {
    eyebrow: string;
    title: string[];
    lede: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scrollHint: string;
  };
  /* The headline claim, read as an instrument. Every figure here is a count of
     something on this page — there are no service-level numbers, because
     Dalnova publishes none and inventing them would be the one thing on the
     site a prospect could check and find false. */
  spec: {
    label: string;
    link: string;
    value: string;
    unit: string;
    floor: string;
    ceiling: string;
    min: number;
    max: number;
    now: number;
    chips: { label: string; value: string }[];
  };
  capabilities: {
    eyebrow: string;
    title: string;
    lede: string;
    items: Capability[];
    /* Work under way rather than work for sale. Kept out of the service list
       on purpose: a prospect must be able to tell what can be bought today
       from what is still being explored. */
    research: { label: string; title: string; body: string };
  };
  method: {
    eyebrow: string;
    title: string;
    lede: string;
    steps: { n: string; title: string; body: string }[];
  };
  /** Who they work for. Named sectors rather than invented statistics. */
  sectors: { eyebrow: string; title: string; lede: string; items: string[] };
  gallery: {
    eyebrow: string;
    title: string;
    lede: string;
    previous: string;
    next: string;
    open: string;
    close: string;
    emptyLabel: string;
    /* Intrinsic pixel size travels with the picture. Without it the browser
       cannot know the shape of a box until the bytes land, so the frame is
       laid out at nothing and then jumps to its real height — the shove you
       see when a page finishes loading around you. */
    items: { src: string; alt: string; caption: string; w: number; h: number }[];
  };
  /* Linked to their own sites, and shown as their own marks. `logo` is the
     file; `name` still travels with it as the alt text and as what a reader
     without images gets. */
  partners: {
    label: string;
    items: {
      name: string;
      place: string;
      href: string;
      logo: string;
      w: number;
      h: number;
    }[];
  };
  contact: {
    eyebrow: string;
    title: string;
    lede: string;
    channels: { label: string; value: string; href: string; accent: Accent }[];
    ctaPrimary: string;
  };
  footer: {
    blurb: string;
    rights: string;
    columns: { title: string; links: { label: string; href?: string }[] }[];
  };
};

/* The four drawings are Dalnova's own deliverables, named equipment and all —
   a far better answer to "can you do this" than any photograph of a rack. The
   seven service illustrations that came with them are marked as temporary in
   Dalnova's own notes, so none of them are used here. */
/* Each drawing with the size it actually is. The three landscape ones share a
   shape; the telephony one is nearly square, which is exactly why the numbers
   have to travel with the file rather than be assumed. */
const WORK = {
  reseau: { src: "/work/reseau-active-directory.webp", w: 1600, h: 1067 },
  supervision: { src: "/work/supervision-infogerance.webp", w: 1600, h: 1067 },
  video: { src: "/work/videosurveillance.webp", w: 1600, h: 1067 },
  voip: { src: "/work/telephonie-ip.webp", w: 1600, h: 1482 },
} as const;

export const CONTENT: Record<Lang, Content> = {
  fr: {
    nav: [
      { href: "#services", label: "Services" },
      { href: "#methode", label: "Méthode" },
      { href: "#secteurs", label: "Secteurs" },
      { href: "#realisations", label: "Réalisations" },
      { href: "#contact", label: "Contact" },
    ],
    navCta: "Demander un devis",
    hero: {
      eyebrow: "Services informatiques · Dakar, Sénégal",
      title: ["On gère", "votre IT,", "du câble", "au code."],
      lede: "De l'installation du serveur jusqu'au développement de votre application métier, en passant par l'infrastructure réseau et la sécurité physique de vos locaux — nous accompagnons votre transformation digitale de bout en bout.",
      ctaPrimary: "Demander un devis",
      ctaSecondary: "Découvrir nos services",
      scrollHint: "Faites défiler",
    },
    spec: {
      label: "Périmètre couvert",
      link: "Voir nos services",
      value: "8",
      unit: "domaines",
      floor: "Développement",
      ceiling: "Équipements",
      min: 0,
      max: 8,
      now: 8,
      chips: [
        { label: "Interlocuteur", value: "Unique" },
        { label: "Facture", value: "Unique" },
      ],
    },
    capabilities: {
      eyebrow: "Services",
      title: "Huit domaines, un seul prestataire",
      lede: "Vous perdez du temps à jongler entre trois prestataires — un pour les caméras, un pour le réseau, un autre pour les logiciels. Une équipe unique, un interlocuteur unique, une facture unique.",
      items: [
        {
          id: "developpement",
          code: "DEV",
          accent: "arc",
          title: "Développement d'applications",
          lede: "Des solutions logicielles performantes, évolutives et adaptées aux besoins spécifiques de votre entreprise, de la conception à la mise en production.",
          points: [
            "Applications web, mobiles et desktop",
            "Sites web professionnels",
            "Solutions métier sur mesure",
            "De la conception à la mise en production",
          ],
        },
        {
          id: "cloud",
          code: "CLD",
          accent: "arc",
          title: "Cloud, hébergement et messagerie",
          lede: "Choix, déploiement et gestion de vos solutions d'hébergement, de messagerie et d'infrastructure Cloud, sur les plateformes les mieux adaptées.",
          points: [
            "Hébergement cloud et hébergement web",
            "Gestion de noms de domaine",
            "Messagerie professionnelle",
            "Migration des données et sauvegarde",
          ],
        },
        {
          id: "reseaux",
          code: "RES",
          accent: "arc",
          title: "Réseaux et systèmes",
          lede: "Conception, déploiement et administration d'infrastructures réseau et systèmes fiables, sécurisées et adaptées à vos besoins.",
          points: [
            "Infrastructures LAN et WAN, câblage structuré",
            "Interconnexion de sites : VPN, liaison radio PtP et PtMP",
            "Administration Windows et Linux, virtualisation",
            "Active Directory, supervision et sécurisation",
          ],
        },
        {
          id: "telephonie",
          code: "TEL",
          accent: "arc",
          title: "Téléphonie IP",
          lede: "Solutions de téléphonie IP et de communications unifiées pour améliorer la collaboration et réduire les coûts de communication.",
          points: [
            "Téléphonie IP sur IPBX",
            "Déploiement VoIP et portabilité des numéros",
            "Communications unifiées",
            "Installation, configuration et files d'attente",
          ],
        },
        {
          id: "securite",
          code: "SEC",
          accent: "arc",
          title: "Sécurité physique",
          lede: "Des solutions fiables pour protéger vos locaux, vos biens et vos collaborateurs grâce à des systèmes de surveillance et de contrôle d'accès performants.",
          points: [
            "Vidéosurveillance IP (CCTV)",
            "Contrôle d'accès",
            "Systèmes de pointage",
            "Enregistreurs NVR et supervision à distance",
          ],
        },
        {
          id: "ia",
          code: "IA",
          accent: "arc",
          title: "IA appliquée",
          lede: "Des modèles branchés sur vos données et vos outils, au service de vos processus réels. Une démonstration en bac à sable ne traite aucun dossier.",
          points: [
            "Serveurs MCP : relier vos outils et vos données aux modèles",
            "Assistants métier calés sur vos procédures internes",
            "Intégration à vos applications et à votre SI existant",
            "Mise en production, supervision et formation des utilisateurs",
          ],
        },
        {
          id: "support",
          code: "SUP",
          accent: "ember",
          title: "Support IT et infogérance",
          lede: "Gestion, maintenance et suivi de votre infrastructure informatique pour assurer disponibilité, sécurité et performances — pendant que vous vous concentrez sur votre activité.",
          points: [
            "Maintenance informatique",
            "Assistance technique sur site et à distance",
            "Infogérance des serveurs et des postes de travail",
            "Supervision et gestion du parc informatique",
          ],
        },
        {
          id: "equipements",
          code: "EQP",
          accent: "ember",
          title: "Équipements et licences",
          lede: "Choix, fourniture, installation et intégration d'équipements informatiques adaptés à votre activité.",
          points: [
            "Ordinateurs et stations de travail",
            "Serveurs et solutions de stockage",
            "Équipements réseau, imprimantes et périphériques",
            "Licences logicielles",
          ],
        },
      ],
      research: {
        label: "Recherche",
        title: "Blockchain appliquée à la finance",
        body: "Nous explorons l'usage des registres distribués pour la traçabilité des transactions, la réduction des intermédiaires et les contrats programmables. C'est un travail de recherche — pas encore une prestation que vous pouvez commander.",
      },
    },
    method: {
      eyebrow: "Méthode",
      title: "Notre approche",
      lede: "Un accompagnement structuré en cinq étapes, de l'analyse initiale jusqu'au support dans la durée.",
      steps: [
        {
          n: "01",
          title: "Analyse des besoins",
          body: "Comprendre votre contexte, vos contraintes et vos objectifs.",
        },
        {
          n: "02",
          title: "Conseil et conception",
          body: "Concevoir la solution la mieux adaptée à votre organisation.",
        },
        {
          n: "03",
          title: "Déploiement",
          body: "Mettre en œuvre la solution dans les règles de l'art.",
        },
        {
          n: "04",
          title: "Formation",
          body: "Rendre vos équipes autonomes sur les outils déployés.",
        },
        {
          n: "05",
          title: "Support et maintenance",
          body: "Assurer la disponibilité et l'évolution de votre système.",
        },
      ],
    },
    sectors: {
      eyebrow: "Clients",
      title: "Nos secteurs d'intervention",
      lede: "Les mêmes exigences de fiabilité, quel que soit le métier.",
      items: [
        "Entreprises",
        "PME / PMI",
        "Administrations publiques",
        "ONG",
        "Établissements scolaires",
        "Santé",
        "Industrie",
        "Commerce",
      ],
    },
    gallery: {
      eyebrow: "Réalisations",
      title: "Ce que nous concevons",
      lede: "Les architectures que nous livrons, telles qu'elles sont remises aux clients — matériel nommé, adressage et supervision compris.",
      previous: "Réalisation précédente",
      next: "Réalisation suivante",
      open: "Agrandir le schéma",
      close: "Fermer",
      emptyLabel: "Emplacement ",
      items: [
        {
          ...WORK.reseau,
          alt: "Schéma d'une infrastructure LAN : routeur FAI, MikroTik hEX, switch Cisco 24 ports, borne Ubiquiti U6, serveur HP ProLiant sous Windows Server, NAS Synology, supervision Zabbix et Grafana, et un plan d'adressage réparti en quatre VLAN.",
          caption: "Infrastructure réseau et annuaire d'entreprise",
        },
        {
          ...WORK.supervision,
          alt: "Schéma d'infogérance : le parc informatique du client — postes, serveurs, sauvegardes, imprimantes — relié par Internet à la supervision et au helpdesk de Dalnova.",
          caption: "Infogérance d'un parc informatique",
        },
        {
          ...WORK.video,
          alt: "Schéma de vidéosurveillance : huit caméras IP reliées à un switch PoE 16 ports et à un enregistreur Hikvision 16 canaux, avec écran de supervision et accès distant sur mobile.",
          caption: "Vidéosurveillance et contrôle d'accès",
        },
        {
          ...WORK.voip,
          alt: "Schéma de téléphonie IP : arrivée opérateur, IPBX Yeastar S20, switch et quatre postes GrandStream GRP2612W.",
          caption: "Migration vers la téléphonie IP",
        },
      ],
    },
    partners: {
      label: "Partenaires",
      items: [
        {
          name: "Wikistartup",
          place: "Tunisie",
          href: "https://wikistartup.tn",
          logo: "/partners/wikistartup.webp",
          w: 300,
          h: 70,
        },
        {
          name: "ISRA — BAME",
          place: "Sénégal",
          href: "https://www.isra-bame.sn",
          logo: "/partners/isra-bame.webp",
          w: 304,
          h: 149,
        },
        {
          name: "Enactus Morocco",
          place: "Maroc",
          href: "https://enactus-morocco.org",
          logo: "/partners/enactus-morocco.svg",
          w: 300,
          h: 100,
        },
        {
          name: "E4Impact",
          place: "International",
          href: "https://e4impact.org",
          logo: "/partners/e4impact.webp",
          w: 360,
          h: 101,
        },
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Parlons de votre projet",
      lede: "Dites-nous ce qui vous bloque. Nous étudions votre besoin et vous proposons une solution adaptée.",
      channels: [
        {
          label: "Écrire",
          value: "contact@dalnova.com",
          href: "mailto:contact@dalnova.com",
          accent: "ember",
        },
        {
          label: "Appeler",
          value: "77 768 66 03",
          href: "tel:+221777686603",
          accent: "ember",
        },
        {
          label: "Appeler",
          value: "78 171 63 18",
          href: "tel:+221781716318",
          accent: "ember",
        },
        {
          label: "Nous trouver",
          value: "HLM4 Villa 1493, rue 122, Dakar",
          href: "https://www.google.com/maps/search/?api=1&query=HLM4+Villa+1493+rue+122+Dakar",
          accent: "arc",
        },
      ],
      ctaPrimary: "Demander un devis",
    },
    footer: {
      blurb:
        "Dalnova Technologies SARL — solutions informatiques innovantes pour les entreprises, les administrations et les organisations, à Dakar.",
      rights: "Tous droits réservés.",
      columns: [
        {
          title: "Services",
          links: [
            { label: "Développement", href: "#developpement" },
            { label: "Cloud et messagerie", href: "#cloud" },
            { label: "Réseaux et systèmes", href: "#reseaux" },
            { label: "Téléphonie IP", href: "#telephonie" },
            { label: "Sécurité physique", href: "#securite" },
            { label: "IA appliquée", href: "#ia" },
            { label: "Support et infogérance", href: "#support" },
            { label: "Équipements et licences", href: "#equipements" },
          ],
        },
        {
          title: "Société",
          links: [
            { label: "Méthode", href: "#methode" },
            { label: "Secteurs", href: "#secteurs" },
            { label: "Réalisations", href: "#realisations" },
            { label: "Contact", href: "#contact" },
          ],
        },
        {
          title: "Coordonnées",
          links: [
            { label: "HLM4 Villa 1493, rue 122, Dakar" },
            { label: "77 768 66 03", href: "tel:+221777686603" },
            { label: "78 171 63 18", href: "tel:+221781716318" },
            { label: "contact@dalnova.com", href: "mailto:contact@dalnova.com" },
          ],
        },
      ],
    },
  },

  en: {
    nav: [
      { href: "#services", label: "Services" },
      { href: "#methode", label: "Method" },
      { href: "#secteurs", label: "Sectors" },
      { href: "#realisations", label: "Work" },
      { href: "#contact", label: "Contact" },
    ],
    navCta: "Request a quote",
    hero: {
      eyebrow: "IT services · Dakar, Senegal",
      title: ["We run", "your IT,", "from cable", "to code."],
      lede: "From installing the server to building your line-of-business application, by way of the network and the physical security of your premises — we take your digital transformation end to end.",
      ctaPrimary: "Request a quote",
      ctaSecondary: "See our services",
      scrollHint: "Scroll",
    },
    spec: {
      label: "Ground covered",
      link: "See our services",
      value: "8",
      unit: "fields",
      floor: "Development",
      ceiling: "Equipment",
      min: 0,
      max: 8,
      now: 8,
      chips: [
        { label: "Point of contact", value: "One" },
        { label: "Invoice", value: "One" },
      ],
    },
    capabilities: {
      eyebrow: "Services",
      title: "Eight fields, one supplier",
      lede: "You lose time juggling three suppliers — one for the cameras, one for the network, another for the software. One team, one point of contact, one invoice.",
      items: [
        {
          id: "developpement",
          code: "DEV",
          accent: "arc",
          title: "Application development",
          lede: "Software that performs, scales, and fits what your business actually does — from the specification to production.",
          points: [
            "Web, mobile and desktop applications",
            "Professional websites",
            "Line-of-business software, built to fit",
            "From the specification through to production",
          ],
        },
        {
          id: "cloud",
          code: "CLD",
          accent: "arc",
          title: "Cloud, hosting and email",
          lede: "Choosing, deploying and running your hosting, email and cloud infrastructure on whichever platform suits you.",
          points: [
            "Cloud and web hosting",
            "Domain name management",
            "Business email",
            "Data migration and backup",
          ],
        },
        {
          id: "reseaux",
          code: "NET",
          accent: "arc",
          title: "Networks and systems",
          lede: "Designing, deploying and administering network and system infrastructure that is reliable, secure and sized for you.",
          points: [
            "LAN and WAN infrastructure, structured cabling",
            "Site interconnection: VPN, PtP and PtMP radio links",
            "Windows and Linux administration, virtualisation",
            "Active Directory, monitoring and hardening",
          ],
        },
        {
          id: "telephonie",
          code: "TEL",
          accent: "arc",
          title: "IP telephony",
          lede: "IP telephony and unified communications, to work together better and spend less on calls.",
          points: [
            "IP telephony on an IPBX",
            "VoIP rollout and number portability",
            "Unified communications",
            "Installation, configuration and call queues",
          ],
        },
        {
          id: "securite",
          code: "SEC",
          accent: "arc",
          title: "Physical security",
          lede: "Protecting your premises, your assets and your people with surveillance and access control that works.",
          points: [
            "IP video surveillance (CCTV)",
            "Access control",
            "Time and attendance systems",
            "NVR recorders and remote monitoring",
          ],
        },
        {
          id: "ia",
          code: "AI",
          accent: "arc",
          title: "Applied AI",
          lede: "Models wired into your own data and tools, working on your actual processes. A demo in a sandbox settles no case.",
          points: [
            "MCP servers: connecting your tools and data to the models",
            "Line-of-business assistants built around your procedures",
            "Integration with your applications and existing systems",
            "Release, monitoring and user training",
          ],
        },
        {
          id: "support",
          code: "SUP",
          accent: "ember",
          title: "IT support and managed services",
          lede: "Running, maintaining and watching your IT so it stays available, secure and quick — while you get on with your work.",
          points: [
            "IT maintenance",
            "On-site and remote technical assistance",
            "Managed servers and workstations",
            "Monitoring and estate management",
          ],
        },
        {
          id: "equipements",
          code: "EQP",
          accent: "ember",
          title: "Equipment and licences",
          lede: "Choosing, supplying, installing and integrating the hardware your work actually needs.",
          points: [
            "Computers and workstations",
            "Servers and storage",
            "Network equipment, printers and peripherals",
            "Software licences",
          ],
        },
      ],
      research: {
        label: "Research",
        title: "Blockchain for finance",
        body: "We are looking at distributed ledgers for transaction traceability, fewer intermediaries and programmable contracts. This is research — not yet something you can commission.",
      },
    },
    method: {
      eyebrow: "Method",
      title: "How we work",
      lede: "Five steps, from the first analysis through to support over time.",
      steps: [
        {
          n: "01",
          title: "Analysis",
          body: "Understanding your situation, your constraints and your goals.",
        },
        {
          n: "02",
          title: "Advice and design",
          body: "Designing the solution that best fits your organisation.",
        },
        {
          n: "03",
          title: "Deployment",
          body: "Putting it in place properly.",
        },
        {
          n: "04",
          title: "Training",
          body: "Leaving your people able to run the tools themselves.",
        },
        {
          n: "05",
          title: "Support and maintenance",
          body: "Keeping the system available and moving it forward.",
        },
      ],
    },
    sectors: {
      eyebrow: "Clients",
      title: "Sectors we work in",
      lede: "The same standard of reliability, whatever the trade.",
      items: [
        "Businesses",
        "Small and medium industry",
        "Public administration",
        "NGOs",
        "Schools",
        "Healthcare",
        "Industry",
        "Retail",
      ],
    },
    gallery: {
      eyebrow: "Work",
      title: "What we design",
      lede: "The architectures we deliver, as the client receives them — named equipment, addressing and monitoring included.",
      previous: "Previous project",
      next: "Next project",
      open: "Enlarge the drawing",
      close: "Close",
      emptyLabel: "Slot ",
      items: [
        {
          ...WORK.reseau,
          alt: "LAN infrastructure diagram: ISP router, MikroTik hEX, 24-port Cisco switch, Ubiquiti U6 access point, HP ProLiant server running Windows Server, Synology NAS, Zabbix and Grafana monitoring, and an addressing plan across four VLANs.",
          caption: "Network infrastructure and directory",
        },
        {
          ...WORK.supervision,
          alt: "Managed services diagram: the client estate — workstations, servers, backups, printers — linked over the internet to Dalnova's monitoring and helpdesk.",
          caption: "Managed IT for a client estate",
        },
        {
          ...WORK.video,
          alt: "Video surveillance diagram: eight IP cameras on a 16-port PoE switch and a 16-channel Hikvision recorder, with a monitoring screen and remote access from mobile.",
          caption: "Video surveillance and access control",
        },
        {
          ...WORK.voip,
          alt: "IP telephony diagram: carrier line, Yeastar S20 IPBX, switch and four GrandStream GRP2612W handsets.",
          caption: "Migration to IP telephony",
        },
      ],
    },
    partners: {
      label: "Partners",
      items: [
        {
          name: "Wikistartup",
          place: "Tunisia",
          href: "https://wikistartup.tn",
          logo: "/partners/wikistartup.webp",
          w: 300,
          h: 70,
        },
        {
          name: "ISRA — BAME",
          place: "Senegal",
          href: "https://www.isra-bame.sn",
          logo: "/partners/isra-bame.webp",
          w: 304,
          h: 149,
        },
        {
          name: "Enactus Morocco",
          place: "Morocco",
          href: "https://enactus-morocco.org",
          logo: "/partners/enactus-morocco.svg",
          w: 300,
          h: 100,
        },
        {
          name: "E4Impact",
          place: "International",
          href: "https://e4impact.org",
          logo: "/partners/e4impact.webp",
          w: 360,
          h: 101,
        },
      ],
    },
    contact: {
      eyebrow: "Contact",
      title: "Tell us about your project",
      lede: "Tell us what is blocking you. We look at what you need and propose something that fits.",
      channels: [
        {
          label: "Email",
          value: "contact@dalnova.com",
          href: "mailto:contact@dalnova.com",
          accent: "ember",
        },
        {
          label: "Call",
          value: "+221 77 768 66 03",
          href: "tel:+221777686603",
          accent: "ember",
        },
        {
          label: "Call",
          value: "+221 78 171 63 18",
          href: "tel:+221781716318",
          accent: "ember",
        },
        {
          label: "Find us",
          value: "HLM4 Villa 1493, rue 122, Dakar",
          href: "https://www.google.com/maps/search/?api=1&query=HLM4+Villa+1493+rue+122+Dakar",
          accent: "arc",
        },
      ],
      ctaPrimary: "Request a quote",
    },
    footer: {
      blurb:
        "Dalnova Technologies SARL — IT solutions for businesses, public bodies and organisations, based in Dakar.",
      rights: "All rights reserved.",
      columns: [
        {
          title: "Services",
          links: [
            { label: "Development", href: "#developpement" },
            { label: "Cloud and email", href: "#cloud" },
            { label: "Networks and systems", href: "#reseaux" },
            { label: "IP telephony", href: "#telephonie" },
            { label: "Physical security", href: "#securite" },
            { label: "Applied AI", href: "#ia" },
            { label: "Support and managed IT", href: "#support" },
            { label: "Equipment and licences", href: "#equipements" },
          ],
        },
        {
          title: "Company",
          links: [
            { label: "Method", href: "#methode" },
            { label: "Sectors", href: "#secteurs" },
            { label: "Work", href: "#realisations" },
            { label: "Contact", href: "#contact" },
          ],
        },
        {
          title: "Details",
          links: [
            { label: "HLM4 Villa 1493, rue 122, Dakar" },
            { label: "+221 77 768 66 03", href: "tel:+221777686603" },
            { label: "+221 78 171 63 18", href: "tel:+221781716318" },
            { label: "contact@dalnova.com", href: "mailto:contact@dalnova.com" },
          ],
        },
      ],
    },
  },
};

/* Hex for each accent, so the WebGL scenes and the DOM agree. Two sets: the
   night cyan is tuned to glow out of near black and turns to pastel on a pale
   ground, so daylight takes the same hue down until it can carry weight. The
   scenes cannot read a CSS variable, which is why these are here rather than
   only in the stylesheet. */
export const ACCENT_HEX: Record<Accent, string> = {
  arc: "#35d2ff",
  ember: "#ff9a45",
};

export const ACCENT_HEX_DAY: Record<Accent, string> = {
  arc: "#0a7ea8",
  ember: "#a85200",
};
