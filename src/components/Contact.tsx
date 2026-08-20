"use client";

import { ACCENT_HEX } from "@/lib/content";
import { useAccentZone, useSite } from "@/lib/site-state";
import Reveal from "./Reveal";
import SectionHead from "./SectionHead";

export default function Contact() {
  const { t } = useSite();
  // Amber: this section is about reaching a person, not a system.
  const ref = useAccentZone("ember");

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="contact"
      className="scroll-mt-24 py-24 lg:py-32"
    >
      <SectionHead eyebrow={t.contact.eyebrow} title={t.contact.title} lede={t.contact.lede} />

      <div className="mt-12 flex flex-col gap-px bg-[#2a3238]">
        {t.contact.channels.map((channel, i) => (
          <div key={channel.label} className="bg-[#080d12]">
            <Reveal delay={i * 55}>
              <a href={channel.href} className="channel">
                <span className="t-mono" style={{ color: ACCENT_HEX[channel.accent] }}>
                  {channel.label}
                </span>
                <span className="channel-value">{channel.value}</span>
                <span className="channel-arrow" aria-hidden="true">
                  <svg width="13" height="9" viewBox="0 0 13 9" fill="none">
                    <path d="M0 4.5h11M7.6 1 11.4 4.5 7.6 8" stroke="currentColor" strokeWidth="1.4" />
                  </svg>
                </span>
              </a>
            </Reveal>
          </div>
        ))}
      </div>

      <Reveal delay={200}>
        <a href="mailto:contact@dalnova.tech" className="btn btn-primary mt-10">
          {t.contact.ctaPrimary}
        </a>
      </Reveal>
    </section>
  );
}
