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
  /* The headline commitment, read as an instrument: one figure with its unit,
     a gauge showing it against the floor the contract guarantees, and the two
     secondary readings beside it. */
  spec: {
    label: string;
    link: string;
    value: string;
    unit: string;
    floor: string;
    ceiling: string;
    /** Real numbers, for the gauge's width and for assistive technology. */
    min: number;
    max: number;
    now: number;
    chips: { label: string; value: string }[];
  };
  capabilities: { eyebrow: string; title: string; lede: string; items: Capability[] };
  method: {
    eyebrow: string;
    title: string;
    lede: string;
    steps: { n: string; duration: string; title: string; body: string }[];
  };
  proof: {
    eyebrow: string;
    title: string;
    note: string;
    stats: { value: string; unit: string; label: string }[];
  };
  /* Placeholders on purpose. Drop files into public/ and set `src`; the frame
     stops announcing itself as empty the moment there is something in it.
     Nothing here invents a client, a project or a relationship. */
  gallery: {
    eyebrow: string;
    title: string;
    lede: string;
    previous: string;
    next: string;
    emptyLabel: string;
    items: { src: string; alt: string; caption: string }[];
  };
  partners: { label: string; slots: string[] };
  contact: {
    eyebrow: string;
    title: string;
    lede: string;
    channels: { label: string; value: string; href: string; accent: Accent }[];
    ctaPrimary: string;
  };
  /* A footer link either goes somewhere or it is not a link. Columns whose
     pages do not exist yet render as plain text rather than as anchors back to
     the top of the page, which is a dead end dressed up as navigation. */
  footer: {
    blurb: string;
    rights: string;
    columns: { title: string; links: { label: string; href?: string }[] }[];
  };
};

export const CONTENT: Record<Lang, Content> = {
  fr: {
    nav: [
      { href: "#capacites", label: "Capacités" },
      { href: "#methode", label: "Méthode" },
      { href: "#preuves", label: "Preuves" },
      { href: "#contact", label: "Contact" },
    ],
    navCta: "Parler à un ingénieur",
    hero: {
      eyebrow: "Infogérance · IA · Blockchain · Support",
      title: ["Vos systèmes", "tournent. Même", "à 3 h du matin."],
      lede: "Dalnova exploite votre infrastructure, met vos modèles d'IA en production et sécurise vos registres blockchain. Une seule équipe, un seul numéro, et quelqu'un qui décroche.",
      ctaPrimary: "Parler à un ingénieur",
      ctaSecondary: "Voir nos engagements",
      scrollHint: "Faites défiler",
    },
    spec: {
      label: "Disponibilité engagée",
      link: "Voir les engagements",
      value: "99,95",
      unit: "%",
      floor: "99,00 %",
      ceiling: "100 %",
      min: 99,
      max: 100,
      now: 99.95,
      chips: [
        { label: "Prise en charge", value: "< 15 min" },
        { label: "Supervision", value: "24/7/365" },
      ],
    },
    capabilities: {
      eyebrow: "Capacités",
      title: "Quatre métiers, une seule astreinte",
      lede: "L'ingénieur qui écrit votre pipeline de données est celui qui répond quand il tombe. Nous ne sous-traitons ni l'exploitation, ni le support.",
      items: [
        {
          id: "infogerance",
          code: "INF",
          accent: "arc",
          title: "Infogérance",
          lede: "Supervision, correctifs, sauvegardes et capacité. Nous prenons la main sur votre parc sans coupure, et la rendons si vous partez.",
          points: [
            "Supervision continue, alertes qualifiées avant appel",
            "Correctifs et montées de version planifiés",
            "Sauvegardes testées par restauration réelle",
            "Réversibilité écrite au contrat, pas promise à l'oral",
          ],
        },
        {
          id: "support",
          code: "SUP",
          accent: "ember",
          title: "Support",
          lede: "Une hotline tenue par les ingénieurs qui exploitent vos serveurs. Pas de niveau 1 qui vous fait répéter votre problème trois fois.",
          points: [
            "Un interlocuteur nommé, joignable directement",
            "Prise en charge sous 15 minutes en heures ouvrées",
            "Astreinte de nuit et de week-end sur incident bloquant",
            "Chaque ticket clos par une cause, pas par un redémarrage",
          ],
        },
        {
          id: "ia",
          code: "IA",
          accent: "arc",
          title: "IA appliquée",
          lede: "Des modèles qui tournent en production, versionnés et surveillés. Une démonstration en notebook ne dérange personne quand elle dérive.",
          points: [
            "Cadrage sur une décision métier mesurable",
            "Déploiement versionné, retour arrière en une commande",
            "Surveillance de la dérive et des coûts d'inférence",
            "Documentation lisible par vos équipes, pas seulement par nous",
          ],
        },
        {
          id: "blockchain",
          code: "BLK",
          accent: "arc",
          title: "Blockchain",
          lede: "Registres, contrats intelligents et audits. Pour les traçabilités qui devront tenir devant un auditeur ou un juge.",
          points: [
            "Choix du registre justifié par écrit, jamais par la mode",
            "Contrats audités avant tout déploiement en production",
            "Clés gérées en HSM, procédures de rotation testées",
            "Passerelles vers vos systèmes existants",
          ],
        },
      ],
    },
    method: {
      eyebrow: "Méthode",
      title: "Comment on démarre",
      lede: "Trois étapes, dans cet ordre. Nous ne reprenons pas une infrastructure que nous n'avons pas mesurée.",
      steps: [
        {
          n: "01",
          duration: "2 semaines",
          title: "Audit",
          body: "Nous cartographions le parc, mesurons ce qui tombe et pourquoi, et vous rendons un état des lieux chiffré. Il vous appartient, même si vous ne signez pas.",
        },
        {
          n: "02",
          duration: "4 à 6 semaines",
          title: "Reprise",
          body: "Bascule planifiée, fenêtre annoncée, retour arrière préparé. Votre prestataire actuel reste en place jusqu'à la dernière vérification.",
        },
        {
          n: "03",
          duration: "En continu",
          title: "Exploitation",
          body: "Supervision permanente, comité mensuel, et un rapport que votre direction peut lire sans traducteur. Les indicateurs sont ceux de votre contrat.",
        },
      ],
    },
    proof: {
      eyebrow: "Preuves",
      title: "Ce que nous engageons",
      note: "Indicateurs contractuels. Les valeurs constatées sont publiées chaque mois dans votre espace client.",
      stats: [
        { value: "99,95", unit: "%", label: "Disponibilité engagée" },
        { value: "15", unit: "min", label: "Prise en charge" },
        { value: "24/7", unit: "", label: "Supervision" },
        { value: "30", unit: "j", label: "Préavis de réversibilité" },
      ],
    },
    gallery: {
      eyebrow: "Terrain",
      title: "Ce que nous exploitons",
      lede: "Salles, baies, consoles, interventions. Remplacez ces cadres par vos propres photos : un cliché réel vaut plus que tout le reste de cette page.",
      previous: "Image précédente",
      next: "Image suivante",
      emptyLabel: "Emplacement ",
      items: [
        { src: "", alt: "", caption: "Salle serveurs — à remplacer" },
        { src: "", alt: "", caption: "Console de supervision — à remplacer" },
        { src: "", alt: "", caption: "Intervention sur site — à remplacer" },
      ],
    },
    partners: {
      label: "Partenaires et certifications",
      slots: ["Logo 01", "Logo 02", "Logo 03", "Logo 04", "Logo 05", "Logo 06"],
    },
    contact: {
      eyebrow: "Contact",
      title: "Un incident, un projet, ou une question d'architecture",
      lede: "Écrivez-nous ce qui vous bloque. Un ingénieur vous répond, pas un formulaire de qualification.",
      channels: [
        { label: "Écrire", value: "contact@dalnova.tech", href: "mailto:contact@dalnova.tech", accent: "ember" },
        { label: "Appeler", value: "+33 1 84 80 00 00", href: "tel:+33184800000", accent: "ember" },
        { label: "Urgence client", value: "Espace client · 24/7", href: "#contact", accent: "arc" },
      ],
      ctaPrimary: "Demander un audit",
    },
    footer: {
      blurb: "Dalnova Technologies exploite, sécurise et outille les systèmes d'information de ses clients.",
      rights: "Tous droits réservés.",
      columns: [
        {
          title: "Métiers",
          links: [
            { label: "Infogérance", href: "#infogerance" },
            { label: "Support", href: "#support" },
            { label: "IA appliquée", href: "#ia" },
            { label: "Blockchain", href: "#blockchain" },
          ],
        },
        {
          title: "Société",
          links: [{ label: "À propos" }, { label: "Recrutement" }, { label: "Références" }],
        },
        {
          title: "Légal",
          links: [
            { label: "Mentions légales" },
            { label: "Confidentialité" },
            { label: "Sécurité" },
          ],
        },
      ],
    },
  },

  en: {
    nav: [
      { href: "#capacites", label: "Capabilities" },
      { href: "#methode", label: "Method" },
      { href: "#preuves", label: "Commitments" },
      { href: "#contact", label: "Contact" },
    ],
    navCta: "Talk to an engineer",
    hero: {
      eyebrow: "Managed IT · AI · Blockchain · Support",
      title: ["Your systems", "stay up. Even", "at 3 in the morning."],
      lede: "Dalnova runs your infrastructure, puts your AI models into production and secures your blockchain ledgers. One team, one number, and someone who picks up.",
      ctaPrimary: "Talk to an engineer",
      ctaSecondary: "See our commitments",
      scrollHint: "Scroll",
    },
    spec: {
      label: "Committed availability",
      link: "See our commitments",
      value: "99.95",
      unit: "%",
      floor: "99.00 %",
      ceiling: "100 %",
      min: 99,
      max: 100,
      now: 99.95,
      chips: [
        { label: "First response", value: "< 15 min" },
        { label: "Monitoring", value: "24/7/365" },
      ],
    },
    capabilities: {
      eyebrow: "Capabilities",
      title: "Four disciplines, one on-call rota",
      lede: "The engineer who writes your data pipeline is the one who answers when it breaks. We subcontract neither operations nor support.",
      items: [
        {
          id: "infogerance",
          code: "INF",
          accent: "arc",
          title: "Managed IT",
          lede: "Monitoring, patching, backups and capacity. We take over your estate without downtime, and hand it back if you leave.",
          points: [
            "Continuous monitoring, alerts qualified before we call",
            "Patching and upgrades on a published schedule",
            "Backups proven by real restores, not by green ticks",
            "Exit terms written into the contract, not promised verbally",
          ],
        },
        {
          id: "support",
          code: "SUP",
          accent: "ember",
          title: "Support",
          lede: "A helpdesk staffed by the engineers who run your servers. No tier one making you explain the problem three times.",
          points: [
            "A named contact you can reach directly",
            "15-minute first response during business hours",
            "Night and weekend on-call for blocking incidents",
            "Every ticket closed with a cause, not with a reboot",
          ],
        },
        {
          id: "ia",
          code: "AI",
          accent: "arc",
          title: "Applied AI",
          lede: "Models that run in production, versioned and watched. A notebook demo bothers nobody when it drifts.",
          points: [
            "Scoped around one measurable business decision",
            "Versioned deploys, rollback in a single command",
            "Drift and inference-cost monitoring",
            "Documentation your team can read, not only ours",
          ],
        },
        {
          id: "blockchain",
          code: "BLK",
          accent: "arc",
          title: "Blockchain",
          lede: "Ledgers, smart contracts and audits. For the traceability that has to hold up in front of an auditor or a court.",
          points: [
            "Ledger choice justified in writing, never by fashion",
            "Contracts audited before any production deploy",
            "Keys held in HSM, rotation procedures tested",
            "Bridges into the systems you already run",
          ],
        },
      ],
    },
    method: {
      eyebrow: "Method",
      title: "How we start",
      lede: "Three steps, in this order. We do not take over infrastructure we have not measured.",
      steps: [
        {
          n: "01",
          duration: "2 weeks",
          title: "Audit",
          body: "We map the estate, measure what fails and why, and hand you a costed assessment. It is yours to keep, even if you do not sign.",
        },
        {
          n: "02",
          duration: "4 to 6 weeks",
          title: "Handover",
          body: "Planned cutover, announced window, rollback prepared. Your current provider stays in place until the last check passes.",
        },
        {
          n: "03",
          duration: "Ongoing",
          title: "Operations",
          body: "Continuous monitoring, a monthly review, and a report your board can read without a translator. The metrics are the ones in your contract.",
        },
      ],
    },
    proof: {
      eyebrow: "Commitments",
      title: "What we sign up to",
      note: "Contractual targets. Measured values are published every month in your client portal.",
      stats: [
        { value: "99.95", unit: "%", label: "Committed availability" },
        { value: "15", unit: "min", label: "First response" },
        { value: "24/7", unit: "", label: "Monitoring" },
        { value: "30", unit: "d", label: "Exit notice" },
      ],
    },
    gallery: {
      eyebrow: "On the ground",
      title: "What we actually run",
      lede: "Rooms, racks, consoles, call-outs. Replace these frames with your own photographs: one real picture is worth more than the rest of this page.",
      previous: "Previous image",
      next: "Next image",
      emptyLabel: "Slot ",
      items: [
        { src: "", alt: "", caption: "Server room — to replace" },
        { src: "", alt: "", caption: "Monitoring console — to replace" },
        { src: "", alt: "", caption: "On-site call-out — to replace" },
      ],
    },
    partners: {
      label: "Partners and certifications",
      slots: ["Logo 01", "Logo 02", "Logo 03", "Logo 04", "Logo 05", "Logo 06"],
    },
    contact: {
      eyebrow: "Contact",
      title: "An incident, a project, or an architecture question",
      lede: "Tell us what is blocking you. An engineer replies, not a qualification form.",
      channels: [
        { label: "Email", value: "contact@dalnova.tech", href: "mailto:contact@dalnova.tech", accent: "ember" },
        { label: "Call", value: "+33 1 84 80 00 00", href: "tel:+33184800000", accent: "ember" },
        { label: "Client emergency", value: "Client portal · 24/7", href: "#contact", accent: "arc" },
      ],
      ctaPrimary: "Request an audit",
    },
    footer: {
      blurb: "Dalnova Technologies runs, secures and tools the information systems of its clients.",
      rights: "All rights reserved.",
      columns: [
        {
          title: "Disciplines",
          links: [
            { label: "Managed IT", href: "#infogerance" },
            { label: "Support", href: "#support" },
            { label: "Applied AI", href: "#ia" },
            { label: "Blockchain", href: "#blockchain" },
          ],
        },
        {
          title: "Company",
          links: [{ label: "About" }, { label: "Careers" }, { label: "References" }],
        },
        {
          title: "Legal",
          links: [{ label: "Legal notice" }, { label: "Privacy" }, { label: "Security" }],
        },
      ],
    },
  },
};

export const ACCENT_HEX: Record<Accent, string> = {
  arc: "#35d2ff",
  ember: "#ff9a45",
};
