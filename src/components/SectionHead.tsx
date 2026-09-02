"use client";

import { useEffect, useRef } from "react";
import { fireCharge } from "@/lib/charge";
import ChapterRule from "./ChapterRule";
import Reveal from "./Reveal";

export default function SectionHead({
  eyebrow,
  title,
  lede,
  conduit,
  chapter,
  code,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
  /** Which conduit carries this section. Omit and no charge is sent. */
  conduit?: number;
  /* The chapter this section opens. Both are needed or neither is printed —
     a number with no code is half a rule, and it would read as a mistake. */
  chapter?: number;
  code?: string;
}) {
  const ref = useRef<HTMLElement>(null);

  /* Same thresholds as <Reveal>, so the charge leaves the reactor on the frame
     its section's blocks start waiting for it — and leaves again every time the
     section comes back, since the copy is being written again. */
  useEffect(() => {
    const node = ref.current;
    if (!node || conduit === undefined) return;

    const once = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio < 0.06) return;
        fireCharge(conduit);
        if (once) observer.disconnect();
      },
      { threshold: [0, 0.06] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [conduit]);

  return (
    <header ref={ref}>
      {/* The chapter line replaces the eyebrow rather than joining it. Both
          would be two labels stacked on one heading, each saying where you
          are — and the chapter line says it better, because it says how far
          along as well. */}
      {chapter !== undefined && code ? (
        <ChapterRule index={chapter} name={eyebrow} code={code} />
      ) : (
        <Reveal>
          <p className="t-mono flex items-center gap-3">
            <span className="h-px w-8 bg-[var(--line-2)]" aria-hidden="true" />
            {eyebrow}
          </p>
        </Reveal>
      )}

      {/* reveal-flat: the wrapper only fades, so the line is not moved by the
          reveal and the mask at the same time. */}
      <Reveal delay={60} className="reveal-flat">
        <h2 className="t-display t-display-lg mt-5 max-w-[18ch]">
          <span className="line-clip block">
            <span className="line-rise block">{title}</span>
          </span>
        </h2>
      </Reveal>

      {lede ? (
        <Reveal delay={120}>
          <p className="t-lede mt-5 max-w-[52ch]">{lede}</p>
        </Reveal>
      ) : null}
    </header>
  );
}
