'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function ProteinOverviewPage() {
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
            Proteinkällor Översikt
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Näringsinnehåll per 100g
          </p>
        </div>
      </div>

      {/* Protein Table */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#FFD700] tracking-[1px]">
            Protein
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
                {/* Ägg & mejeriprodukter */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Ägg (hela)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">13</td>
                  <td className="px-4 py-3 text-center text-yellow-300">11</td>
                  <td className="px-4 py-3 text-center text-orange-300">1</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">155</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Äggvita</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">11</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0</td>
                  <td className="px-4 py-3 text-center text-orange-300">1</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">52</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Kvarg (naturell)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">12</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.2</td>
                  <td className="px-4 py-3 text-center text-orange-300">3.5</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">65</td>
                </tr>

                {/* Kött */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Kycklingfilé</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">23</td>
                  <td className="px-4 py-3 text-center text-yellow-300">1.2</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">110</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Nötfärs (5%)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">20</td>
                  <td className="px-4 py-3 text-center text-yellow-300">5</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">130</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Fläskfilé</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">22</td>
                  <td className="px-4 py-3 text-center text-yellow-300">2</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">109</td>
                </tr>

                {/* Fisk & skaldjur */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Lax</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">20</td>
                  <td className="px-4 py-3 text-center text-yellow-300">13</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">208</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Torsk</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">18</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.7</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">82</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Räkor</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">24</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.6</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">106</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Tonfisk (konserv, vatten)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">26</td>
                  <td className="px-4 py-3 text-center text-yellow-300">1</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">116</td>
                </tr>

                {/* Vegetariska källor */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Tofu</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">8</td>
                  <td className="px-4 py-3 text-center text-yellow-300">4.8</td>
                  <td className="px-4 py-3 text-center text-orange-300">1.9</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">76</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Linser (kokta)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">9</td>
                  <td className="px-4 py-3 text-center text-yellow-300">0.4</td>
                  <td className="px-4 py-3 text-center text-orange-300">20</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">116</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Kikärtor (kokta)</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">9</td>
                  <td className="px-4 py-3 text-center text-yellow-300">2.6</td>
                  <td className="px-4 py-3 text-center text-orange-300">27</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">164</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
            <p className="text-sm text-[rgba(255,255,255,0.7)]">
              <strong className="text-[#FFD700]">Tips:</strong> Kombinera olika proteinkällor för att få ett brett spektrum av aminosyror. Magert kött och fisk är bra val för lågt kaloriintag, medan ägg och mejeriprodukter ger mer mättnadskänsla.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
