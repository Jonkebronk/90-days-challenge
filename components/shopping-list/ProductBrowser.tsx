'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Loader2, Check, Plus, Beef, Wheat, Droplets, UtensilsCrossed, Leaf, Flame, Carrot, Package } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface Product {
  id: string
  name: string
  image: string | null
  kcal: number
  protein: number
  carbs: number
  fat: number
  category: string | null
}

interface ProductBrowserProps {
  onAddProduct: (product: Product) => void
  addedIds?: Set<string>
  className?: string
}

// Main macro categories
const MACRO_CATEGORIES = [
  { id: 'proteinkallor', label: 'Protein', icon: Beef, color: 'from-red-500 to-rose-600' },
  { id: 'kolhydratkallor', label: 'Kolhydrat', icon: Wheat, color: 'from-amber-500 to-yellow-600' },
  { id: 'fettkallor', label: 'Fett', icon: Droplets, color: 'from-blue-500 to-cyan-600' },
]

// Secondary categories
const SECONDARY_CATEGORIES = [
  { id: 'sasar', label: 'Såser', icon: UtensilsCrossed },
  { id: 'kryddor', label: 'Kryddor', icon: Leaf },
  { id: 'matlagningsfett', label: 'Matlagning', icon: Flame },
  { id: 'gronsaker', label: 'Grönsaker', icon: Carrot },
]

export function ProductBrowser({
  onAddProduct,
  addedIds = new Set(),
  className,
}: ProductBrowserProps) {
  const [products, setProducts] = useState<Product[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = '/api/products?limit=50'
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`
      if (selectedCategory) {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }

      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json()
        setProducts(data.products || [])
        setCategoryCounts(data.categoryCounts || {})
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedCategory])

  useEffect(() => {
    const debounce = setTimeout(fetchProducts, 300)
    return () => clearTimeout(debounce)
  }, [fetchProducts])

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Sök livsmedel..."
          className="pl-10 bg-black/30 border-gold-primary/30 text-white"
        />
      </div>

      {/* Main macro categories */}
      <div className="grid grid-cols-3 gap-1.5 mb-2">
        {MACRO_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.id
          const count = categoryCounts[cat.id] || 0

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isActive ? null : cat.id)}
              className={cn(
                'relative flex flex-col items-center justify-center p-2 rounded-lg transition-all',
                isActive
                  ? `bg-gradient-to-br ${cat.color} text-white`
                  : 'bg-white/10 text-gray-300 hover:bg-white/20'
              )}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-semibold">{cat.label}</span>
              {count > 0 && (
                <span className={cn(
                  'absolute top-0.5 right-0.5 text-[8px] px-1 py-0.5 rounded-full',
                  isActive ? 'bg-white/30' : 'bg-white/20'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Secondary categories */}
      <div className="grid grid-cols-4 gap-1 mb-3">
        {SECONDARY_CATEGORIES.map((cat) => {
          const Icon = cat.icon
          const isActive = selectedCategory === cat.id
          const count = categoryCounts[cat.id] || 0

          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(isActive ? null : cat.id)}
              className={cn(
                'flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg transition-all text-[10px]',
                isActive
                  ? 'bg-gold-primary text-black font-semibold'
                  : 'bg-white/10 text-gray-400 hover:bg-white/20'
              )}
            >
              <Icon className="w-3 h-3" />
              <span>{cat.label}</span>
              {count > 0 && (
                <span className={cn(
                  'px-1 rounded-full',
                  isActive ? 'bg-black/20' : 'bg-white/20'
                )}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Products grid */}
      <div className="flex-1 overflow-auto -mx-2 px-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gold-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">
              {searchQuery ? 'Inga produkter hittades' : 'Välj en kategori eller sök'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {products.map((product) => {
              const isAdded = addedIds.has(product.id)

              return (
                <button
                  key={product.id}
                  onClick={() => !isAdded && onAddProduct(product)}
                  disabled={isAdded}
                  className={cn(
                    'bg-white/5 rounded-lg overflow-hidden text-left transition-all',
                    isAdded
                      ? 'ring-2 ring-green-500 opacity-75'
                      : 'hover:bg-white/10 active:scale-95'
                  )}
                >
                  {/* Image */}
                  <div className="aspect-square bg-zinc-800 relative">
                    {product.image ? (
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-zinc-600" />
                      </div>
                    )}
                    {/* Added indicator */}
                    {isAdded && (
                      <div className="absolute inset-0 bg-green-500/30 flex items-center justify-center">
                        <Check className="w-6 h-6 text-green-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium text-white line-clamp-2 leading-tight mb-1">
                      {product.name}
                    </p>
                    <div className="text-[8px] text-gray-400 space-y-px">
                      <p>
                        <span className="text-amber-400">{Math.round(product.kcal)}</span> kcal
                      </p>
                      <p>
                        P: <span className="text-blue-400">{Math.round(product.protein)}g</span>
                        {' '}K: <span className="text-yellow-400">{Math.round(product.carbs)}g</span>
                        {' '}F: <span className="text-red-400">{Math.round(product.fat)}g</span>
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
