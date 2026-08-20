"use client";

import { useSite } from "@/lib/site-state";

/* Shown whenever the site is not explicitly marked as live. Safe by default:
   you have to set NEXT_PUBLIC_PREVIEW=0 to remove it, rather than remembering
   to add a flag before showing the page to anyone. Pairs with the noindex in
   layout.tsx, which is driven by the same switch. */
export default function PreviewNotice() {
  const { lang } = useSite();

  return (
    <div className="preview-notice" role="note">
      <span className="preview-dot" aria-hidden="true" />
      <span>
        {lang === "fr" ? (
          <>
            <strong>Maquette</strong> · les chiffres, engagements et coordonnées sont des
            exemples, pas ceux de Dalnova
          </>
        ) : (
          <>
            <strong>Prototype</strong> · figures, commitments and contact details are
            placeholders, not Dalnova&rsquo;s
          </>
        )}
      </span>
    </div>
  );
}
