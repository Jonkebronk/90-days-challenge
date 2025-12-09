'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search,
  Package,
  Loader2,
  Grid3X3,
  List,
  Milk,
  Drumstick,
  Fish,
  Croissant,
  Apple,
  Carrot,
  Wine,
  Cookie,
  Snowflake,
  Wheat,
  MoreHorizontal,
  Edit2,
  X,
  Check,
  Plus,
  Camera,
  Database,
  Store,
  Globe
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { LabelScannerModal } from '@/components/products/LabelScannerModal'
import { ManualProductModal } from '@/components/products/ManualProductModal'

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
  source: string
}

const SOURCES = [
  { id: 'all', label: 'Alla', icon: Database },
  { id: 'openfoodfacts', label: 'Open Food Facts', icon: Globe },
  { id: 'ica', label: 'ICA', icon: Store },
  { id: 'coop', label: 'COOP', icon: Store },
]

const CATEGORIES = [
  { id: 'all', label: 'Alla', icon: Package },
  { id: 'mejeri', label: 'Mejeri', icon: Milk },
  { id: 'kött', label: 'Kött', icon: Drumstick },
  { id: 'fisk', label: 'Fisk', icon: Fish },
  { id: 'bröd', label: 'Bröd', icon: Croissant },
  { id: 'frukt', label: 'Frukt', icon: Apple },
  { id: 'grönsaker', label: 'Grönsaker', icon: Carrot },
  { id: 'dryck', label: 'Dryck', icon: Wine },
  { id: 'snacks', label: 'Snacks', icon: Cookie },
  { id: 'fryst', label: 'Fryst', icon: Snowflake },
  { id: 'torrvaror', label: 'Torrvaror', icon: Wheat },
  { id: 'uncategorized', label: 'Okategoriserat', icon: MoreHorizontal },
]

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSource, setSelectedSource] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editCategory, setEditCategory] = useState<string>('')
  const [isLabelScannerOpen, setIsLabelScannerOpen] = useState(false)
  const [isManualAddOpen, setIsManualAddOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = '/api/products?limit=100'
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`
      if (selectedCategory && selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }
      if (selectedSource && selectedSource !== 'all') {
        url += `&source=${encodeURIComponent(selectedSource)}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch')

      const data = await res.json()
      setProducts(data.products || [])
      setCategoryCounts(data.categoryCounts || {})
      setSourceCounts(data.sourceCounts || {})
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedSource])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  const handleUpdateCategory = async (productId: string, category: string | null) => {
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category })
      })

      if (res.ok) {
        setProducts(prev => prev.map(p =>
          p.id === productId ? { ...p, category } : p
        ))
        setEditingProduct(null)
        // Refresh to get updated counts
        fetchProducts()
      }
    } catch (error) {
      console.error('Failed to update product:', error)
    }
  }

  const totalProducts = Object.values(sourceCounts).reduce((a, b) => a + b, 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Produktbibliotek</h1>
              <p className="text-xs sm:text-sm text-gray-500">{totalProducts} produkter</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Desktop: Manual Add button */}
              <Button
                onClick={() => setIsManualAddOpen(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till manuellt
              </Button>
              {/* Camera/Scan button */}
              <Button
                onClick={() => setIsLabelScannerOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
                size="sm"
              >
                <Camera className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Skanna</span>
              </Button>
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className={viewMode === 'grid' ? 'bg-gold-primary text-black' : ''}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                className={viewMode === 'list' ? 'bg-gold-primary text-black' : ''}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Source tabs (database filter) */}
          <div className="flex gap-1.5 mb-3 overflow-x-auto scrollbar-hide">
            {SOURCES.map(src => {
              const count = src.id === 'all' ? totalProducts : (sourceCounts[src.id] || 0)
              const Icon = src.icon
              const isActive = selectedSource === src.id

              return (
                <button
                  key={src.id}
                  onClick={() => setSelectedSource(src.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all text-sm ${
                    isActive
                      ? 'bg-emerald-600 text-white font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{src.label}</span>
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-gray-200'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Sök produkter..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>
        </div>

        {/* Category tabs - horizontal scroll on mobile */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 pb-2 min-w-max">
            {CATEGORIES.map(cat => {
              const count = cat.id === 'all' ? totalProducts : (categoryCounts[cat.id] || 0)
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-lg whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-gold-primary text-black font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-xs sm:text-sm">{cat.label}</span>
                  {count > 0 && (
                    <span className={`text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-black/20' : 'bg-gray-200'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold-primary" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12 px-4">
            <Package className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">Inga produkter hittades</p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Scanna streckkoder för att bygga ditt bibliotek
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
            {products.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => {
                  setEditingProduct(product)
                  setEditCategory(product.category || '')
                }}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map(product => (
              <ProductRow
                key={product.id}
                product={product}
                onEdit={() => {
                  setEditingProduct(product)
                  setEditCategory(product.category || '')
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Edit category modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl w-full sm:max-w-md p-4 sm:p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Kategorisera produkt</h3>
              <Button variant="ghost" size="sm" onClick={() => setEditingProduct(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg">
              {editingProduct.image && (
                <img
                  src={editingProduct.image}
                  alt={editingProduct.name}
                  className="w-12 h-12 object-cover rounded"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{editingProduct.name}</p>
                {editingProduct.brand && (
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{editingProduct.brand}</p>
                )}
              </div>
            </div>

            <div className="mb-4">
              <Label className="text-sm">Kategori</Label>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 sm:gap-2 mt-2">
                {CATEGORIES.filter(c => c.id !== 'all').map(cat => {
                  const Icon = cat.icon
                  const isSelected = editCategory === cat.id || (cat.id === 'uncategorized' && !editCategory)

                  return (
                    <button
                      key={cat.id}
                      onClick={() => setEditCategory(cat.id === 'uncategorized' ? '' : cat.id)}
                      className={`flex flex-col items-center gap-0.5 sm:gap-1 p-2 sm:p-3 rounded-lg border transition-all ${
                        isSelected
                          ? 'border-gold-primary bg-gold-primary/10'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isSelected ? 'text-gold-primary' : 'text-gray-400'}`} />
                      <span className="text-[10px] sm:text-xs">{cat.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex gap-2 sm:gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setEditingProduct(null)}
              >
                Avbryt
              </Button>
              <Button
                className="flex-1 bg-gold-primary text-black hover:bg-gold-primary/90"
                onClick={() => handleUpdateCategory(editingProduct.id, editCategory || null)}
              >
                <Check className="w-4 h-4 mr-1 sm:mr-2" />
                Spara
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Label Scanner Modal */}
      <LabelScannerModal
        isOpen={isLabelScannerOpen}
        onClose={() => setIsLabelScannerOpen(false)}
        onProductAdded={fetchProducts}
      />

      {/* Manual Product Add Modal */}
      <ManualProductModal
        isOpen={isManualAddOpen}
        onClose={() => setIsManualAddOpen(false)}
        onProductAdded={fetchProducts}
      />
    </div>
  )
}

function ProductCard({ product, onEdit }: { product: Product; onEdit: () => void }) {
  return (
    <div className="bg-white rounded-lg sm:rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 sm:w-12 sm:h-12 text-gray-300" />
          </div>
        )}
        <button
          onClick={onEdit}
          className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 p-1 sm:p-1.5 bg-white/90 rounded-md sm:rounded-lg hover:bg-white shadow-sm"
        >
          <Edit2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gray-600" />
        </button>
      </div>
      <div className="p-2 sm:p-3">
        <h3 className="font-medium text-gray-900 text-xs sm:text-sm line-clamp-2">{product.name}</h3>
        {product.brand && (
          <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 truncate">{product.brand}</p>
        )}
        <div className="flex items-center justify-between mt-1.5 sm:mt-2">
          <span className="text-xs sm:text-sm font-semibold text-gold-primary">{Math.round(product.kcal)} kcal</span>
          <span className="text-[10px] sm:text-xs text-gray-400">/100g</span>
        </div>
        <div className="flex gap-1.5 sm:gap-2 mt-1 text-[10px] sm:text-xs text-gray-500">
          <span>P: {Math.round(product.protein)}g</span>
          <span>K: {Math.round(product.carbs)}g</span>
          <span>F: {Math.round(product.fat)}g</span>
        </div>
        {product.category && (
          <span className="inline-block mt-1.5 sm:mt-2 text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
            {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
          </span>
        )}
      </div>
    </div>
  )
}

function ProductRow({ product, onEdit }: { product: Product; onEdit: () => void }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-shadow">
      <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{product.name}</h3>
        <div className="flex items-center gap-1.5 sm:gap-2 mt-0.5 flex-wrap">
          {product.brand && (
            <span className="text-[10px] sm:text-xs text-gray-500 truncate max-w-[80px] sm:max-w-none">{product.brand}</span>
          )}
          {product.category && (
            <span className="text-[10px] sm:text-xs px-1 sm:px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              {CATEGORIES.find(c => c.id === product.category)?.label || product.category}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="font-semibold text-gold-primary text-xs sm:text-base">{Math.round(product.kcal)} kcal</div>
        <div className="text-[10px] sm:text-xs text-gray-500 hidden sm:block">
          P: {Math.round(product.protein)}g · K: {Math.round(product.carbs)}g · F: {Math.round(product.fat)}g
        </div>
        <div className="text-[10px] text-gray-500 sm:hidden">
          {Math.round(product.protein)}P {Math.round(product.carbs)}K {Math.round(product.fat)}F
        </div>
      </div>
      <button
        onClick={onEdit}
        className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
      >
        <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
      </button>
    </div>
  )
}
