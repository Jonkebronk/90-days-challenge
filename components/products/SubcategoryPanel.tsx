'use client'

import { SUBCATEGORIES_BY_CATEGORY, Subcategory } from '@/lib/products/subcategories'

interface SubcategoryPanelProps {
  categoryId: string
  selectedSubcategory: string | null
  onSubcategoryChange: (subCategory: string | null) => void
  subCategoryCounts: Record<string, number>
}

// Subcategory images - using gradient backgrounds with emojis as placeholders
// These can be replaced with actual images later
const SUBCATEGORY_IMAGES: Record<string, { emoji: string; gradient: string }> = {
  // Frukt
  banan: { emoji: '🍌', gradient: 'from-yellow-300 to-yellow-500' },
  apple: { emoji: '🍎', gradient: 'from-red-400 to-red-600' },
  paron: { emoji: '🍐', gradient: 'from-green-300 to-green-500' },
  citrusfrukt: { emoji: '🍊', gradient: 'from-orange-300 to-orange-500' },
  druvor: { emoji: '🍇', gradient: 'from-purple-400 to-purple-600' },
  melon: { emoji: '🍈', gradient: 'from-green-200 to-green-400' },
  exotisk: { emoji: '🥭', gradient: 'from-amber-300 to-orange-400' },
  avokado: { emoji: '🥑', gradient: 'from-green-400 to-green-600' },
  bar: { emoji: '🍓', gradient: 'from-red-300 to-pink-500' },
  stonfrukter: { emoji: '🍑', gradient: 'from-orange-200 to-pink-400' },
}

export function SubcategoryPanel({
  categoryId,
  selectedSubcategory,
  onSubcategoryChange,
  subCategoryCounts
}: SubcategoryPanelProps) {
  const subcategories = SUBCATEGORIES_BY_CATEGORY[categoryId.toLowerCase()]

  if (!subcategories || subcategories.length === 0) {
    return null
  }

  // Calculate total count for "Alla"
  const totalCount = Object.values(subCategoryCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="w-48 flex-shrink-0 bg-white rounded-xl border border-gray-200 p-3 h-fit sticky top-28">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Underkategorier</h3>

      <div className="space-y-1.5">
        {/* "All" option */}
        <button
          onClick={() => onSubcategoryChange(null)}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
            selectedSubcategory === null
              ? 'bg-gold-primary text-black font-medium'
              : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
          }`}
        >
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base ${
            selectedSubcategory === null ? 'bg-black/10' : 'bg-gray-200'
          }`}>
            📦
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-sm truncate block">Alla</span>
          </div>
          {totalCount > 0 && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              selectedSubcategory === null ? 'bg-black/10' : 'bg-gray-200'
            }`}>
              {totalCount}
            </span>
          )}
        </button>

        {/* Subcategory buttons */}
        {subcategories.map((subcat) => {
          const count = subCategoryCounts[subcat.key] || 0
          const isActive = selectedSubcategory === subcat.key
          const image = SUBCATEGORY_IMAGES[subcat.key]

          return (
            <button
              key={subcat.key}
              onClick={() => onSubcategoryChange(subcat.key)}
              className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all ${
                isActive
                  ? 'bg-gold-primary text-black font-medium'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-base bg-gradient-to-br ${
                image?.gradient || 'from-gray-200 to-gray-300'
              }`}>
                {image?.emoji || '🍴'}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm truncate block">{subcat.label}</span>
              </div>
              {count > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-black/10' : 'bg-gray-200'
                }`}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
