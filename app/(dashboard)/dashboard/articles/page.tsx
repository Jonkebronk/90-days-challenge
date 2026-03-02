'use client'

import Link from 'next/link'
import { Pyramid } from '@/components/pyramid'
import { nutritionPyramidLevels, nutritionFoundation, trainingPyramidLevels } from '@/lib/data/pyramid-content'
import { TreeDeciduous, ChevronRight } from 'lucide-react'

export default function ArticlesPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
          Utbildning
        </h1>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Pyramider-sektion */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide text-center">
          Prioriteringspyramider
        </h2>
        <p className="text-sm text-gray-600 text-center max-w-lg mx-auto">
          Klicka på valfri nivå för att lära dig mer. Botten har störst påverkan på dina resultat.
        </p>

        {/* Pyramid Grid - horisontell på desktop, vertikal på mobil */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Nutritionspyramiden */}
          <Pyramid
            title="Nutritionspyramiden"
            levels={nutritionPyramidLevels}
            foundation={nutritionFoundation}
            colorScheme="red"
          />

          {/* Träningspyramiden */}
          <Pyramid
            title="Träningspyramiden"
            levels={trainingPyramidLevels}
            colorScheme="blue"
          />
        </div>
      </div>

      {/* Kunskapsträd-sektion */}
      <div className="mt-8">
        <div className="bg-white rounded-xl shadow-sm border border-zinc-200 p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg">
                <TreeDeciduous className="w-7 h-7 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Kunskapsträdet</h3>
                <p className="text-sm text-gray-600">
                  Fördjupa dig i ämnen och lås upp nya kunskaper
                </p>
              </div>
            </div>
            <Link
              href="/dashboard/articles/skill-tree"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white font-semibold rounded-lg hover:from-emerald-600 hover:to-green-700 transition-all shadow-md hover:shadow-lg"
            >
              Utforska
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
