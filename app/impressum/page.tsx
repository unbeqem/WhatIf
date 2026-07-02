import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";

export const metadata = {
  title: "Impressum — WhatIf",
};

export default function ImpressumPage() {
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-2xl px-6 pb-24 pt-10 md:pt-16">
          <h1 className="mb-8 font-display text-4xl leading-tight md:text-5xl">Impressum</h1>
          <div className="rounded-2xl border border-border-hi bg-surface/60 p-6 backdrop-blur-sm md:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl">Angaben gemäß § 5 DDG</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                [NAME PLACEHOLDER — Gründer trägt ein]
                <br />
                [ADRESSE PLACEHOLDER — Straße, PLZ, Ort — Gründer trägt ein]
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl">Kontakt</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                E-Mail:{" "}
                <a href="mailto:business@what-if.tech" className="transition-colors hover:text-fg">
                  business@what-if.tech
                </a>
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl">Verantwortlich i.S.d. § 18 Abs. 2 MStV</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                [NAME PLACEHOLDER — Gründer trägt ein]
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl">Haftung für Inhalte / Links</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                Die Inhalte dieser Seite wurden mit größtmöglicher Sorgfalt erstellt. Für die
                Richtigkeit, Vollständigkeit und Aktualität der Inhalte kann jedoch keine Gewähr
                übernommen werden. Diese Seite kann Links zu externen Webseiten Dritter enthalten,
                auf deren Inhalte wir keinen Einfluss haben. Für die Inhalte der verlinkten Seiten
                ist stets der jeweilige Anbieter verantwortlich.
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
