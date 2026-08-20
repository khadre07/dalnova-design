"use client";

import Reveal from "./Reveal";

export default function SectionHead({
  eyebrow,
  title,
  lede,
}: {
  eyebrow: string;
  title: string;
  lede?: string;
}) {
  return (
    <header>
      <Reveal>
        <p className="t-mono flex items-center gap-3">
          <span className="h-px w-8 bg-[#40454b]" aria-hidden="true" />
          {eyebrow}
        </p>
      </Reveal>

      <Reveal delay={60}>
        <h2 className="t-display t-display-lg mt-5 max-w-[18ch]">{title}</h2>
      </Reveal>

      {lede ? (
        <Reveal delay={120}>
          <p className="t-lede mt-5 max-w-[52ch]">{lede}</p>
        </Reveal>
      ) : null}
    </header>
  );
}
