'use client'

import { useSession } from 'next-auth/react'
import { Calculator } from 'lucide-react'
import { KostschemaCalculator } from '@/components/kostschema'

export default function KostschemaGeneratorPage() {
  const { data: session } = useSession()

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-gray-300">
            Du har inte behörighet att se denna sida.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calculator className="h-8 w-8 text-gold-500" />
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
            KOSTSCHEMA GENERATOR
          </h1>
          <p className="text-gray-400 mt-1">
            Beräkna makros och generera måltidsplaner baserat på klientens kroppsvikt
          </p>
        </div>
      </div>

      {/* Calculator */}
      <KostschemaCalculator />
    </div>
  )
}
