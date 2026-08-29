"use client";

import { useSite } from "@/lib/site-state";
import Wordmark from "./Wordmark";

export default function Footer() {
  const { t } = useSite();
  /* Read at render rather than pinned to a literal: the page is statically
     generated, so a hardcoded year silently goes stale the first January
     nobody redeploys. */
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-[var(--line)] pt-9 pb-7">
      <div className="grid gap-x-8 gap-y-7 sm:grid-cols-[minmax(0,1.3fr)_repeat(3,minmax(0,1fr))]">
        <div>
          <Wordmark height={32} />
          <p className="t-body mt-4 max-w-[34ch] text-[0.75rem] leading-relaxed">{t.footer.blurb}</p>
        </div>

        {t.footer.columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="t-mono">{column.title}</p>
            <ul className="mt-3 flex flex-col gap-1.5">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.href ? (
                    <a href={link.href} className="footer-link">
                      {link.label}
                    </a>
                  ) : (
                    <span className="footer-link is-static">{link.label}</span>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="rule mt-8" />

      <p className="t-mono mt-4" style={{ letterSpacing: "0.13em" }}>
        © {year} Dalnova Technologies. {t.footer.rights}
      </p>
    </footer>
  );
}
