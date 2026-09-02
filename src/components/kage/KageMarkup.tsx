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
      <div  id="vignette"></div>
      <div  id="grain"></div>
      <div  className="cur-dot" id="cursor"></div>

      {/* ============================================================ preloader */}
      <div  id="pre">
        <div  className="pre-in">
          <div  className="pre-mark">
            <svg  viewBox="0 0 44 44" fill="none" aria-hidden="true">
              <circle  cx="22" cy="24" r="9.5" stroke="#e0231c" strokeWidth="1.2" />
              <path  d="M6 12h32M9.5 17h25M22 8v28" stroke="#dfe7e0" strokeWidth="1.2" />
            </svg>
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
          <svg  viewBox="0 0 44 44" fill="none" aria-hidden="true">
            <circle  cx="22" cy="25" r="8.6" fill="#e0231c" fillOpacity=".9" />
            <path  d="M5 13h34M9 18.4h26M22 8.5v27" stroke="#dfe7e0" strokeWidth="1.5" />
            <path  d="M14 35.5h16" stroke="#dfe7e0" strokeWidth="1.2" strokeOpacity=".6" />
          </svg>
          <span  className="brand-tx"><b>DALNOVA TECHNOLOGIES</b><i>SERVICES INFORMATIQUES · DAKAR</i></span>
        </a>
        <nav  className="nav-links" id="navlinks">
          <a  className="nav-link" href="#gate" data-cursor><span>Services</span><span  className="alt">SRV</span></a>
          <a  className="nav-link" href="#pathways" data-cursor><span>Méthode</span><span  className="alt">MTH</span></a>
          <a  className="nav-link" href="#lessons" data-cursor><span>Secteurs</span><span  className="alt">SEC</span></a>
          <a  className="nav-link" href="#eternity" data-cursor><span>Contact</span><span  className="alt">CTC</span></a>
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
          <span  className="peek-cap"><b  className="jp">SRV</b><i>Dalnova Technologies — sur site à Dakar</i></span>
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
          <span  className="fg-el fg-wall" data-fg-in="left">
            <img  src="secret-pathways-assets/foreground/png/temple-wall.webp" alt="" width="1536" height="884" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-pine" data-fg-in="right">
            <img  src="secret-pathways-assets/foreground/png/pine-tree.webp" alt="" width="1024" height="1438" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-grass" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
          </span>
        </div>
        <div  className="sec-head" data-rv="fade">
          <span  className="k"><b>01</b> — Nos services</span><span  className="rule"></span><span  className="k jp">SRV</span>
        </div>
        <div  className="gate-grid">
          <h2  className="display h-sec" data-rv="up">Huit domaines, un seul prestataire.</h2>
          <div  className="gate-copy">
            <p  className="lead" data-rv="up">Dalnova commence là où votre métier s’arrête : le câble dans le mur, le
              serveur dans le local, l’application que vos équipes ouvrent chaque matin. Rien de tout cela n’est
              décoratif. C’est ce qui fait qu’une entreprise tient debout un lundi de panne.</p>
            <p  className="body" data-rv="up">Vous perdez du temps à jongler entre trois prestataires — un pour les
              caméras, un pour le réseau, un autre pour les logiciels. Une équipe unique, un interlocuteur unique,
              une facture unique. Huit domaines couverts de bout en bout, à Dakar, sur site et à distance.</p>
            <a  className="arrowlink" href="#pathways" data-rv="fade" data-cursor>
              <span>Découvrir nos services</span>
              <span  className="ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
            </a>
          </div>
        </div>
        <div  className="gate-stats" data-rv="up">
          <div><b>05</b><span>Domaines</span></div>
          <div><b>05</b><span>Étapes</span></div>
          <div><b>2021</b><span>Fondée en</span></div>
          <div><b>∞</b><span>Dalnova Technologies</span></div>
        </div>
      </section>

      {/* ============================================================ chapter II */}
      <section  className="sec" id="pathways" data-cam="2">
        {/* foreground: the garden frames the mosaic from the sides and the two lower corners */}
        <div  className="fg" data-fg="pathways" aria-hidden="true">
          <span  className="fg-el fg-sakura fg-el--sway" data-fg-in="left">
            <img  src="secret-pathways-assets/foreground/png/sakura-branch.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-leaves fg-el--sway" data-fg-in="right">
            <img  src="secret-pathways-assets/foreground/png/maple-leaves.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-lantern" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/stone-lantern.webp" alt="" width="1024" height="1499" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-bush" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/garden-bush.webp" alt="" width="1717" height="876" loading="lazy" decoding="async" />
          </span>
        </div>
        <div  className="sec-head" data-rv="fade">
          <span  className="k"><b>02</b> — Notre méthode</span><span  className="rule"></span><span  className="k jp">MTH</span>
        </div>
        <div  className="cards" id="cards">
          <article  className="card" data-rv="up" data-view="0" data-cursor>
            <div  className="card-fr" data-frame>
                      <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow" style={{ "--gx": "80.2%", "--gy": "23.9%", "--gr": "22%", "--gt": "6.1s", "--gt2": "9.7s", "--gc1": "rgba(255,142,108,.50)", "--gc2": "rgba(212,56,38,.24)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Analyse des besoins</b><span  className="jp">01</span></div>
            </div>
            <div  className="card-meta"><span>Comprendre votre contexte</span><span>01 / 03</span></div>
          </article>
          <article  className="card" data-rv="up" data-view="1" data-cursor>
            <div  className="card-fr" data-frame>
                      <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow glow--flame" style={{ "--gx": "70.5%", "--gy": "47.2%", "--gr": "14%", "--gt": "3.7s", "--gt2": "5.3s", "--gc1": "rgba(255,198,124,.62)", "--gc2": "rgba(226,118,40,.30)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Conseil et conception</b><span  className="jp">02</span></div>
            </div>
            <div  className="card-meta"><span>Concevoir la solution</span><span>02 / 03</span></div>
          </article>
          <article  className="card" data-rv="up" data-view="2" data-cursor>
            <div  className="card-fr" data-frame>
                      <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow" style={{ "--gx": "48.0%", "--gy": "16.8%", "--gr": "20%", "--gt": "7.3s", "--gt2": "11.2s", "--gc1": "rgba(255,138,104,.52)", "--gc2": "rgba(208,54,36,.24)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Déploiement</b><span  className="jp">03</span></div>
            </div>
            <div  className="card-meta"><span>Mettre en œuvre</span><span>03 / 03</span></div>
          </article>
        </div>
      </section>

      {/* ============================================================ chapter III */}
      <section  className="sec" id="lessons" data-cam="3">
        {/* foreground: a low periphery for the atlas — wall fragment, basalt, one stand of grass */}
        <div  className="fg" data-fg="lessons" aria-hidden="true">
          <span  className="fg-el fg-wall fg-el--flip" data-fg-in="right">
            <img  src="secret-pathways-assets/foreground/png/temple-wall.webp" alt="" width="1536" height="884" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-stones" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/basalt-stones.webp" alt="" width="1536" height="996" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-grass" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
          </span>
        </div>
        <div  className="sec-head" data-rv="fade">
          <span  className="k"><b>03</b> — Nos domaines</span><span  className="rule"></span><span  className="k jp">REF</span>
        </div>
        <div  className="cur-head">
          <h2  className="display h-sec" data-rv="up">Huit domaines. Un interlocuteur. Une facture.</h2>
          <p  className="body-lg" data-rv="up">Chaque domaine est un métier, pas une ligne de catalogue. On installe, on
            configure, on supervise, et on reste joignable après la mise en service.</p>
        </div>
        <div  className="cur" id="cur">
          <div  className="les" data-les="0" data-cursor>
            <span  className="k">01</span>
            <h3>Réseaux et systèmes<em  className="jp">SRV</em></h3>
            <p>Infrastructures LAN et WAN, câblage structuré, VPN et liaison radio, administration Windows et Linux.</p>
            <span  className="t">NET</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="1" data-cursor>
            <span  className="k">02</span>
            <h3>Cloud et messagerie<em  className="jp">NET</em></h3>
            <p>Hébergement, messagerie professionnelle, noms de domaine, migration et sauvegarde.</p>
            <span  className="t">CLD</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="2" data-cursor>
            <span  className="k">03</span>
            <h3>Téléphonie IP<em  className="jp">CLD</em></h3>
            <p>IPBX, déploiement VoIP, portabilité des numéros, communications unifiées.</p>
            <span  className="t">TEL</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="3" data-cursor>
            <span  className="k">04</span>
            <h3>IA appliquée<em  className="jp">02</em></h3>
            <p>Serveurs MCP et IA métier, mises au service de vos processus réels.</p>
            <span  className="t">IA</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="4" data-cursor>
            <span  className="k">05</span>
            <h3>Sécurité physique<em  className="jp">IA</em></h3>
            <p>Vidéosurveillance, contrôle d’accès, protection des locaux et supervision.</p>
            <span  className="t">SEC</span><i  className="bar"></i>
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
          <span  className="fg-el fg-ruins" data-fg-in="left">
            <img  src="secret-pathways-assets/foreground/png/shrine-ruins.webp" alt="" width="1536" height="1001" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-grass" data-fg-in="up">
            <img  src="secret-pathways-assets/foreground/png/tall-grass.webp" alt="" width="1717" height="916" loading="lazy" decoding="async" />
          </span>
          <span  className="fg-el fg-sakura" data-fg-in="left">
            <img  src="secret-pathways-assets/foreground/png/sakura-branch.webp" alt="" width="1536" height="1024" loading="lazy" decoding="async" />
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
            <svg  viewBox="0 0 44 44" fill="none" width="34" height="34" aria-hidden="true">
              <circle  cx="22" cy="25" r="8.6" fill="#e0231c" fillOpacity=".9" />
              <path  d="M5 13h34M9 18.4h26M22 8.5v27" stroke="#dfe7e0" strokeWidth="1.5" />
            </svg>
            <p>Dalnova Technologies SARL — solutions informatiques pour les entreprises, les administrations et
              les organisations, à Dakar.</p>
          </div>
          <div><h4>Domaines</h4><ul>
            <li><a  href="#gate" data-cursor>Services</a></li>
            <li><a  href="#pathways" data-cursor>Développement</a></li>
            <li><a  href="#lessons" data-cursor>Sécurité physique</a></li>
            <li><a  href="#eternity" data-cursor>Contact</a></li>
          </ul></div>
          <div><h4>Méthode</h4><ul>
            <li><a  href="#lessons" data-cursor>Cloud et messagerie</a></li>
            <li><a  href="#lessons" data-cursor>IA appliquée</a></li>
            <li><a  href="#lessons" data-cursor>Téléphonie IP</a></li>
            <li><a  href="#lessons" data-cursor>Sécurité physique</a></li>
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
