'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DataPolicyPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gold-primary hover:text-gold-secondary transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Tillbaka</span>
        </Link>

        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Datapolicy - Friskvårdskompassen
            </CardTitle>
          </CardHeader>
          <CardContent className="prose prose-invert max-w-none">
            <div className="space-y-6 text-gray-300">
              <section>
                <h2 className="text-xl font-semibold text-gold-light mb-3">1. Personuppgiftsansvarig</h2>
                <p>
                  Friskvårdskompassen är personuppgiftsansvarig för behandlingen av dina personuppgifter
                  i samband med våra online-coachingtjänster.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gold-light mb-3">2. Vilka uppgifter vi samlar in</h2>
                <p>Vi samlar in följande kategorier av personuppgifter:</p>
                <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                  <li>Kontaktuppgifter (namn, e-postadress)</li>
                  <li>Hälsouppgifter (vikt, mått, träningshistorik)</li>
                  <li>Kostvanor och eventuella allergier</li>
                  <li>Bilder för att följa framsteg (om du väljer att dela dessa)</li>
                  <li>Kommunikation med din coach</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gold-light mb-3">3. Varför vi behandlar dina uppgifter</h2>
                <p>Dina personuppgifter behandlas för att:</p>
                <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                  <li>Tillhandahålla personlig coaching och träningsprogram</li>
                  <li>Skapa anpassade kostscheman</li>
                  <li>Följa upp dina framsteg och resultat</li>
                  <li>Kommunicera med dig om ditt program</li>
                  <li>Förbättra våra tjänster</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gold-light mb-3">4. Rättslig grund</h2>
                <p>
                  Behandlingen av dina personuppgifter baseras på ditt samtycke enligt artikel 9.2 a) i GDPR,
                  särskilt vad gäller hälsouppgifter. Du kan när som helst återkalla ditt samtycke.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gold-light mb-3">5. Hur länge vi sparar uppgifterna</h2>
                <p>
                  Vi sparar dina personuppgifter så länge du är aktiv klient hos oss.
                  Efter avslutad coaching raderas dina uppgifter inom 12 månader,
                  om inte annat överenskoms eller krävs enligt lag.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gold-light mb-3">6. Dina rättigheter</h2>
                <p>Du har rätt att:</p>
                <ul className="list-disc list-inside space-y-1 mt-2 ml-4">
                  <li>Få tillgång till dina personuppgifter</li>
                  <li>Begära rättelse av felaktiga uppgifter</li>
                  <li>Begära radering av dina uppgifter</li>
                  <li>Invända mot behandlingen</li>
                  <li>Begära dataportabilitet</li>
                  <li>Återkalla ditt samtycke</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gold-light mb-3">7. Säkerhet</h2>
                <p>
                  Vi vidtar lämpliga tekniska och organisatoriska åtgärder för att skydda dina
                  personuppgifter mot obehörig åtkomst, förlust eller förstörelse. All data
                  överförs krypterat och lagras säkert.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-semibold text-gold-light mb-3">8. Kontakt</h2>
                <p>
                  Om du har frågor om vår behandling av personuppgifter eller vill utöva dina
                  rättigheter, vänligen kontakta din coach eller mejla oss på{' '}
                  <a href="mailto:info@friskvardskompassen.com" className="text-gold-primary hover:underline">
                    info@friskvardskompassen.com
                  </a>
                </p>
              </section>

              <section className="pt-4 border-t border-gold-primary/20">
                <p className="text-sm text-gray-400">
                  Senast uppdaterad: December 2024
                </p>
              </section>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
