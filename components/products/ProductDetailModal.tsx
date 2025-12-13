'use client'

import { X, Package, Info, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface Product {
  id: string
  ean: string
  name: string
  brand: string | null
  description?: string | null
  url?: string | null
  category: string | null
  image: string | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  fiber?: number | null
  sugar?: number | null
  salt?: number | null
  saturatedFat?: number | null
  vitaminA?: number | null
  vitaminD?: number | null
  vitaminC?: number | null
  vitaminB12?: number | null
  folate?: number | null
  calcium?: number | null
  iron?: number | null
  magnesium?: number | null
  potassium?: number | null
  zinc?: number | null
  iodine?: number | null
  source: string
  servingUnit?: string
}

interface ProductDetailModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
}

export function ProductDetailModal({ isOpen, product, onClose }: ProductDetailModalProps) {
  if (!product) return null

  // Check if product has any micronutrients
  const hasMicronutrients = product.vitaminA || product.vitaminD || product.vitaminC ||
    product.vitaminB12 || product.folate || product.calcium || product.iron ||
    product.magnesium || product.potassium || product.zinc || product.iodine

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-gray-900 border-gray-800 text-white max-w-lg max-h-[85vh] overflow-hidden flex flex-col p-0">
        {/* Header */}
        <DialogHeader className="p-4 border-b border-gray-800 flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-gray-400 text-sm font-normal">
            <Info className="w-5 h-5" />
            Näringsinformation
          </DialogTitle>
        </DialogHeader>

        {/* Content - scrollable */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Product image and name */}
          <div className="text-center">
            {product.image ? (
              <div className="w-32 h-32 mx-auto mb-4 bg-white rounded-xl overflow-hidden">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-contain p-2"
                />
              </div>
            ) : (
              <div className="w-32 h-32 mx-auto mb-4 bg-gray-800 rounded-xl flex items-center justify-center">
                <Package className="w-12 h-12 text-gray-600" />
              </div>
            )}

            <h1 className="text-2xl font-bold text-amber-500 mb-1">
              {product.name}
            </h1>
            {product.brand && (
              <p className="text-gray-400 text-sm">{product.brand}</p>
            )}
          </div>

          {/* Description */}
          {product.description && (
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-sm text-gray-300 leading-relaxed">{product.description}</p>
            </div>
          )}

          {/* Product link */}
          {product.url && (
            <a
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 rounded-xl p-3 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span className="text-sm font-medium">Länk till produkt</span>
            </a>
          )}

          {/* Main macros */}
          <div>
            <h2 className="text-amber-500 font-semibold mb-2">Per 100{product.servingUnit || 'g'}:</h2>
            <div className="bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
              <p className="flex justify-between">
                <span className="text-gray-300">• Energi</span>
                <span className="font-semibold text-amber-500">{Math.round(product.kcal)} kcal</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300">• Protein</span>
                <span className="font-semibold text-white">{Math.round(product.protein * 10) / 10} g</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300">• Kolhydrater</span>
                <span className="font-semibold text-white">{Math.round(product.carbs * 10) / 10} g</span>
              </p>
              <p className="flex justify-between">
                <span className="text-gray-300">• Fett</span>
                <span className="font-semibold text-white">{Math.round(product.fat * 10) / 10} g</span>
              </p>
            </div>
          </div>

          {/* Additional info */}
          {(product.fiber || product.sugar || product.salt || product.saturatedFat) && (
            <div>
              <h2 className="text-amber-500 font-semibold mb-2">Övrig information:</h2>
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
                {product.fiber !== null && product.fiber !== undefined && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Fiber</span>
                    <span className="font-semibold text-white">{Math.round(product.fiber * 10) / 10} g</span>
                  </p>
                )}
                {product.sugar !== null && product.sugar !== undefined && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Socker</span>
                    <span className="font-semibold text-white">{Math.round(product.sugar * 10) / 10} g</span>
                  </p>
                )}
                {product.saturatedFat !== null && product.saturatedFat !== undefined && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Mättat fett</span>
                    <span className="font-semibold text-white">{Math.round(product.saturatedFat * 10) / 10} g</span>
                  </p>
                )}
                {product.salt !== null && product.salt !== undefined && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Salt</span>
                    <span className="font-semibold text-white">{Math.round(product.salt * 100) / 100} g</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Micronutrients */}
          {hasMicronutrients && (
            <div>
              <h2 className="text-amber-500 font-semibold mb-2">Vitaminer & Mineraler:</h2>
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-2 text-sm">
                {product.vitaminA && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Vitamin A</span>
                    <span className="font-semibold text-white">{Math.round(product.vitaminA)} µg</span>
                  </p>
                )}
                {product.vitaminD && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Vitamin D</span>
                    <span className="font-semibold text-white">{Math.round(product.vitaminD * 10) / 10} µg</span>
                  </p>
                )}
                {product.vitaminC && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Vitamin C</span>
                    <span className="font-semibold text-white">{Math.round(product.vitaminC)} mg</span>
                  </p>
                )}
                {product.vitaminB12 && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Vitamin B12</span>
                    <span className="font-semibold text-white">{Math.round(product.vitaminB12 * 10) / 10} µg</span>
                  </p>
                )}
                {product.folate && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Folat</span>
                    <span className="font-semibold text-white">{Math.round(product.folate)} µg</span>
                  </p>
                )}
                {product.calcium && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Kalcium</span>
                    <span className="font-semibold text-white">{Math.round(product.calcium)} mg</span>
                  </p>
                )}
                {product.iron && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Järn</span>
                    <span className="font-semibold text-white">{Math.round(product.iron * 10) / 10} mg</span>
                  </p>
                )}
                {product.magnesium && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Magnesium</span>
                    <span className="font-semibold text-white">{Math.round(product.magnesium)} mg</span>
                  </p>
                )}
                {product.potassium && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Kalium</span>
                    <span className="font-semibold text-white">{Math.round(product.potassium)} mg</span>
                  </p>
                )}
                {product.zinc && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Zink</span>
                    <span className="font-semibold text-white">{Math.round(product.zinc * 10) / 10} mg</span>
                  </p>
                )}
                {product.iodine && (
                  <p className="flex justify-between">
                    <span className="text-gray-300">• Jod</span>
                    <span className="font-semibold text-white">{Math.round(product.iodine)} µg</span>
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Source info */}
          <div className="text-center text-xs text-gray-500 pt-2">
            Källa: {product.source === 'ica' ? 'ICA' : product.source === 'slv' ? 'Livsmedelsverket' : product.source}
          </div>
        </div>

        {/* Footer - fixed */}
        <div className="p-4 border-t border-gray-800 flex-shrink-0">
          <Button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            Stäng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

