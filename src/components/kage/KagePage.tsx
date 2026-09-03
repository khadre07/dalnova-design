"use client";

import { useEffect } from "react";
import { customizationCss, type Customization } from "./customization";
import { createTopDockController, TOP_DOCK_DEFAULTS } from "./topDockController";
import KageMarkup from "./KageMarkup";
/* The authored faces. In the source these arrive through a <link> in a <head>
   this port does not have, so the stylesheet is imported instead — the same
   file, byte for byte, carrying its own woff2 inline. Imported before the
   page's own rules so those still win. */
import "./kage-fonts.css";
import "./kage.css";

/* Kage as a Next.js page rather than a document in a frame.

   The three parts of the authored file are separated instead of rewritten. Its
   stylesheet is imported. Its markup is rendered as components, so the words
   are this page's own DOM — which was the whole point of the port, because in
   an iframe they belong to the iframe and a search engine finds nothing here.
   And its script is served untouched and run once the markup is on the page.

   The script is not bundled, and that is deliberate on two counts. It expects a
   global THREE, which is what the authored three.min.js provides and what a
   module graph would not. And it runs top to bottom against elements it finds
   by id, so it has to arrive after they exist — which in React means after the
   first paint, not during the import. */

/** The authored runtime and the authored scene, in that order. */
const THREE_SRC = "/landing-pages/secret-pathways-assets/three.min.js";
const SCENE_SRC = "/landing-pages/kage-scene.js";

function load(src: string) {
  return new Promise<void>((resolve, reject) => {
    // Already there: this page can mount twice under React's strict double
    // invoke, and running the world builder twice would leave two of it.
    const existing = document.querySelector<HTMLScriptElement>(
      `script[data-kage="${src}"]`,
    );
    if (existing) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = false;
    script.dataset.kage = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`kage: ${src} failed`));
    document.body.appendChild(script);
  });
}

export default function KagePage({ customization }: { customization?: Customization }) {
  /* The six compositions, which live on the <body> and not in the markup.

     The authored document opens with them declared as attributes on its own
     body tag — data-layout-hero="b" and five siblings — and eighty-five rules
     in its stylesheet are gated on them: the hero's split, the story's spread,
     the gardens' mosaic, the chapter atlas, the closing gallery, the footer
     manifesto. They are not variants in the sense of alternatives; they are
     the compositions the page was actually designed in.

     A Next.js port has no body tag of its own to write them on, and this one
     did not write them anywhere, so every one of those rules had been inert
     since the port: the three garden cards sat in an equal three-column grid
     instead of one tall window beside two, and the hero chips showed copy the
     split layout hides. Measured, not guessed — the cards reported 434x542
     apiece where the mosaic calls for one at 72vh.

     Set on the body on mount and taken off with the page, so nothing leaks
     into another route. */
  useEffect(() => {
    const layouts = {
      "data-layout-hero": "b",
      "data-layout-story": "b",
      "data-layout-gallery": "b",
      "data-layout-curriculum": "b",
      "data-layout-closing": "b",
      "data-layout-footer": "b",
    };
    for (const [name, value] of Object.entries(layouts)) {
      document.body.setAttribute(name, value);
    }
    return () => {
      for (const name of Object.keys(layouts)) document.body.removeAttribute(name);
    };
  }, []);

  /* The dock spring on the nav.

     The bar keeps its own furniture — the wordmark at the left, the burger at
     the right, the label/binary flip inside each link. What arrives from the
     dock is the one thing that was asked for: the proximity magnification, and
     the centred track it needs to be read against. An item that grew where the
     row sat hard against the right edge would push into the burger and grow
     off the frame; centred, it grows into air on both sides.

     Attached after the markup is on the page and torn down with it, and the
     controller measures nothing until the face has loaded — see its own note. */
  useEffect(() => {
    const track = document.getElementById("navlinks");
    if (!track) return;
    return createTopDockController(track, () => TOP_DOCK_DEFAULTS);
  }, []);

  /* The configured props, written into the page the way the package writes
     them into its frame: one stylesheet, appended after the authored rules so
     it wins, and removed with the page. */
  useEffect(() => {
    if (!customization) return;
    const css = customizationCss(customization);
    if (!css) return;
    const style = document.createElement("style");
    style.id = "kage-customization";
    style.textContent = css;
    document.head.append(style);
    return () => style.remove();
  }, [customization]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await load(THREE_SRC);
        if (cancelled) return;
        await load(SCENE_SRC);
      } catch (error) {
        /* The page is still readable without its world — that is the point of
           having ported the markup rather than framed the document. Say so
           rather than failing silently. */
        console.error(error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return <KageMarkup />;
}
