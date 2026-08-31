"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { CHARGE_MS, chargeLive } from "@/lib/charge";
import { registerBlock, setBlockActive } from "@/lib/veil";

type Props = {
  children: ReactNode;
  as?: ElementType;
  /** Stagger index. Kept short — long cascades make a page feel slow. */
  delay?: number;
  className?: string;
};

export default function Reveal({ children, as: Tag = "div", delay = 0, className }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);
  /* How long to wait before appearing. When the conduits are wired up the
     block sits out the charge's flight first, so nothing in a section can
     arrive before the light that brings it. A fixed constant, so every block
     lines up without anyone coordinating. */
  const [wait, setWait] = useState(delay);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    /* Reduced motion gets one pass and then the copy stays put: text that
       vanishes and returns on every scroll is exactly the kind of movement
       someone with that preference set is asking not to be shown. */
    const once = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    /* Two thresholds, and no negative root margin. The margin would report a
       block sitting in the bottom of the viewport as not intersecting, and it
       would be wiped off a screen it is plainly on.

       Appears at 6% visible, leaves only at 0% — the gap between the two is
       what stops a block parked on the edge from flickering. */
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio >= 0.06) {
          // Flight time first, stagger on top — otherwise blocks that enter
          // together would all appear on the same frame and the cascade
          // through a group of modules would be lost.
          if (chargeLive()) setWait(CHARGE_MS + delay);
          setShown(true);
          if (once) observer.disconnect();
        } else if (!once && entry.intersectionRatio === 0) {
          setShown(false);
        }
      },
      { threshold: [0, 0.06] },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [delay]);

  /* Registered for as long as the block is mounted; the smoke layer reads the
     registry every frame. */
  useEffect(() => {
    const node = ref.current;
    return node ? registerBlock(node) : undefined;
  }, []);

  /* Leaving resets the block's ink, so the smoke writes it again on the way
     back rather than finding it already done. */
  useEffect(() => {
    const node = ref.current;
    if (node) setBlockActive(node, shown);
  }, [shown]);

  /* Narrowed before it is rendered.

     react-three-fiber augments the global JSX namespace with its own
     intrinsic elements, and once it is installed a bare ElementType is a
     union that includes them. Their props resolve to never against the DOM
     attributes this passes, so the tag stops accepting a ref, a class or a
     style. Saying out loud that this one renders an HTML element restores
     what the type meant before the augmentation existed. */
  const Element = Tag as "div";

  return (
    <Element
      ref={ref as React.Ref<HTMLDivElement>}
      data-shown={shown}
      className={`reveal ${className ?? ""}`}
      style={{ "--reveal-delay": `${wait}ms` } as React.CSSProperties}
    >
      {children}
    </Element>
  );
}
