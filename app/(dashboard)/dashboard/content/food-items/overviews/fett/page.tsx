'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function FettOverviewPage() {
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
            Fettkällor Översikt
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Näringsinnehåll per 100g
          </p>
        </div>
      </div>

      {/* Fat Table */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#FFD700] tracking-[1px]">
            Fett
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
                {/* Nötter och frön */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Mandlar</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">21</td>
                  <td className="px-4 py-3 text-center text-yellow-300">50</td>
                  <td className="px-4 py-3 text-center text-orange-300">22</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">579</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Hasselnötter</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">15</td>
                  <td className="px-4 py-3 text-center text-yellow-300">61</td>
                  <td className="px-4 py-3 text-center text-orange-300">17</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">628</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Cashewnötter</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">18</td>
                  <td className="px-4 py-3 text-center text-yellow-300">44</td>
                  <td className="px-4 py-3 text-center text-orange-300">30</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">553</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Valnötter</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">15</td>
                  <td className="px-4 py-3 text-center text-yellow-300">65</td>
                  <td className="px-4 py-3 text-center text-orange-300">14</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">654</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Jordnötter</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">26</td>
                  <td className="px-4 py-3 text-center text-yellow-300">49</td>
                  <td className="px-4 py-3 text-center text-orange-300">16</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">567</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Sesamfrön</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">18</td>
                  <td className="px-4 py-3 text-center text-yellow-300">50</td>
                  <td className="px-4 py-3 text-center text-orange-300">23</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">573</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Solrosfrön</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">21</td>
                  <td className="px-4 py-3 text-center text-yellow-300">51</td>
                  <td className="px-4 py-3 text-center text-orange-300">20</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">584</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Chiafrön</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">17</td>
                  <td className="px-4 py-3 text-center text-yellow-300">31</td>
                  <td className="px-4 py-3 text-center text-orange-300">42</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">486</td>
                </tr>

                {/* Oljor och smör */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Olivolja</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">0</td>
                  <td className="px-4 py-3 text-center text-yellow-300">100</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">884</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Kokosolja</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">0</td>
                  <td className="px-4 py-3 text-center text-yellow-300">100</td>
                  <td className="px-4 py-3 text-center text-orange-300">0</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">862</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Smör</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">0.9</td>
                  <td className="px-4 py-3 text-center text-yellow-300">81</td>
                  <td className="px-4 py-3 text-center text-orange-300">0.1</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">717</td>
                </tr>

                {/* Övrigt */}
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Avokado</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">2</td>
                  <td className="px-4 py-3 text-center text-yellow-300">15</td>
                  <td className="px-4 py-3 text-center text-orange-300">9</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">160</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Jordnötssmör</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">25</td>
                  <td className="px-4 py-3 text-center text-yellow-300">50</td>
                  <td className="px-4 py-3 text-center text-orange-300">20</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">588</td>
                </tr>
                <tr className="border-b border-[rgba(255,215,0,0.1)] hover:bg-[rgba(255,215,0,0.02)]">
                  <td className="px-4 py-3 text-white font-medium">Mandelsmör</td>
                  <td className="px-4 py-3 text-center text-[rgba(255,255,255,0.8)]">100</td>
                  <td className="px-4 py-3 text-center text-blue-300">21</td>
                  <td className="px-4 py-3 text-center text-yellow-300">55</td>
                  <td className="px-4 py-3 text-center text-orange-300">19</td>
                  <td className="px-4 py-3 text-center text-[#FFD700]">614</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)] rounded-lg">
            <p className="text-sm text-[rgba(255,255,255,0.7)]">
              <strong className="text-[#FFD700]">Tips:</strong> Fett är kaloritätt (9 kcal/g) men viktigt för hormonproduktion och vitaminupptagning. Fokusera på nyttiga fetter från nötter, frön, fisk och olivolja. Var försiktig med mängden om du vill gå ner i vikt.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
