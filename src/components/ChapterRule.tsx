"use client";

import Reveal from "./Reveal";

/* The line that opens a chapter.

   Kage's, exactly: a number, an em dash, the chapter's name, a rule that takes
   whatever width is left, and one mark held at the far right. There it is the
   Japanese for the name — 山門 beside "The Sanmon" — a second reading of the
   same thing in the language the place belongs to.

   Dalnova has its own second language and it was already in the content: the
   three-letter codes the services carry, NET and SEC and DEV. So the far mark
   is the code of what the chapter is about, and the page is doing what Kage
   does rather than borrowing its alphabet.

   The rule between them is the part that does the work. It is what turns a
   heading into a chapter — it says the page is a sequence and that you are
   somewhere in it, which is the whole difference between eight bands stacked
   up and a walk through eight rooms. */

export default function ChapterRule({
  index,
  name,
  code,
}: {
  /** Which chapter, from one. Printed with a leading zero. */
  index: number;
  name: string;
  /** The far mark: this chapter's own code. */
  code: string;
}) {
  return (
    <Reveal className="chapter">
      <span className="chapter-n t-mono">
        <b>{String(index).padStart(2, "0")}</b>
        <span aria-hidden="true"> — </span>
        {name}
      </span>
      <span className="chapter-rule" aria-hidden="true" />
      <span className="chapter-code t-mono" aria-hidden="true">
        {code}
      </span>
    </Reveal>
  );
}
