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
          <div  className="pre-jp jp">影の道</div>
          <div  className="pre-bar"><i  id="pre-fill"></i></div>
          <div  className="pre-meta">
            <span>Raising the mountain temple</span><b><span  id="pre-pct">0</span>%</b>
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
          <span  className="brand-tx"><b>KAGE</b><i>HIDDEN REALMS OF KYOTO</i></span>
        </a>
        <nav  className="nav-links" id="navlinks">
          <a  className="nav-link" href="#gate" data-cursor><span>Temples</span><span  className="alt">伽藍</span></a>
          <a  className="nav-link" href="#pathways" data-cursor><span>Gardens</span><span  className="alt">庭園</span></a>
          <a  className="nav-link" href="#lessons" data-cursor><span>Rituals</span><span  className="alt">神事</span></a>
          <a  className="nav-link" href="#eternity" data-cursor><span>Afterlight</span><span  className="alt">残光</span></a>
        </nav>
        <button  className="nav-burger" aria-label="Menu" data-cursor><i></i><i></i></button>
      </header>

      <div  className="page" id="top">

      {/* ============================================================ hero */}
      <section  className="hero" id="hero" data-cam="0">
        <div  className="hero-top">
          <div  className="eyebrow" data-rv="fade"><span  className="dot"></span> Chapter 00 — The Hidden Gate</div>
          <h1  className="display h-hero">
            <span  className="mask-line"><span>Where stillness</span></span>
            <span  className="mask-line"><span>reveals the</span></span>
            <span  className="mask-line"><span>unseen.</span></span>
          </h1>
          <p  className="hero-sub body" data-rv="up">Enter Kyoto through its quiet thresholds, where ritual,
            craft, and memory shape the path.</p>
        </div>

        <div  className="hero-spacer"></div>

        <div  className="hero-foot">
          <div  className="hero-cue" data-rv="fade"><span>Scroll to enter</span><span  className="track"><i></i></span></div>
          <div  className="chapters" id="chips">
            <div  className="chip" data-chip="0" data-rv="up" data-cursor><span  className="num">01</span>
              <span  className="tx"><b>Thresholds</b><p>Discover the hidden gates that open on to deeper paths.</p></span></div>
            <div  className="chip" data-chip="1" data-rv="up" data-cursor><span  className="num">02</span>
              <span  className="tx"><b>Still Gardens</b><p>Witness the courts where silence gently unfolds.</p></span></div>
            <div  className="chip" data-chip="2" data-rv="up" data-cursor><span  className="num">03</span>
              <span  className="tx"><b>Sacred Craft</b><p>Embrace the hands and heritage that shape devotion.</p></span></div>
            <div  className="chip" data-chip="3" data-rv="up" data-cursor><span  className="num">04</span>
              <span  className="tx"><b>Night Rituals</b><p>Explore the rites that awaken when the day is done.</p></span></div>
          </div>
        </div>

        <a  className="peek" href="#pathways" data-view="3" data-rv="fade" data-cursor aria-label="Preview: Sanmon, before the bell">
          {/* data-frame, or the live view is blitted over the whole anchor and
               runs on down behind the caption instead of stopping at the frame */}
          <span  className="peek-fr" data-frame></span>
          <span  className="peek-play"><svg  viewBox="0 0 22 22" fill="none"><path  d="M8 5.6 16.4 11 8 16.4z" fill="#dfe7e0" /></svg></span>
          <span  className="peek-cap"><b  className="jp">山門</b><i>Sanmon — before the bell</i></span>
        </a>

        <div  className="word-fb" aria-hidden="true">KAGE</div>

        <div  className="hero-side" data-rv="up">
          <span  className="v jp">影の道</span>
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
          <span  className="k"><b>01</b> — The Sanmon</span><span  className="rule"></span><span  className="k jp">山門</span>
        </div>
        <div  className="gate-grid">
          <h2  className="display h-sec" data-rv="up">Charred cypress, worn stone, one gate left open.</h2>
          <div  className="gate-copy">
            <p  className="lead" data-rv="up">Kage begins where the city stops: a mountain gate of cedar burned black,
              standing in its own weather. The soot is not decoration. It is how a board is taught to survive a
              hundred rainy seasons, and the first thing this place asks you to understand.</p>
            <p  className="body" data-rv="up">Climb the worn steps and the worship hall lifts out of the mist, its paper
              screens lit from inside like a lantern the size of a house. Above the eaves a vermilion moon holds
              its place, patient, half hidden. Nothing here is in a hurry. Neither, for the next ninety minutes,
              are you.</p>
            <a  className="arrowlink" href="#pathways" data-rv="fade" data-cursor>
              <span>Cross the threshold</span>
              <span  className="ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
            </a>
          </div>
        </div>
        <div  className="gate-stats" data-rv="up">
          <div><b>05</b><span>Chapters</span></div>
          <div><b>92</b><span>Minutes</span></div>
          <div><b>1611</b><span>Hall raised</span></div>
          <div><b>∞</b><span>Stillness</span></div>
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
          <span  className="k"><b>02</b> — Still Gardens</span><span  className="rule"></span><span  className="k jp">庭園</span>
        </div>
        <div  className="cards" id="cards">
          <article  className="card" data-rv="up" data-view="0" data-cursor>
            <div  className="card-fr" data-frame>
                      <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow" style={{ "--gx": "80.2%", "--gy": "23.9%", "--gr": "22%", "--gt": "6.1s", "--gt2": "9.7s", "--gc1": "rgba(255,142,108,.50)", "--gc2": "rgba(212,56,38,.24)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Approach</b><span  className="jp">参道</span></div>
            </div>
            <div  className="card-meta"><span>The long climb</span><span>01 / 03</span></div>
          </article>
          <article  className="card" data-rv="up" data-view="1" data-cursor>
            <div  className="card-fr" data-frame>
                      <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow glow--flame" style={{ "--gx": "70.5%", "--gy": "47.2%", "--gr": "14%", "--gt": "3.7s", "--gt2": "5.3s", "--gc1": "rgba(255,198,124,.62)", "--gc2": "rgba(226,118,40,.30)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Lanterns</b><span  className="jp">灯籠</span></div>
            </div>
            <div  className="card-meta"><span>Lantern court</span><span>02 / 03</span></div>
          </article>
          <article  className="card" data-rv="up" data-view="2" data-cursor>
            <div  className="card-fr" data-frame>
                      <span  className="card-ar"><svg  viewBox="0 0 14 14" fill="none"><path  d="M3 11 11 3M5 3h6v6" stroke="#dfe7e0" strokeWidth="1.3" /></svg></span>
              <i  className="glow" style={{ "--gx": "48.0%", "--gy": "16.8%", "--gr": "20%", "--gt": "7.3s", "--gt2": "11.2s", "--gc1": "rgba(255,138,104,.52)", "--gc2": "rgba(208,54,36,.24)" } as React.CSSProperties}></i>
              <div  className="card-lab"><b>Moonwater</b><span  className="jp">月影</span></div>
            </div>
            <div  className="card-meta"><span>The wet court</span><span>03 / 03</span></div>
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
          <span  className="k"><b>03</b> — Sacred Craft</span><span  className="rule"></span><span  className="k jp">手業</span>
        </div>
        <div  className="cur-head">
          <h2  className="display h-sec" data-rv="up">Five chapters. Ninety minutes. One quiet mind.</h2>
          <p  className="body-lg" data-rv="up">Each chapter is a walk, not a lecture. You arrive at the gate, climb the
            steps, sit with the lantern, and leave with one thing worth keeping.</p>
        </div>
        <div  className="cur" id="cur">
          <div  className="les" data-les="0" data-cursor>
            <span  className="k">01</span>
            <h3>The Hidden Gate<em  className="jp">山門</em></h3>
            <p>Why a gate is a sentence, and what you agree to when you walk under one.</p>
            <span  className="t">14 min</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="1" data-cursor>
            <span  className="k">02</span>
            <h3>Borrowed Scenery<em  className="jp">借景</em></h3>
            <p>Shakkei: composing with a mountain you will never own.</p>
            <span  className="t">18 min</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="2" data-cursor>
            <span  className="k">03</span>
            <h3>Charred Cypress<em  className="jp">焼杉</em></h3>
            <p>Yakisugi: burning a board black so the weather will let it live.</p>
            <span  className="t">21 min</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="3" data-cursor>
            <span  className="k">04</span>
            <h3>Lantern Light<em  className="jp">灯籠</em></h3>
            <p>How a single ember decides the scale of everything around it.</p>
            <span  className="t">17 min</span><i  className="bar"></i>
          </div>
          <div  className="les" data-les="4" data-cursor>
            <span  className="k">05</span>
            <h3>The Vermilion Moon<em  className="jp">朱月</em></h3>
            <p>Why the moon burns red over the valley, and what the garden does with it.</p>
            <span  className="t">22 min</span><i  className="bar"></i>
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
        <div  className="eyebrow" data-rv="fade">Chapter 04 — Afterlight</div>
        <h2  className="display" data-rv="up">Afterlight</h2>
        <p  className="body-lg" data-rv="up">The gate does not close behind you. Take the walk whenever the noise
          gets loud — it is always the same path, and never the same light.</p>
        <a  className="cta" href="#top" data-rv="fade" data-cursor>
          <i></i><span>Begin the walk</span>
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
            <p>A five-chapter night walk through a Kyoto mountain temple. Three illustrated garden field notes
              sit inside a live Three.js sanctuary.</p>
          </div>
          <div><h4>Chapters</h4><ul>
            <li><a  href="#gate" data-cursor>The Sanmon</a></li>
            <li><a  href="#pathways" data-cursor>Still Gardens</a></li>
            <li><a  href="#lessons" data-cursor>Sacred Craft</a></li>
            <li><a  href="#eternity" data-cursor>Afterlight</a></li>
          </ul></div>
          <div><h4>Practice</h4><ul>
            <li><a  href="#lessons" data-cursor>Borrowed scenery</a></li>
            <li><a  href="#lessons" data-cursor>Lantern light</a></li>
            <li><a  href="#lessons" data-cursor>Charred cypress</a></li>
            <li><a  href="#lessons" data-cursor>Raked gravel</a></li>
          </ul></div>
          <div><h4>Elsewhere</h4><ul>
            <li><a  href="#top" data-cursor>Journal</a></li>
            <li><a  href="#top" data-cursor>Field notes</a></li>
            <li><a  href="#top" data-cursor>Colophon</a></li>
          </ul></div>
        </div>
        <div  className="foot-base">
          <span>© 2026 Kage — Kage no Michi</span>
          <span  className="jp">静けさは一つの技である</span>
          <span>WebGL · Onest · Kyoto</span>
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
