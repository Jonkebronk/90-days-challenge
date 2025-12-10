'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
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
  FolderCog,
  Inbox,
  Send,
  ImagePlus,
  X,
  Check,
  ChevronDown
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LabelScannerModal } from '@/components/products/LabelScannerModal'
import { ManualProductModal } from '@/components/products/ManualProductModal'
import { EditProductModal } from '@/components/products/EditProductModal'
import { ManageCategoriesModal } from '@/components/products/ManageCategoriesModal'
import { ProductDetailModal } from '@/components/products/ProductDetailModal'
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
  const { data: session } = useSession()
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

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
  const [isRequestsInboxOpen, setIsRequestsInboxOpen] = useState(false)
  const [isClientRequestModalOpen, setIsClientRequestModalOpen] = useState(false)
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null)

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
              {/* Coach only buttons */}
              {isCoach && (
                <>
                  {/* Inbox for product requests */}
                  <Button
                    onClick={() => setIsRequestsInboxOpen(true)}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <Inbox className="w-4 h-4 mr-2" />
                    Förfrågningar
                  </Button>
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
                </>
              )}
              {/* Client only: Request product button */}
              {!isCoach && (
                <Button
                  onClick={() => setIsClientRequestModalOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                  size="sm"
                >
                  <Send className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Saknar du något?</span>
                </Button>
              )}
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
                    isCoach={isCoach}
                    onClick={() => setViewingProduct(product)}
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
                    isCoach={isCoach}
                    onClick={() => setViewingProduct(product)}
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

      {/* Client Request Modal - Only for clients */}
      {!isCoach && (
        <ClientRequestModal
          isOpen={isClientRequestModalOpen}
          onClose={() => setIsClientRequestModalOpen(false)}
          categories={CATEGORIES}
        />
      )}

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

      {/* Product Requests Inbox Modal - Coach only */}
      {isCoach && (
        <ProductRequestsInbox
          isOpen={isRequestsInboxOpen}
          onClose={() => setIsRequestsInboxOpen(false)}
          onProductAdded={fetchProducts}
        />
      )}

      {/* Product Detail Modal - for both coach and client */}
      <ProductDetailModal
        isOpen={!!viewingProduct}
        product={viewingProduct}
        onClose={() => setViewingProduct(null)}
      />
    </div>
  )
}

function ProductCard({ product, isCoach, onClick, onEdit }: { product: Product; isCoach: boolean; onClick: () => void; onEdit: () => void }) {
  return (
    <div
      className="bg-white rounded border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onClick}
    >
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
        {isCoach && (
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(); }}
            className="absolute top-1 right-1 p-1 bg-white/90 rounded shadow-sm hover:bg-white"
          >
            <Edit2 className="w-3 h-3 text-gray-500" />
          </button>
        )}
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

function ProductRow({ product, isCoach, onClick, onEdit }: { product: Product; isCoach: boolean; onClick: () => void; onEdit: () => void }) {
  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onClick}
    >
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
      {isCoach && (
        <button
          onClick={(e) => { e.stopPropagation(); onEdit(); }}
          className="p-1.5 sm:p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
        >
          <Edit2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400" />
        </button>
      )}
    </div>
  )
}

// Client Request Modal Component
function ClientRequestModal({
  isOpen,
  onClose,
  categories
}: {
  isOpen: boolean
  onClose: () => void
  categories: typeof CATEGORIES
}) {
  const [name, setName] = useState('')
  const [brand, setBrand] = useState('')
  const [category, setCategory] = useState('')
  const [frontImage, setFrontImage] = useState<string | null>(null)
  const [nutritionImage, setNutritionImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleImageUpload = (file: File, type: 'front' | 'nutrition') => {
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'front') {
        setFrontImage(reader.result as string)
      } else {
        setNutritionImage(reader.result as string)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/product-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          brand: brand.trim() || null,
          category: category || null,
          frontImage,
          nutritionImage
        })
      })

      if (res.ok) {
        setSubmitted(true)
        setName('')
        setBrand('')
        setCategory('')
        setFrontImage(null)
        setNutritionImage(null)
        setTimeout(() => {
          setSubmitted(false)
          onClose()
        }, 1500)
      }
    } catch (error) {
      console.error('Failed to submit request:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-start sm:items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-2xl overflow-hidden flex flex-col my-4 sm:my-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center gap-2 text-amber-600">
            <Send className="w-5 h-5" />
            <span className="font-medium">Förfrågan om livsmedel</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-sm text-gray-600 text-center mb-4">
            Hittar du inte det du söker? Ange livsmedlet nedan och skicka en förfrågan till oss.
          </p>

          {/* Image uploads */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-500 text-center mb-2">Bild på framsidan</p>
              <label className="block aspect-square bg-gray-100 rounded-lg cursor-pointer overflow-hidden relative border-2 border-dashed border-gray-300 hover:border-amber-400 transition-colors">
                {frontImage ? (
                  <img src={frontImage} alt="Framsida" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-xs">Lägg till</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'front')}
                />
                {frontImage && (
                  <button
                    onClick={(e) => { e.preventDefault(); setFrontImage(null) }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </label>
            </div>
            <div>
              <p className="text-xs text-gray-500 text-center mb-2">Innehållsförteckning</p>
              <label className="block aspect-square bg-gray-100 rounded-lg cursor-pointer overflow-hidden relative border-2 border-dashed border-gray-300 hover:border-amber-400 transition-colors">
                {nutritionImage ? (
                  <img src={nutritionImage} alt="Innehållsförteckning" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                    <ImagePlus className="w-6 h-6 mb-1" />
                    <span className="text-xs">Lägg till</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], 'nutrition')}
                />
                {nutritionImage && (
                  <button
                    onClick={(e) => { e.preventDefault(); setNutritionImage(null) }}
                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </label>
            </div>
          </div>

          {/* Name input */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Livsmedelsnamn *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="t.ex. Kvarg vanilj"
              className="w-full"
            />
          </div>

          {/* Brand input */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Märke (valfritt)</label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="t.ex. Lindahls"
              className="w-full"
            />
          </div>

          {/* Category dropdown */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Kategori (valfritt)</label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg appearance-none bg-white pr-10 text-sm"
              >
                <option value="">Välj kategori</option>
                {categories.filter(c => c.id !== 'all').map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !name.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : submitted ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {submitted ? 'Förfrågan skickad!' : 'Skicka förfrågan'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Product Requests Inbox Modal for Coaches
interface ProductRequestItem {
  id: string
  name: string
  brand: string | null
  category: string | null
  frontImage: string | null
  nutritionImage: string | null
  status: string
  createdAt: string
  user: {
    name: string | null
    email: string
  }
}

function ProductRequestsInbox({
  isOpen,
  onClose,
  onProductAdded
}: {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
}) {
  const [requests, setRequests] = useState<ProductRequestItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<ProductRequestItem | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRequests()
    }
  }, [isOpen])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/product-requests')
      if (res.ok) {
        const data = await res.json()
        setRequests(data.requests || [])
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleApprove = async (requestId: string) => {
    try {
      const res = await fetch(`/api/product-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      })
      if (res.ok) {
        fetchRequests()
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Failed to approve:', error)
    }
  }

  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch(`/api/product-requests/${requestId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      })
      if (res.ok) {
        fetchRequests()
        setSelectedRequest(null)
      }
    } catch (error) {
      console.error('Failed to reject:', error)
    }
  }

  if (!isOpen) return null

  const pendingRequests = requests.filter(r => r.status === 'pending')

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-gold-primary" />
            <h2 className="text-lg font-semibold">Produktförfrågningar</h2>
            {pendingRequests.length > 0 && (
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full">
                {pendingRequests.length} nya
              </span>
            )}
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Inga väntande förfrågningar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingRequests.map(request => (
                <div
                  key={request.id}
                  className="bg-gray-50 rounded-lg p-4 border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-gray-900">{request.name}</h3>
                        {request.brand && (
                          <span className="text-sm text-gray-500">({request.brand})</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mb-2">
                        Från: {request.user.name || request.user.email} · {new Date(request.createdAt).toLocaleDateString('sv-SE')}
                      </p>
                      {request.category && (
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {CATEGORIES.find(c => c.id === request.category)?.label || request.category}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {(request.frontImage || request.nutritionImage) && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                        >
                          Visa bilder
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleReject(request.id)}
                        className="text-red-600 hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(request.id)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Images preview inline */}
                  {(request.frontImage || request.nutritionImage) && selectedRequest?.id === request.id && (
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                      {request.frontImage && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Framsida</p>
                          <img src={request.frontImage} alt="Framsida" className="w-full rounded-lg" />
                        </div>
                      )}
                      {request.nutritionImage && (
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Innehållsförteckning</p>
                          <img src={request.nutritionImage} alt="Innehåll" className="w-full rounded-lg" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
