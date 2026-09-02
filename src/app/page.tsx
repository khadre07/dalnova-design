import Backdrop from "@/components/Backdrop";
import Boot from "@/components/Boot";
import Capabilities from "@/components/Capabilities";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Gallery from "@/components/Gallery";
import Hero from "@/components/Hero";
import Method from "@/components/Method";
import Partners from "@/components/Partners";
import Sectors from "@/components/Sectors";
import SiteNav from "@/components/SiteNav";
import SmokeVeil from "@/components/SmokeVeil";

const shell = { paddingInline: "var(--shell-x)" };

/**
 * The page gutters and outer measure. Every band shares them.
 *
 * `wide` marks a band that takes the full width — it gets a slightly deeper
 * ground, edge to edge, so the alternation is legible even before you notice
 * the measure has changed. The whole page was one value throughout, and
 * nothing advanced or receded.
 */
function Shell({
  children,
  wide = false,
  cam,
}: {
  children: React.ReactNode;
  wide?: boolean;
  /* Which camera stop this band is. Read from the markup by the rig rather
     than kept in a list beside it, so moving or adding a band cannot put the
     travel out of step with the page. */
  cam?: number;
}) {
  return (
    <div
      className={`mx-auto max-w-[1560px] ${wide ? "band-wide" : ""}`}
      style={shell}
      data-cam={cam}
    >
      {children}
    </div>
  );
}

/** The left-hand measure, for bands that share the screen with the figure. */
function Column({ children }: { children: React.ReactNode }) {
  return <div className="lg:w-[50%] lg:max-w-[700px]">{children}</div>;
}

export default function Page() {
  return (
    <>
      <Boot />

      <Backdrop />

      {/* Above the copy (z-10), below the header (z-50): the smoke has to be
          able to roll over the text it is writing. */}
      <SmokeVeil />

      <SiteNav />

      {/* Bands alternate between the left column and the full measure, and the
          figure recedes for the full-width ones. Five sections in one 50%
          column was a single layout repeated five times, with half the screen
          idle throughout. */}
      <main className="relative z-10">
        <Shell cam={0}>
          <Column>
            <Hero />
          </Column>
        </Shell>

        <Shell wide cam={1}>
          <Capabilities />
        </Shell>

        <Shell cam={2}>
          <Column>
            <Method />
          </Column>
        </Shell>

        <Shell wide cam={3}>
          <Sectors />
        </Shell>

        <Shell wide cam={4}>
          <Gallery />
        </Shell>

        <Shell cam={5}>
          <Column>
            <Contact />
          </Column>
        </Shell>

        <Shell cam={6}>
          <Partners />
        </Shell>

        {/* The footer is opaque on purpose. Left transparent, its right-hand
            columns land on the robot's shoulder and become unreadable — and
            closing on a solid band gives the shot somewhere to end. */}
        <div className="mt-8 bg-[#05070a]">
          <Shell>
            <Footer />
          </Shell>
        </div>
      </main>
    </>
  );
}
