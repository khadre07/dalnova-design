/* eslint-disable @next/next/no-img-element -- The foreground layers are the
   author's own <img> tags, at the author's own paths, with the width and
   height the author measured. next/image would re-encode and re-serve them
   through a loader, which is precisely the rewriting the brief forbids —
   and these are already WebP, already sized, and already lazy. */
/* Kage's own markup, as React.

   The authored document rendered as components rather than as a page inside an
   iframe. That is the whole reason for the port: in an iframe the words are the
   iframe's, and a search engine indexing this domain finds an empty document.
   Rendered here they are this page's own DOM — served, crawlable, selectable,
   and readable aloud.

   Converted rather than retyped. Every element, attribute, id, class and string
   is the authored one; what changed is only what JSX requires — class becomes
   className, void elements close themselves, inline style strings become
   objects, and the author's chapter comments are kept as JSX comments because
   they say which foreground arrives when.

   The ids matter more than usual here: the authored script finds its canvas,
   its preloader and its sections by id, so renaming anything would quietly
   break the world it builds. */

export default function KageMarkup() {
  return (
    <>
      <canvas  id="gl" aria-hidden="true"></canvas>
      {/* The reading scrim. Over the canvas, under everything the page says. */}
      <div  className="read-scrim" aria-hidden="true"></div>
      <div  id="vignette"></div>
      <div  id="grain"></div>
      <div  className="cur-dot" id="cursor"></div>

      {/* ============================================================ preloader */}
      <div  id="pre">
        <div  className="pre-in">
          <div  className="pre-mark">
            <img  src="/brand/dalnova.webp" alt="" width="458" height="178" className="brand-logo" />
          </div>
          <div  className="pre-jp jp">DALNOVA TECHNOLOGIES</div>
          <div  className="pre-bar"><i  id="pre-fill"></i></div>
          <div  className="pre-meta">
            <span>Chargement de la scène</span><b><span  id="pre-pct">0</span>%</b>
          </div>
        </div>
      </div>

      {/* ============================================================ nav */}
      <header  className="nav" id="nav">
        <a  className="brand" href="#top" data-cursor>
          {/* The mark was a torii over a red disc — a gate and a sun, drawn in
              the authored palette. It is the real logo now, and a picture
              rather than a path: the file is what the company actually uses,
              and redrawing it as SVG would be a redrawing, not the logo. */}
          <img  src="/brand/dalnova.webp" alt="" width="458" height="178" className="brand-logo" />
          <span  className="brand-tx"><b>DALNOVA TECHNOLOGIES</b><i>SERVICES INFORMATIQUES · DAKAR</i></span>
        </a>
        <nav  className="nav-links" id="navlinks">
          <a  className="nav-link" href="#gate" data-cursor><span>Services</span><span  className="alt">01110011</span></a>
          <a  className="nav-link" href="#pathways" data-cursor><span>Réalisations</span><span  className="alt">01110010</span></a>
          <a  className="nav-link" href="#lessons" data-cursor><span>Secteurs</span><span  className="alt">01110011</span></a>
          <a  className="nav-link" href="#eternity" data-cursor><span>Contact</span><span  className="alt">01100011</span></a>
        </nav>
        <button  className="nav-burger" aria-label="Menu" data-cursor><i></i><i></i></button>
      </header>

      <div  className="page" id="top">

      {/* ============================================================ hero */}
      <section  className="hero" id="hero" data-cam="0">
        <div  className="hero-top">
          <div  className="eyebrow" data-rv="fade"><span  className="dot"></span> Chapitre 00 — Le point d’entrée</div>
          <h1  className="display h-hero">
            <span  className="mask-line"><span>On gère votre IT,</span></span>
            <span  className="mask-line"><span>du câble</span></span>
            <span  className="mask-line"><span>au code.</span></span>
          </h1>
          <p  className="hero-sub body" data-rv="up">De l’installation du serveur au développement de votre application
            métier — nous accompagnons votre transformation digitale de bout en bout.</p>
        </div>

        <div  className="hero-spacer"></div>

        <div  className="hero-foot">
          <div  className="hero-cue" data-rv="fade"><span>Faites défiler</span><span  className="track"><i></i></span></div>
          <div  className="chapters" id="chips">
            <div  className="chip" data-chip="0" data-rv="up" data-cursor><span  className="num">01</span>
              <span  className="tx"><b>Réseaux et systèmes</b><p>Infrastructures LAN et WAN, câblage structuré, administration et supervision.</p></span></div>
            <div  className="chip" data-chip="1" data-rv="up" data-cursor><span  className="num">02</span>
              <span  className="tx"><b>Développement</b><p>Applications web, mobiles et métier, de la conception à la mise en production.</p></span></div>
            <div  className="chip" data-chip="2" data-rv="up" data-cursor><span  className="num">03</span>
              <span  className="tx"><b>Sécurité physique</b><p>Vidéosurveillance, contrôle d’accès et protection de vos locaux.</p></span></div>
            <div  className="chip" data-chip="3" data-rv="up" data-cursor><span  className="num">04</span>
              <span  className="tx"><b>Support et infogérance</b><p>Maintenance, assistance sur site et à distance, supervision du parc.</p></span></div>
          </div>
        </div>

        <a  className="peek" href="#pathways" data-view="3" data-rv="fade" data-cursor aria-label="Aperçu : Dalnova sur site à Dakar">
          {/* data-frame, or the live view is blitted over the whole anchor and
               runs on down behind the caption instead of stopping at the frame */}
          <span  className="peek-fr" data-frame></span>
          <span  className="peek-play"><svg  viewBox="0 0 22 22" fill="none"><path  d="M8 5.6 16.4 11 8 16.4z" fill="#dfe7e0" /></svg></span>
          <span  className="peek-cap"><b  className="jp">SRV</b><i>Sur site à Dakar</i></span>
        </a>

        <div  className="word-fb" aria-hidden="true">DALNOVA</div>

        <div  className="hero-side" data-rv="up">
          <span  className="v jp">DALNOVA TECHNOLOGIES</span>
        </div>
      </section>

      {/* ============================================================ chapter I */}
      <section  className="sec" id="gate" data-cam="1">
        {/* foreground: the wall arrives first, the pine at the edge, the grass last */}
        <div  className="fg" data-fg="gate" aria-hidden="true">
          <span  className="fg-el fg-grass" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
          </span>
        </div>
        <div  className="sec-head" data-rv="fade">
          <span  className="k"><b>01</b> — Nos services</span><span  className="rule"></span><span  className="k jp">SRV</span>
        </div>
        <div  className="gate-grid">
          <h2  className="display h-sec" data-rv="up">Sept domaines, un seul prestataire.</h2>
          <div  className="gate-copy">
            <p  className="lead" data-rv="up">Dalnova commence là où votre métier s’arrête : le câble dans le mur, le
              serveur dans le local, l’application que vos équipes ouvrent chaque matin. Rien de tout cela n’est
              décoratif. C’est ce qui fait qu’une entreprise tient debout un lundi de panne.</p>
            <p  className="body" data-rv="up">Vous perdez du temps à jongler entre trois prestataires — un pour les
              caméras, un pour le réseau, un autre pour les logiciels. Une équipe unique, un interlocuteur unique,
              une facture unique. Sept domaines couverts de bout en bout, à Dakar, sur site et à distance.</p>
            <a  className="arrowlink" href="#pathways" data-rv="fade" data-cursor>
              <span>Voir comment nous travaillons</span>
              <span  className="ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
            </a>
          </div>
        </div>
        <div  className="gate-stats" data-rv="up">
          <div><b>07</b><span>Domaines</span></div>
          <div><b>05</b><span>Étapes</span></div>
          <div><b>2021</b><span>Fondée en</span></div>
          <div><b>∞</b><span>Dalnova Technologies</span></div>
        </div>
      </section>

      {/* ============================================================ chapter II */}
      <section  className="sec" id="pathways" data-cam="2">
        {/* foreground: the garden frames the mosaic from the sides and the two lower corners */}
        <div  className="fg" data-fg="pathways" aria-hidden="true">
          <span  className="fg-el fg-bush" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/garden-bush.webp" alt="" width="1717" height="876" loading="lazy" decoding="async" />
          </span>
        </div>
        <div  className="sec-head" data-rv="fade">
          <span  className="k"><b>02</b> — Nos réalisations</span><span  className="rule"></span><span  className="k jp">REF</span>
        </div>
        <div  className="cards" id="cards">
          <article  className="card" data-rv="up" data-view="0" data-cursor>
            <div  className="card-fr" data-frame>
              <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow" style={{ "--gx": "26.0%", "--gy": "79.0%", "--gr": "20%", "--gt": "6.1s", "--gt2": "9.7s", "--gc1": "rgba(53,210,255,.52)", "--gc2": "rgba(20,120,168,.26)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Supervision et infogérance</b><span  className="jp">SUP</span></div>
            </div>
            <div  className="card-meta"><span>Le parc sous surveillance</span><span>01 / 03</span></div>
          </article>
          <article  className="card" data-rv="up" data-view="1" data-cursor>
            <div  className="card-fr" data-frame>
              <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow glow--flame" style={{ "--gx": "72.0%", "--gy": "82.0%", "--gr": "13%", "--gt": "3.7s", "--gt2": "5.3s", "--gc1": "rgba(255,198,124,.62)", "--gc2": "rgba(226,118,40,.30)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Vidéosurveillance</b><span  className="jp">SEC</span></div>
            </div>
            <div  className="card-meta"><span>Les locaux sous l’œil</span><span>02 / 03</span></div>
          </article>
          <article  className="card" data-rv="up" data-view="2" data-cursor>
            <div  className="card-fr" data-frame>
              <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow" style={{ "--gx": "47.0%", "--gy": "77.0%", "--gr": "18%", "--gt": "7.3s", "--gt2": "11.2s", "--gc1": "rgba(53,210,255,.50)", "--gc2": "rgba(18,110,158,.24)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Réseau et Active Directory</b><span  className="jp">NET</span></div>
            </div>
            <div  className="card-meta"><span>Le parc annuaire</span><span>03 / 03</span></div>
          </article>
        </div>
      </section>

      {/* ============================================================ chapter III */}
      <section  className="sec" id="lessons" data-cam="3">
        {/* foreground: a low periphery for the atlas — wall fragment, basalt, one stand of grass */}
        <div  className="fg" data-fg="lessons" aria-hidden="true">
          <span  className="fg-el fg-stones" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/basalt-stones.webp" alt="" width="1536" height="996" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-grass" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
          </span>
        </div>
        <div  className="sec-head" data-rv="fade">
          <span  className="k"><b>03</b> — Nos domaines</span><span  className="rule"></span><span  className="k jp">CAT</span>
        </div>
        <div  className="cur-head">
          <h2  className="display h-sec" data-rv="up">Sept domaines. Un interlocuteur. Une facture.</h2>
          <p  className="body-lg" data-rv="up">Chaque domaine est un métier, pas une ligne de catalogue. On installe, on
            configure, on supervise, et on reste joignable après la mise en service.</p>
        </div>
        <div  className="cur" id="cur">
          <div  className="les" data-les="0" data-cursor>
            <span  className="k">01</span>
            <h3>Réseaux et systèmes</h3>
            <p>Infrastructures LAN et WAN, câblage structuré, VPN et liaison radio, administration Windows et Linux.</p>
            <span  className="t">NET</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="1" data-cursor>
            <span  className="k">02</span>
            <h3>Développement d’applications</h3>
            <p>Applications web, mobiles et métier, de la conception à la mise en production.</p>
            <span  className="t">DEV</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="2" data-cursor>
            <span  className="k">03</span>
            <h3>Sécurité physique</h3>
            <p>Vidéosurveillance, contrôle d’accès, protection des locaux et supervision.</p>
            <span  className="t">SEC</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="3" data-cursor>
            <span  className="k">04</span>
            <h3>IA appliquée</h3>
            <p>Serveurs MCP et IA métier, branchés sur vos données et vos outils réels.</p>
            <span  className="t">IA</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="4" data-cursor>
            <span  className="k">05</span>
            <h3>Support IT et infogérance</h3>
            <p>Maintenance, assistance sur site et à distance, supervision du parc.</p>
            <span  className="t">SUP</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="5" data-cursor>
            <span  className="k">06</span>
            <h3>Équipements et licences</h3>
            <p>Choix, fourniture, installation et intégration du matériel et des licences.</p>
            <span  className="t">EQP</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="6" data-cursor>
            <span  className="k">07</span>
            <h3>Blockchain et finance</h3>
            <p>Recherche appliquée sur les registres distribués et leurs usages financiers. Le plus jeune de nos domaines — nous le proposons, et nous le disons.</p>
            <span  className="t">R&amp;D</span><i  className="bar"></i>
          </div>
        </div>
      </section>

      {/* ============================================================ chapter IV */}
      <section  className="sec fin" id="eternity" data-cam="4">
        {/* foreground: the closing horizon: hill, ruins, grass, and the last branch */}
        <div  className="fg" data-fg="eternity" aria-hidden="true">
          <span  className="fg-el fg-hill" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/hill.webp" alt="" width="1774" height="887" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-grass" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
          </span>
        </div>
        <div  className="eyebrow" data-rv="fade">Chapitre 04 — Contact</div>
        <h2  className="display" data-rv="up">Contact</h2>
        <p  className="body-lg" data-rv="up">The gate does not close behind you. Take the walk whenever the noise
          gets loud — it is always the same path, and never the same light.</p>
        <a  className="cta" href="#top" data-rv="fade" data-cursor>
          <i></i><span>Demander un devis</span>
          <svg  viewBox="0 0 14 14" fill="none" width="13" height="13"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg>
        </a>
      </section>

      {/* ============================================================ footer */}
      <footer  className="foot" data-cam="5">
        {/* foreground: one planting along the lower edge of the colophon */}
        <div  className="fg" data-fg="foot" aria-hidden="true">
          <span  className="fg-el fg-bush" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/garden-bush.webp" alt="" width="1717" height="876" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-grass" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-stones" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/basalt-stones.webp" alt="" width="1536" height="996" loading="lazy" decoding="async" />
          </span>
        </div>
        <div  className="foot-grid">
          <div  className="foot-brand">
            <img  src="/brand/dalnova.webp" alt="" width="458" height="178" className="brand-logo" />
            <p>Dalnova Technologies SARL — solutions informatiques pour les entreprises, les administrations et
              les organisations, à Dakar.</p>
          </div>
          <div><h4>Domaines</h4><ul>
            <li><a  href="#gate" data-cursor>Services</a></li>
            <li><a  href="#pathways" data-cursor>Développement</a></li>
            <li><a  href="#lessons" data-cursor>Sécurité physique</a></li>
            <li><a  href="#eternity" data-cursor>Contact</a></li>
          </ul></div>
          <div><h4>Domaines</h4><ul>
            <li><a  href="#lessons" data-cursor>IA appliquée</a></li>
            <li><a  href="#lessons" data-cursor>Support et infogérance</a></li>
            <li><a  href="#lessons" data-cursor>Équipements et licences</a></li>
            <li><a  href="#lessons" data-cursor>Blockchain et finance</a></li>
          </ul></div>
          <div><h4>Ailleurs</h4><ul>
            <li><a  href="#top" data-cursor>Réalisations</a></li>
            <li><a  href="#top" data-cursor>Nos schémas</a></li>
            <li><a  href="#top" data-cursor>Mentions</a></li>
          </ul></div>
        </div>
        <div  className="foot-base">
          <span>© 2026 Dalnova Technologies SARL</span>
          <span  className="jp">Du câble au code — Dakar, Sénégal</span>
          <span>WebGL · Onest · Dakar</span>
        </div>
      </footer>

      </div>{/* /.page */}

      {/* The near plane of the active chapter is parked here rather than inside its
           section: .page is a stacking context at z-index 10, so nothing living in it
           can rise past the nav. #fg-sky sits above the whole layout instead. */}
      <div  id="fg-sky" aria-hidden="true"></div>

      <div  className="rail" id="rail"></div>
    </>
  );
}
