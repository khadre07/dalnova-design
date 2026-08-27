"use client";

import { useEffect, useRef } from "react";

/* A figure that settles rather than counts up.

   The usual treatment runs a number from zero to its value over two seconds,
   which says "look, an animation" and nothing about the number. This instead
   scrambles the digits and locks them left to right in about two thirds of a
   second — an instrument acquiring a reading. It suits a page whose whole
   register is telemetry, and it is over before it can become a wait.

   Non-digits never move: "24/7/365" keeps its slashes, "< 15 min" keeps its
   comparator and its unit. Only what can vary, varies.

   Runs once, on first sight, and not again on every scroll back past it.
   Figures re-scrambling each time the reader returns is the version of this
   that becomes irritating by the third pass. */

const DURATION = 660;

function easeOut(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export default function Readout({
  value,
  className,
}: {
  value: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const chars = Array.from(value);
    const slots: number[] = [];
    chars.forEach((c, i) => {
      if (c >= "0" && c <= "9") slots.push(i);
    });
    if (slots.length === 0) return;

    let raf = 0;
    let started = 0;

    const step = (now: number) => {
      if (!started) started = now;
      const t = Math.min(1, (now - started) / DURATION);
      const locked = Math.floor(easeOut(t) * slots.length);

      const out = chars.slice();
      for (let i = locked; i < slots.length; i += 1) {
        out[slots[i]] = String(Math.floor(Math.random() * 10));
      }
      node.textContent = out.join("");

      if (t < 1) raf = window.requestAnimationFrame(step);
      else node.textContent = value;
    };

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        observer.disconnect();
        raf = window.requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );

    observer.observe(node);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(raf);
      // Whatever happened, the real figure is what stays on screen.
      node.textContent = value;
    };
  }, [value]);

  /* The true value is what the server renders and what a reader without
     scripting sees. The settle only ever edits it afterwards. */
  return (
    <span ref={ref} className={className}>
      {value}
    </span>
  );
}
