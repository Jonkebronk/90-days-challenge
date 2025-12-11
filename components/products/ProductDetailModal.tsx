'use client'

import { X, Package, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Product {
  id: string
  ean: string
  name: string
  brand: string | null
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
}

interface ProductDetailModalProps {
  isOpen: boolean
  product: Product | null
  onClose: () => void
}

export function ProductDetailModal({ isOpen, product, onClose }: ProductDetailModalProps) {
  if (!isOpen || !product) return null

  // Check if product has any micronutrients
  const hasMicronutrients = product.vitaminA || product.vitaminD || product.vitaminC ||
    product.vitaminB12 || product.folate || product.calcium || product.iron ||
    product.magnesium || product.potassium || product.zinc || product.iodine

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 pt-8 sm:pt-16 overflow-y-auto">
      <div className="bg-gray-900 w-full sm:max-w-lg rounded-2xl max-h-[85vh] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2 text-gray-400">
            <Info className="w-5 h-5" />
            <span className="text-sm">Näringsinformation</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-gray-700 transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
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

          {/* Main macros */}
          <div>
            <h2 className="text-amber-500 font-semibold mb-3">Makronäringsämnen</h2>
            <p className="text-gray-400 text-sm mb-4">Per 100g</p>

            <div className="grid grid-cols-2 gap-3">
              <MacroCard label="Energi" value={Math.round(product.kcal)} unit="kcal" color="amber" />
              <MacroCard label="Protein" value={Math.round(product.protein * 10) / 10} unit="g" color="blue" />
              <MacroCard label="Kolhydrater" value={Math.round(product.carbs * 10) / 10} unit="g" color="green" />
              <MacroCard label="Fett" value={Math.round(product.fat * 10) / 10} unit="g" color="red" />
            </div>
          </div>

          {/* Additional info */}
          {(product.fiber || product.sugar || product.salt || product.saturatedFat) && (
            <div>
              <h2 className="text-amber-500 font-semibold mb-3">Övrig information</h2>
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                {product.fiber !== null && product.fiber !== undefined && (
                  <InfoRow label="Fiber" value={`${Math.round(product.fiber * 10) / 10} g`} />
                )}
                {product.sugar !== null && product.sugar !== undefined && (
                  <InfoRow label="Socker" value={`${Math.round(product.sugar * 10) / 10} g`} />
                )}
                {product.saturatedFat !== null && product.saturatedFat !== undefined && (
                  <InfoRow label="Mättat fett" value={`${Math.round(product.saturatedFat * 10) / 10} g`} />
                )}
                {product.salt !== null && product.salt !== undefined && (
                  <InfoRow label="Salt" value={`${Math.round(product.salt * 100) / 100} g`} />
                )}
              </div>
            </div>
          )}

          {/* Micronutrients */}
          {hasMicronutrients && (
            <div>
              <h2 className="text-amber-500 font-semibold mb-3">Vitaminer & Mineraler</h2>
              <div className="bg-gray-800/50 rounded-xl p-4 space-y-2">
                {product.vitaminA && <InfoRow label="Vitamin A" value={`${Math.round(product.vitaminA)} µg`} />}
                {product.vitaminD && <InfoRow label="Vitamin D" value={`${Math.round(product.vitaminD * 10) / 10} µg`} />}
                {product.vitaminC && <InfoRow label="Vitamin C" value={`${Math.round(product.vitaminC)} mg`} />}
                {product.vitaminB12 && <InfoRow label="Vitamin B12" value={`${Math.round(product.vitaminB12 * 10) / 10} µg`} />}
                {product.folate && <InfoRow label="Folat" value={`${Math.round(product.folate)} µg`} />}
                {product.calcium && <InfoRow label="Kalcium" value={`${Math.round(product.calcium)} mg`} />}
                {product.iron && <InfoRow label="Järn" value={`${Math.round(product.iron * 10) / 10} mg`} />}
                {product.magnesium && <InfoRow label="Magnesium" value={`${Math.round(product.magnesium)} mg`} />}
                {product.potassium && <InfoRow label="Kalium" value={`${Math.round(product.potassium)} mg`} />}
                {product.zinc && <InfoRow label="Zink" value={`${Math.round(product.zinc * 10) / 10} mg`} />}
                {product.iodine && <InfoRow label="Jod" value={`${Math.round(product.iodine)} µg`} />}
              </div>
            </div>
          )}

          {/* Source info */}
          <div className="text-center text-xs text-gray-500 pt-2">
            Källa: {product.source === 'ica' ? 'ICA' : product.source === 'slv' ? 'Livsmedelsverket' : product.source}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-800">
          <Button
            onClick={onClose}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            Stäng
          </Button>
        </div>
      </div>
    </div>
  )
}

function MacroCard({ label, value, unit, color }: { label: string; value: number; unit: string; color: string }) {
  const colorClasses = {
    amber: 'bg-amber-500/10 border-amber-500/30 text-amber-500',
    blue: 'bg-blue-500/10 border-blue-500/30 text-blue-500',
    green: 'bg-green-500/10 border-green-500/30 text-green-500',
    red: 'bg-red-500/10 border-red-500/30 text-red-500',
  }

  return (
    <div className={`rounded-xl border p-3 ${colorClasses[color as keyof typeof colorClasses]}`}>
      <p className="text-xs text-gray-400 mb-1">{label}</p>
      <p className="text-xl font-bold">
        {value} <span className="text-sm font-normal">{unit}</span>
      </p>
    </div>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-gray-400 text-sm">{label}</span>
      <span className="text-white text-sm font-medium">{value}</span>
    </div>
  )
}
