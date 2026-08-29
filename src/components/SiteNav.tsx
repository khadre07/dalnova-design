"use client";

import { useEffect, useRef, useState } from "react";
import { useSite } from "@/lib/site-state";
import Wordmark from "./Wordmark";

export default function SiteNav() {
  const { t, lang, setLang, sky, setSky } = useSite();
  const [lifted, setLifted] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const onScroll = () => setLifted(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // While the panel is open the page behind it must not scroll, and Escape has
  // to close it — a menu you can only leave by tapping is a trap.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* Day or night. Two states, so a switch rather than a pair of buttons: the
     one you are not in is the one you would press, and a switch says that
     without needing both to be on screen. */
  const skyToggle = (
    <button
      type="button"
      className="sky-btn"
      onClick={() => setSky(sky === "day" ? "night" : "day")}
      aria-pressed={sky === "day"}
      title={
        lang === "fr"
          ? sky === "day"
            ? "Passer en nuit"
            : "Passer en jour"
          : sky === "day"
            ? "Switch to night"
            : "Switch to day"
      }
    >
      <span className="sr-only">
        {lang === "fr" ? "Ciel : jour ou nuit" : "Sky: day or night"}
      </span>
      {sky === "day" ? <SunMark /> : <MoonMark />}
    </button>
  );

  const langToggle = (
    <div
      className="hairline flex items-center"
      style={{ borderRadius: 2 }}
      role="group"
      aria-label={lang === "fr" ? "Langue du site" : "Site language"}
    >
      {(["fr", "en"] as const).map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLang(code)}
          aria-pressed={lang === code}
          className="t-mono lang-btn"
          data-active={lang === code}
        >
          {code.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <>
      <header
        className="fixed inset-x-0 top-0 z-50 transition-[background-color,border-color,backdrop-filter] duration-300"
        style={{
          backgroundColor: lifted || open ? "rgba(5, 7, 10, 0.82)" : "transparent",
          borderBottom: `1px solid ${lifted || open ? "rgba(42, 50, 56, 0.7)" : "transparent"}`,
          backdropFilter: lifted || open ? "blur(14px)" : "none",
        }}
      >
        <nav
          className="mx-auto flex h-[68px] max-w-[1560px] items-center justify-between gap-4"
          style={{ paddingInline: "var(--shell-x)" }}
          aria-label={lang === "fr" ? "Navigation principale" : "Main navigation"}
        >
          <a href="#top" className="shrink-0" onClick={() => setOpen(false)}>
            <Wordmark />
          </a>

          <ul className="hidden items-center gap-9 lg:flex">
            {t.nav.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="t-mono nav-link">
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="flex shrink-0 items-center gap-3">
            {skyToggle}
            <span className="hidden sm:block">{langToggle}</span>

            {/* The full label needs ~19 characters of room. Below lg it wraps
                onto the wordmark, so the small screens get the menu instead. */}
            <a href="#contact" className="btn btn-primary hidden whitespace-nowrap lg:inline-flex">
              {t.navCta}
            </a>

            <button
              ref={toggleRef}
              type="button"
              className="menu-btn lg:hidden"
              aria-expanded={open}
              aria-controls="mobile-menu"
              onClick={() => setOpen((v) => !v)}
            >
              <span className="sr-only">
                {open
                  ? lang === "fr"
                    ? "Fermer le menu"
                    : "Close menu"
                  : lang === "fr"
                    ? "Ouvrir le menu"
                    : "Open menu"}
              </span>
              <span className="menu-bar" data-bar="top" data-open={open} />
              <span className="menu-bar" data-bar="bottom" data-open={open} />
            </button>
          </div>
        </nav>
      </header>

      <div
        id="mobile-menu"
        className="mobile-menu lg:hidden"
        data-open={open}
        aria-hidden={!open}
        inert={!open}
      >
        <ul className="flex flex-col">
          {t.nav.map((item) => (
            <li key={item.href}>
              <a href={item.href} className="mobile-link" onClick={() => setOpen(false)}>
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <a href="#contact" className="btn btn-primary" onClick={() => setOpen(false)}>
            {t.navCta}
          </a>
          <span className="sm:hidden">{langToggle}</span>
        </div>
      </div>
    </>
  );
}

function SunMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8 1v1.8M8 13.2V15M1 8h1.8M13.2 8H15M3.1 3.1l1.3 1.3M11.6 11.6l1.3 1.3M12.9 3.1l-1.3 1.3M4.4 11.6l-1.3 1.3"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      {/* A crescent cut from a disc, rather than a crescent drawn: the cut edge
          is the same curve as the outer one, which is what makes it read as a
          moon and not as a banana. */}
      <path
        d="M13 9.6A5.8 5.8 0 0 1 6.4 3a5.8 5.8 0 1 0 6.6 6.6Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}
