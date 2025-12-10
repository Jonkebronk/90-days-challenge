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
  Plus,
  Camera,
  Database,
  Store,
  FolderCog
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LabelScannerModal } from '@/components/products/LabelScannerModal'
import { ManualProductModal } from '@/components/products/ManualProductModal'
import { EditProductModal } from '@/components/products/EditProductModal'
import { ManageCategoriesModal } from '@/components/products/ManageCategoriesModal'
import { SUBCATEGORIES_BY_CATEGORY } from '@/lib/products/subcategories'

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
  // Micronutrients
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
  slvNummer?: number | null
  source: string
}

const SOURCES = [
  { id: 'all', label: 'Alla', icon: Database },
  { id: 'ica', label: 'ICA', icon: Store },
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
  const [subCategoryCounts, setSubCategoryCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [selectedSource, setSelectedSource] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [editCategory, setEditCategory] = useState<string>('')
  const [isLabelScannerOpen, setIsLabelScannerOpen] = useState(false)
  const [isManualAddOpen, setIsManualAddOpen] = useState(false)
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      let url = '/api/products?limit=100'
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`
      if (selectedCategory && selectedCategory !== 'all') {
        url += `&category=${encodeURIComponent(selectedCategory)}`
      }
      if (selectedSubcategory) {
        url += `&subCategory=${encodeURIComponent(selectedSubcategory)}`
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
      setSubCategoryCounts(data.subCategoryCounts || {})
    } catch (error) {
      console.error('Failed to fetch products:', error)
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedSource])

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
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 py-3 sm:py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Livsmedelsbibliotek</h1>
              <p className="text-xs sm:text-sm text-gray-500">{totalProducts} produkter</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Desktop: Manage Categories button */}
              <Button
                onClick={() => setIsManageCategoriesOpen(true)}
                variant="outline"
                size="sm"
                className="hidden sm:flex"
              >
                <FolderCog className="w-4 h-4 mr-2" />
                Kategorier
              </Button>
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

        {/* Category chips */}
        <div className="px-4 pb-3">
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => {
              const count = cat.id === 'all' ? totalProducts : (categoryCounts[cat.id] || 0)
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    // Toggle: if already selected (except 'all'), go back to 'all'
                    if (isActive && cat.id !== 'all') {
                      setSelectedCategory('all')
                    } else {
                      setSelectedCategory(cat.id)
                    }
                    setSelectedSubcategory(null)
                  }}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm transition-colors ${
                    isActive
                      ? 'bg-gold-primary text-black font-medium'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-black/20' : 'bg-gray-200'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Subcategory chips - show when category has subcategories */}
          {selectedCategory !== 'all' && SUBCATEGORIES_BY_CATEGORY[selectedCategory.toLowerCase()] && (
            <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-gray-200">
              <button
                onClick={() => setSelectedSubcategory(null)}
                className={`px-2.5 py-1 rounded-full text-sm transition-colors ${
                  !selectedSubcategory
                    ? 'bg-gray-800 text-white font-medium'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Alla
              </button>
              {SUBCATEGORIES_BY_CATEGORY[selectedCategory.toLowerCase()]?.map(subcat => {
                const count = subCategoryCounts[subcat.key] || 0
                const isActive = selectedSubcategory === subcat.key

                return (
                  <button
                    key={subcat.key}
                    onClick={() => setSelectedSubcategory(isActive ? null : subcat.key)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-800 text-white font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{subcat.label}</span>
                    {count > 0 && (
                      <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div>
        <div>
          {/* Products area */}
          <div className="min-w-0">
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
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-1 sm:gap-1.5">
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
        </div>
      </div>

      {/* Edit Product Modal */}
      <EditProductModal
        isOpen={!!editingProduct}
        product={editingProduct}
        onClose={() => setEditingProduct(null)}
        onProductUpdated={fetchProducts}
      />

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

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesChanged={fetchProducts}
      />
    </div>
  )
}

function ProductCard({ product, onEdit }: { product: Product; onEdit: () => void }) {
  return (
    <div className="bg-white rounded border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow">
      {/* Bild */}
      <div className="aspect-square bg-gray-50 relative">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-8 h-8 text-gray-200" />
          </div>
        )}
        <button
          onClick={onEdit}
          className="absolute top-1 right-1 p-1 bg-white/90 rounded shadow-sm hover:bg-white"
        >
          <Edit2 className="w-3 h-3 text-gray-500" />
        </button>
      </div>

      {/* Info */}
      <div className="px-1.5 py-1.5">
        <p className="text-[11px] text-gray-700 line-clamp-2 leading-tight">{product.name}</p>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-sm font-bold text-amber-600">{Math.round(product.kcal)} kcal</span>
          <span className="text-[9px] text-gray-400">/100g</span>
        </div>
        <p className="text-[10px] text-gray-400 mt-0.5">
          P:{Math.round(product.protein)}g K:{Math.round(product.carbs)}g F:{Math.round(product.fat)}g
        </p>
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
