"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

/* One drawing, at a size where it can be read.

   These are technical documents: the value is in the equipment names, the
   addressing and the VLAN table, none of which survive being wrapped round a
   cylinder or shrunk into a card. Everything else in the section is a way of
   getting here. */
export default function Lightbox({
  src,
  alt,
  w,
  h,
  caption,
  closeLabel,
  onClose,
}: {
  src: string;
  alt: string;
  w: number;
  h: number;
  caption: string;
  closeLabel: string;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const opener = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
        return;
      }
      if (event.key !== "Tab") return;

      /* Focus stays inside while it is open. Without this, tabbing walks off
         into the page behind and a keyboard user is left driving something
         they cannot see. */
      const focusable = panelRef.current?.querySelectorAll<HTMLElement>(
        'button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
      // Back to whatever opened it, not to the top of the document.
      opener?.focus?.();
    };
  }, [onClose]);

  /* Rendered into the body rather than in place. <main> carries z-10, which
     makes it a stacking context — inside it no z-index this overlay can name
     lifts it above the header, and the drawing opened underneath the
     navigation.

     No mounted guard: this component is only ever rendered once someone has
     clicked, so it never runs during the server render and `document` is
     always there by the time it does. */
  return createPortal(
    <div
      className="lightbox"
      role="dialog"
      aria-modal="true"
      aria-label={caption}
      onClick={(event) => {
        // Only the backdrop closes; a click on the drawing itself does not.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="lightbox-panel" ref={panelRef}>
        <div className="lightbox-bar">
          <p className="t-mono lightbox-caption">{caption}</p>
          <button ref={closeRef} type="button" className="lightbox-close" onClick={onClose}>
            <span className="sr-only">{closeLabel}</span>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
              <path d="M1 1l11 11M12 1L1 12" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          </button>
        </div>

        {/* The panel is sized before the file lands. Without the two numbers
            it opens as a bar with nothing under it and then snaps to full
            height around the reader — the most jarring shift on the page,
            because it happens right where they are looking. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} width={w} height={h} decoding="async" />
      </div>
    </div>,
    document.body,
  );
}
