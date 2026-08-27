"use client";

import { useSite } from "@/lib/site-state";

/* A ticker, not a logo grid.

   The list is duplicated so the loop has no seam: the first copy carries the
   real content, the second is hidden from assistive technology because it is
   the same information said twice. It stops when you point at it — a strip
   that keeps sliding while you are trying to read one item is a strip you
   cannot read — and it stops moving entirely under reduced motion, becoming a
   plain wrapped row. */
export default function Partners() {
  const { t } = useSite();
  const row = t.partners.slots;

  return (
    <section className="partners" aria-label={t.partners.label}>
      <p className="t-mono partners-label">{t.partners.label}</p>

      <div className="partners-rail">
        <ul className="partners-row">
          {row.map((slot) => (
            <li key={slot} className="partners-slot t-mono">
              {slot}
            </li>
          ))}
        </ul>
        <ul className="partners-row" aria-hidden="true">
          {row.map((slot) => (
            <li key={slot} className="partners-slot t-mono">
              {slot}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
