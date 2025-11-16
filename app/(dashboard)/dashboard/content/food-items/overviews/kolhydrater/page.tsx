'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function KolhydraterOverviewPage() {
  const router = useRouter()

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard/content/food-items')}
          className="text-[rgba(255,255,255,0.6)] hover:text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Tillbaka
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
            Kolhydratkällor Översikt
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Näringsinnehåll per 100g
          </p>
        </div>
      </div>

      {/* Carbs Table */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#FFD700] tracking-[1px]">
            Kolhydrater
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-[rgba(255,215,0,0.05)]">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-[rgba(255,255,255,0.8)] border-b border-[rgba(255,215,0,0.2)]">
                    Livsmedel
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-[rgba(255,255,255,0.8)] border-b border-[rgba(255,215,0,0.2)]">
                    Mängd (g)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-blue-300 border-b border-[rgba(255,215,0,0.2)]">
                    Protein (g)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-yellow-300 border-b border-[rgba(255,215,0,0.2)]">
                    Fett (g)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-orange-300 border-b border-[rgba(255,215,0,0.2)]">
                    Kolhydrater (g)
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-[#FFD700] border-b border-[rgba(255,215,0,0.2)]">
                    Kalorier
                  </th>
                </tr>
              </thead>
              <tbody>
                {/* Spannmål och gröt */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Havregryn (torra)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">13</td>
                  <td className="px-4 py-3 text-center text-yellow-300">7</td>
                  <td className="px-4 py-3 text-center text-orange-300">60</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">371</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Fullkornsris (kokt)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">3</td>
                  <td className="px-4 py-3 text-center text-yellow-300">1</td>
                  <td className="px-4 py-3 text-center text-orange-300">23</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">111</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Jasminris (kokt)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">3</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.3</td>
                  <td className="px-4 py-3 text-center text-orange-300">28</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">130</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Quinoa (kokt)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">4</td>
                  <td className="px-4 py-3 text-center text-yellow-300">2</td>
                  <td className="px-4 py-3 text-center text-orange-300">21</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">120</td>
                </tr>

                {/* Pasta och bröd */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Fullkornspasta (kokt)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">5</td>
                  <td className="px-4 py-3 text-center text-yellow-300">1</td>
                  <td className="px-4 py-3 text-center text-orange-300">26</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">131</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Fullkornsbröd</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">10</td>
                  <td className="px-4 py-3 text-center text-yellow-300">4</td>
                  <td className="px-4 py-3 text-center text-orange-300">44</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">252</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Knäckebröd (fullkorn)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">11</td>
                  <td className="px-4 py-3 text-center text-yellow-300">2</td>
                  <td className="px-4 py-3 text-center text-orange-300">68</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">334</td>
                </tr>

                {/* Rotfrukter och potatis */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Potatis (kokt)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">2</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.1</td>
                  <td className="px-4 py-3 text-center text-orange-300">17</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">77</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Sötpotatis (kokt)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">2</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.2</td>
                  <td className="px-4 py-3 text-center text-orange-300">20</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">90</td>
                </tr>

                {/* Baljväxter */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Svarta bönor (kokta)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">9</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.5</td>
                  <td className="px-4 py-3 text-center text-orange-300">24</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">132</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Röda linser (kokta)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">9</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.4</td>
                  <td className="px-4 py-3 text-center text-orange-300">20</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">116</td>
                </tr>

                {/* Frukt */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Banan</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">1</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.3</td>
                  <td className="px-4 py-3 text-center text-orange-300">23</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">89</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Äpple</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">0.3</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.2</td>
                  <td className="px-4 py-3 text-center text-orange-300">14</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">52</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Blåbär</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">0.7</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.3</td>
                  <td className="px-4 py-3 text-center text-orange-300">14</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">57</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Dadlar (torkade)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">2</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.2</td>
                  <td className="px-4 py-3 text-center text-orange-300">75</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">282</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
            <p className="text-sm text-[rgba(255,255,255,0.7)]">
              <strong className="text-[#FFD700]">Tips:</strong> Välj komplexa kolhydrater (fullkorn, havregryn, sötpotatis) för långsam energifrisättning och bättre mättnad. Enkla kolhydrater (frukt, dadlar) är bra runt träning för snabb energi.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
