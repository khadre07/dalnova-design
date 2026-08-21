import Capabilities from "@/components/Capabilities";
import Contact from "@/components/Contact";
import Footer from "@/components/Footer";
import Hero from "@/components/Hero";
import Method from "@/components/Method";
import Proof from "@/components/Proof";
import Stage from "@/components/Stage";
import SiteNav from "@/components/SiteNav";

export default function Page() {
  return (
    <>
      {/* Fixed backdrop layers. The figure never unmounts and never re-enters:
          one continuous shot from the hero to the footer. */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="grid-field absolute inset-0 opacity-[0.5]" aria-hidden="true" />

        <div
          className="mx-auto flex h-full max-w-[1560px] justify-end"
          style={{ paddingInline: "var(--shell-x)" }}
        >
          <div className="stage-slot h-full w-full lg:w-[47%]">
            <Stage />
          </div>
        </div>

        {/* Scrim: on narrow screens the figure sits behind the copy, so the
            left edge is darkened enough to keep body text at AA contrast. */}
        <div className="stage-scrim absolute inset-0" aria-hidden="true" />
      </div>

      <SiteNav />

      <main className="relative z-10">
        <div
          className="mx-auto max-w-[1560px]"
          style={{ paddingInline: "var(--shell-x)" }}
        >
          <div className="lg:w-[50%] lg:max-w-[700px]">
            <Hero />
            <Capabilities />
            <Method />
            <Proof />
            <Contact />
          </div>
        </div>

        {/* The footer is opaque on purpose. Left transparent, its right-hand
            columns land on the robot's shoulder and become unreadable — and
            closing on a solid band gives the shot somewhere to end. */}
        <div className="mt-8 bg-[#05070a]">
          <div className="mx-auto max-w-[1560px]" style={{ paddingInline: "var(--shell-x)" }}>
            <Footer />
          </div>
        </div>
      </main>
    </>
  );
}
