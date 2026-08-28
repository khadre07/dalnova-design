"use client";

import { useSite } from "@/lib/site-state";

/* The partner ticker.

   Names rather than logos: the logos are not ours to reproduce, and set on a
   dark page they would each need their own treatment anyway. Set in the label
   face with the country beside them, they read as a register — which is the
   register the rest of the page is already in.

   The list is repeated so the loop has no seam. Only the first copy carries
   links; the repeats are plain text, because a link inside an aria-hidden
   element is still reachable by keyboard and would put the same four
   destinations in the tab order three times over. */
export default function Partners() {
  const { t } = useSite();

  return (
    <section className="partners" aria-labelledby="partners-label">
      <p className="t-mono partners-label" id="partners-label">
        {t.partners.label}
      </p>

      <div className="partners-rail">
        <ul className="partners-row">
          {t.partners.items.map((partner) => (
            <li key={partner.name}>
              <a
                className="partner"
                href={partner.href}
                target="_blank"
                rel="noreferrer noopener"
              >
                <span className="partner-name">{partner.name}</span>
                <span className="partner-place t-mono">{partner.place}</span>
              </a>
            </li>
          ))}
        </ul>

        {/* Two repeats, not one: with four names a single repeat is narrower
            than a wide screen, and the loop shows a gap at the far edge. */}
        {[1, 2].map((copy) => (
          <ul className="partners-row" aria-hidden="true" key={copy}>
            {t.partners.items.map((partner) => (
              <li key={partner.name}>
                <span className="partner">
                  <span className="partner-name">{partner.name}</span>
                  <span className="partner-place t-mono">{partner.place}</span>
                </span>
              </li>
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}
