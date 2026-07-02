import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import BackgroundOrbs from "@/components/BackgroundOrbs";

export const metadata = {
  title: "Datenschutz — WhatIf",
};

export default function DatenschutzPage() {
  return (
    <>
      <Nav />
      <section className="relative overflow-hidden">
        <BackgroundOrbs />
        <div className="mx-auto max-w-2xl px-6 pb-24 pt-10 md:pt-16">
          <h1 className="mb-8 font-display text-4xl leading-tight md:text-5xl">
            Datenschutzerklärung
          </h1>
          <div className="rounded-2xl border border-border-hi bg-surface/60 p-6 backdrop-blur-sm md:p-8 space-y-6">
            <div>
              <h2 className="font-display text-2xl">Verantwortlicher</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                Paul Tristan Keick
                <br />
                Helmsweg 30
                <br />
                21073 Hamburg
                <br />
                E-Mail:{" "}
                <a href="mailto:business@what-if.tech" className="transition-colors hover:text-fg">
                  business@what-if.tech
                </a>
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl">Eingesetzte Dienste und Datenverarbeitung</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                Supabase (EU-Region): Authentifizierung (E-Mail/Passwort) und Datenbank; speichert
                Konto-E-Mail, Plan-Status und Nutzungszähler.
              </p>
              <p className="mt-2 text-fg-soft leading-relaxed">
                Stripe: Zahlungsabwicklung (Abonnement); Zahlungsdaten werden von Stripe verarbeitet,
                nicht bei uns gespeichert.
              </p>
              <p className="mt-2 text-fg-soft leading-relaxed">
                OpenAI: der eingegebene Entscheidungstext wird zur Generierung der Simulation an das
                Modell gesendet und NICHT dauerhaft in einem Nutzerprofil gespeichert.
              </p>
              <p className="mt-2 text-fg-soft leading-relaxed">
                Resend / IONOS: Versand der Authentifizierungs-E-Mails (Bestätigung,
                Passwort-Zurücksetzen).
              </p>
              <p className="mt-2 text-fg-soft leading-relaxed">
                Rate-Limit- und Missbrauchs-Logging: IP-Adresse / Nutzer-ID werden zur Begrenzung von
                Anfragen (Burst-Limit) und zum Protokollieren von Missbrauchsversuchen verarbeitet.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl">Rechtsgrundlage</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Erfüllung
                eines Vertrags bzw. vorvertraglicher Maßnahmen) sowie Art. 6 Abs. 1 lit. f DSGVO
                (berechtigtes Interesse an einem sicheren und funktionsfähigen Betrieb, z.B.
                Missbrauchs-Logging).
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl">Ihre Rechte</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                Sie haben nach Art. 15-21 DSGVO das Recht auf Auskunft, Berichtigung, Löschung,
                Einschränkung der Verarbeitung sowie Widerspruch gegen die Verarbeitung Ihrer
                personenbezogenen Daten.
              </p>
            </div>

            <div>
              <h2 className="font-display text-2xl">Kontakt für Datenschutzanfragen</h2>
              <p className="mt-2 text-fg-soft leading-relaxed">
                <a href="mailto:business@what-if.tech" className="transition-colors hover:text-fg">
                  business@what-if.tech
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </>
  );
}
