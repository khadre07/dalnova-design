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

type SiteState = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Content;
  /** Drives the robot's rim light. Cyan for machine work, amber for human work. */
  accent: Accent;
  setAccent: (accent: Accent) => void;
  /** 0 at the top of the page, 1 at the bottom. Feeds the WebGL timeline. */
  progress: number;
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
  document.documentElement.lang = next;
  listeners.forEach((l) => l());
}

export function SiteProvider({ children }: { children: ReactNode }) {
  const lang = useSyncExternalStore(subscribeLang, readLang, readLangOnServer);
  const [accent, setAccent] = useState<Accent>("arc");
  const [progress, setProgress] = useState(0);

  const setLang = useCallback((next: Lang) => writeLang(next), []);

  // Scroll position is read once per frame rather than on every scroll event,
  // so a trackpad flick cannot queue up hundreds of state updates.
  const frame = useRef(0);
  useEffect(() => {
    const read = () => {
      frame.current = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
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
    () => ({ lang, setLang, t: CONTENT[lang], accent, setAccent, progress }),
    [lang, setLang, accent, progress],
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
