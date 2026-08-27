"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { CONTENT, type Accent, type Content, type Lang } from "./content";
import { presenceNow, registerRecess } from "./stage";

type SiteState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Content;
  /** Drives the robot's rim light. Cyan for machine work, amber for human work. */
  accent: Accent;
  setAccent: (accent: Accent) => void;
  /* 0 at the top of the page, 1 at the bottom. Deliberately a ref and not
     state: the only readers are the WebGL loops, which sample it once a frame
     anyway. Held as state it changed the context value on every scroll frame
     and re-rendered the whole page — nav, hero, every module — sixty times a
     second for a number React never draws. */
  progressRef: React.RefObject<number>;
};

const SiteContext = createContext<SiteState | null>(null);

const STORAGE_KEY = "dalnova.lang";

/* The stored language is an external store, not component state. Reading it in
   an effect and calling setState would work, but it costs a second render on
   every mount and React flags it; useSyncExternalStore is the shape React ships
   for exactly this — server renders "fr", the client swaps in the stored value
   during hydration with no mismatch. */
let cachedLang: Lang | null = null;
let listeners: (() => void)[] = [];

function subscribeLang(callback: () => void) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function readLang(): Lang {
  if (cachedLang === null) {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    cachedLang = stored === "en" || stored === "fr" ? stored : "fr";
  }
  return cachedLang;
}

function readLangOnServer(): Lang {
  return "fr";
}

function writeLang(next: Lang) {
  cachedLang = next;
  window.localStorage.setItem(STORAGE_KEY, next);
  listeners.forEach((l) => l());
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, readLang, readLangOnServer);
  const [accent, setAccent] = useState<Accent>("arc");
  const progressRef = useRef(0);

  const setLang = useCallback((next: Lang) => writeLang(next), []);

  /* The server always renders lang="fr"; a visitor who chose English gets it
     back from localStorage during hydration. Mirroring it onto <html> here
     rather than inside the setter means a restored preference is announced to
     screen readers too, not only a preference changed in this session. */
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // Scroll position is read once per frame rather than on every scroll event,
  // so a trackpad flick cannot queue up hundreds of state updates.
  const frame = useRef(0);
  useEffect(() => {
    let lastPresence = -1;
    const read = () => {
      frame.current = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progressRef.current = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;

      /* Written straight onto <html> as a custom property. No state, so no
         render: the figure's withdrawal is a paint, on the same frame as the
         scroll that caused it. */
      const presence = presenceNow(window.innerHeight);
      if (Math.abs(presence - lastPresence) > 0.004) {
        lastPresence = presence;
        document.documentElement.style.setProperty("--presence", presence.toFixed(3));
      }
    };
    const onScroll = () => {
      if (frame.current) return;
      frame.current = window.requestAnimationFrame(read);
    };
    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame.current) window.cancelAnimationFrame(frame.current);
    };
  }, []);

  const value = useMemo(
    () => ({ lang, setLang, t: CONTENT[lang], accent, setAccent, progressRef }),
    [lang, setLang, accent],
  );

  return <SiteContext.Provider value={value}>{children}</SiteContext.Provider>;
}

export function useSite() {
  const ctx = useContext(SiteContext);
  if (!ctx) throw new Error("useSite must be used inside <SiteProvider>");
  return ctx;
}

/** Marks a section as owning the robot's rim light while it is on screen. */
export function useAccentZone(accent: Accent) {
  const { setAccent } = useSite();
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setAccent(accent);
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [accent, setAccent]);

  return ref;
}

/** Marks a full-width band: the figure withdraws in proportion to how much of
 *  the screen it is taking. Attach alongside the accent ref on the same node. */
export function useRecessZone() {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const node = ref.current;
    return node ? registerRecess(node) : undefined;
  }, []);
  return ref;
}
