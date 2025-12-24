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
  ChevronDown,
  Pencil,
  Save,
  Beef,
  Droplets,
  UtensilsCrossed,
  Flame,
  Leaf,
  Heart,
  ShoppingCart,
  ListPlus,
} from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  servingUnit?: string
}

const SOURCES = [
  { id: 'all', label: 'Alla', icon: Database },
  { id: 'ica', label: 'ICA', icon: Store },
]

// Built-in categories with icons - can be overridden by DB
// Use ASCII keys for consistency with database storage
const BUILT_IN_CATEGORIES = [
  // Main macro categories
  { id: 'proteinkallor', label: 'Proteinkällor', icon: Beef, isMainCategory: true },
  { id: 'kolhydratkallor', label: 'Kolhydratskällor', icon: Wheat, isMainCategory: true },
  { id: 'fettkallor', label: 'Fettkällor', icon: Droplets, isMainCategory: true },
  // Secondary categories
  { id: 'sasar', label: 'Såser', icon: UtensilsCrossed, isSecondaryCategory: true },
  { id: 'kryddor', label: 'Kryddor', icon: Leaf, isSecondaryCategory: true },
  { id: 'matlagningsfett', label: 'Matlagningsfett', icon: Flame, isSecondaryCategory: true },
  { id: 'gronsaker', label: 'Grönsaker', icon: Carrot, isSecondaryCategory: true },
]

// Icon mapping for dynamic categories (ASCII keys)
const CATEGORY_ICONS: Record<string, any> = {
  proteinkallor: Beef,
  kolhydratkallor: Wheat,
  fettkallor: Droplets,
  sasar: UtensilsCrossed,
  kryddor: Leaf,
  matlagningsfett: Flame,
  mejeri: Milk,
  kott: Drumstick,
  fisk: Fish,
  brod: Croissant,
  frukt: Apple,
  gronsaker: Carrot,
  dryck: Wine,
  snacks: Cookie,
  fryst: Snowflake,
  torrvaror: Wheat,
}

// Category descriptions for display when category is selected
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  proteinkallor: 'Proteinkällor är livsmedel rika på protein som hjälper till att bygga och reparera muskler. Inkluderar kött, fisk, fågel, ägg, baljväxter och mejeriprodukter.',
  kolhydratkallor: 'Kolhydratskällor ger kroppen energi. Inkluderar bröd, pasta, ris, potatis, frukt och andra stärkelserika livsmedel.',
  fettkallor: 'Fettkällor innehåller hälsosamma fetter som är viktiga för hormonproduktion och näringsupptag. Inkluderar oljor, nötter, avokado och feta fiskar.',
  matlagningsfett: 'Matlagningsfett som smör, olja och kokosfett för stekning och tillagning. Välj rätt fett beroende på tillagningsmetod.',
  mejeri: 'Mejeriprodukter inkluderar mjölk, ost, yoghurt, kvarg och andra mjölkbaserade livsmedel. Bra källor till protein, kalcium och B-vitaminer.',
  kott: 'Kött från nöt, fläsk, lamm och vilt. Utmärkta proteinkällor med hög biologisk kvalitet samt järn och B12.',
  fisk: 'Fisk och skaldjur ger högkvalitativt protein, omega-3-fettsyror och vitamin D. Rekommenderas 2-3 gånger per vecka.',
  brod: 'Bröd och bakade produkter. Välj gärna fullkornsvarianter för mer fiber, vitaminer och mineraler.',
  frukt: 'Färsk och torkad frukt ger naturliga sockerarter, fiber, vitaminer och antioxidanter. Sträva efter variation!',
  gronsaker: 'Grönsaker är fulla av fiber, vitaminer och mineraler med lågt kaloriinnehåll. Ät regnbågens alla färger!',
  dryck: 'Drycker inkluderar allt från vatten och juice till sportdrycker. Tänk på sockret i söta drycker.',
  snacks: 'Snacks och godis för tillfälligt njutande. Njut med måtta och balansera med näringsrik kost.',
  fryst: 'Frysta livsmedel behåller ofta sitt näringsvärde bra. Praktiskt för planering och mindre matsvinn.',
  torrvaror: 'Torrvaror som pasta, ris, gryn och müsli. Basvaror med lång hållbarhet för kolhydrater och fiber.',
  kryddor: 'Kryddor och smaksättare ger smak utan kalorier. Många har även hälsofördelar som antioxidanter.',
  sasar: 'Såser för matlagning och smaksättning. Kontrollera näringsinnehållet - varierar mycket mellan produkter.',
}

// Normalize category key from Swedish to ASCII for consistency
const normalizeCategoryKey = (key: string | null): string => {
  if (!key) return ''
  return key
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
}

export default function ProductsPage() {
  const { data: session } = useSession()
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  const [products, setProducts] = useState<Product[]>([])
  const [categoryCounts, setCategoryCounts] = useState<Record<string, number>>({})
  const [sourceCounts, setSourceCounts] = useState<Record<string, number>>({})
  const [subCategoryCounts, setSubCategoryCounts] = useState<Record<string, number>>({})
  const [isLoading, setIsLoading] = useState(true)

  // Dynamic categories from API + built-in (initialize with built-in to avoid empty state)
  const [categories, setCategories] = useState<Array<{ id: string; label: string; icon: any; description?: string | null }>>(
    BUILT_IN_CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon }))
  )
  const [dbSubcategories, setDbSubcategories] = useState<Array<{ key: string; label: string; parentKey: string }>>([])
  const [hiddenCategories, setHiddenCategories] = useState<Set<string>>(new Set())
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
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editingDescriptionText, setEditingDescriptionText] = useState('')
  const [isSavingDescription, setIsSavingDescription] = useState(false)
  const [pendingRequestData, setPendingRequestData] = useState<{
    name?: string
    brand?: string
    category?: string
    frontImage?: string | null
    nutritionImage?: string | null
    requestId?: string
  } | null>(null)

  // Favorites and shopping lists state
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [shoppingLists, setShoppingLists] = useState<Array<{ id: string; name: string; color: string }>>([])
  const [showListPicker, setShowListPicker] = useState<string | null>(null) // product id or null

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

  // Fetch categories from API and merge with built-in
  const fetchCategories = useCallback(async () => {
    try {
      // Load hidden categories from localStorage (SSR-safe)
      let hidden = new Set<string>()
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('hiddenProductCategories')
        hidden = stored ? new Set<string>(JSON.parse(stored)) : new Set<string>()
      }
      setHiddenCategories(hidden)

      const res = await fetch('/api/product-categories')
      if (res.ok) {
        const data = await res.json()
        const dbCats = data.categories || []
        const dbSubs = data.subcategories || []

        // Merge built-in with DB overrides
        const mergedCategories: Array<{ id: string; label: string; icon: any; description?: string | null }> = []

        // Add built-in categories (with possible DB label/description overrides)
        for (const builtIn of BUILT_IN_CATEGORIES) {
          if (hidden.has(builtIn.id)) continue // Skip hidden
          const dbOverride = dbCats.find((c: any) => c.key === builtIn.id)
          mergedCategories.push({
            id: builtIn.id,
            label: dbOverride?.label || builtIn.label,
            icon: builtIn.icon,
            description: dbOverride?.description || null
          })
        }

        // Add custom categories from DB
        for (const dbCat of dbCats) {
          if (dbCat.isCustom && !dbCat.parentKey && !hidden.has(dbCat.key)) {
            mergedCategories.push({
              id: dbCat.key,
              label: dbCat.label,
              icon: CATEGORY_ICONS[normalizeCategoryKey(dbCat.key)] || Package,
              description: dbCat.description || null
            })
          }
        }

        setCategories(mergedCategories)
        setDbSubcategories(dbSubs.map((s: any) => ({
          key: s.key,
          label: s.label,
          parentKey: s.parentKey
        })))
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      // Fallback to built-in categories
      setCategories(BUILT_IN_CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon })))
    }
  }, [])

  // Fetch favorites
  const fetchFavorites = useCallback(async () => {
    try {
      const res = await fetch('/api/favorites')
      if (res.ok) {
        const data = await res.json()
        const ids = new Set<string>()
        // FavoriteProduct can have foodItemId - we use Product.id which maps to that
        for (const fav of data.favorites || []) {
          if (fav.foodItemId) ids.add(fav.foodItemId)
        }
        setFavoriteIds(ids)
      }
    } catch (error) {
      console.error('Failed to fetch favorites:', error)
    }
  }, [])

  // Fetch shopping lists
  const fetchShoppingLists = useCallback(async () => {
    try {
      const res = await fetch('/api/shopping-lists')
      if (res.ok) {
        const data = await res.json()
        const lists = (data.ownLists || []).map((l: any) => ({
          id: l.id,
          name: l.name,
          color: l.color,
        }))
        setShoppingLists(lists)
      }
    } catch (error) {
      console.error('Failed to fetch shopping lists:', error)
    }
  }, [])

  // Toggle favorite
  const handleToggleFavorite = async (product: Product) => {
    const isFavorite = favoriteIds.has(product.id)

    if (isFavorite) {
      // Remove favorite
      try {
        const res = await fetch(`/api/favorites?foodItemId=${product.id}`, {
          method: 'DELETE',
        })
        if (res.ok) {
          setFavoriteIds(prev => {
            const next = new Set(prev)
            next.delete(product.id)
            return next
          })
          toast.success('Borttagen från favoriter')
        }
      } catch (error) {
        toast.error('Kunde inte ta bort favorit')
      }
    } else {
      // Add favorite
      try {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            foodItemId: product.id,
            name: product.name,
            imageUrl: product.image,
            category: product.category || 'Övrigt',
          }),
        })
        if (res.ok) {
          setFavoriteIds(prev => new Set([...prev, product.id]))
          toast.success('Tillagd som favorit')
        } else if (res.status === 409) {
          // Already favorite
          setFavoriteIds(prev => new Set([...prev, product.id]))
        }
      } catch (error) {
        toast.error('Kunde inte lägga till favorit')
      }
    }
  }

  // Add to shopping list
  const handleAddToShoppingList = async (product: Product, listId: string) => {
    try {
      const res = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customName: product.name,
          quantity: 1,
          unit: 'st',
          category: product.category || 'Övrigt',
        }),
      })

      if (res.ok) {
        const list = shoppingLists.find(l => l.id === listId)
        toast.success(`${product.name} tillagd i ${list?.name || 'inköpslistan'}`)
        setShowListPicker(null)
      } else {
        toast.error('Kunde inte lägga till vara')
      }
    } catch (error) {
      toast.error('Ett fel uppstod')
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    if (session?.user) {
      fetchFavorites()
      fetchShoppingLists()
    }
  }, [session, fetchFavorites, fetchShoppingLists])

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
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Livsmedel</h1>
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

          {/* Main macro categories - prominent section */}
          <div className="grid grid-cols-3 gap-1.5 sm:gap-2 mb-2">
            {[
              { id: 'proteinkallor', label: 'Protein', labelFull: 'Proteinkällor', icon: Beef, color: 'from-red-500 to-rose-600' },
              { id: 'kolhydratkallor', label: 'Kolhydrat', labelFull: 'Kolhydratskällor', icon: Wheat, color: 'from-amber-500 to-yellow-600' },
              { id: 'fettkallor', label: 'Fett', labelFull: 'Fettkällor', icon: Droplets, color: 'from-blue-500 to-cyan-600' },
            ].map(cat => {
              const count = categoryCounts[cat.id] || 0
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isActive) {
                      setSelectedCategory('all')
                    } else {
                      setSelectedCategory(cat.id)
                    }
                    setSelectedSubcategory(null)
                  }}
                  className={`relative flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-br ${cat.color} text-white shadow-lg scale-[1.02]`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-5 h-5 sm:w-6 sm:h-6 mb-0.5 sm:mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight sm:hidden">{cat.label}</span>
                  <span className="text-xs font-semibold text-center leading-tight hidden sm:block">{cat.labelFull}</span>
                  {count > 0 && (
                    <span className={`absolute top-0.5 right-0.5 sm:top-1 sm:right-1 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/30 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Secondary categories - smaller */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {[
              { id: 'sasar', label: 'Såser', icon: UtensilsCrossed, color: 'from-purple-500 to-violet-600' },
              { id: 'kryddor', label: 'Kryddor', icon: Leaf, color: 'from-lime-500 to-green-600' },
              { id: 'matlagningsfett', label: 'Matlagning', labelFull: 'Matlagningsfett', icon: Flame, color: 'from-orange-500 to-amber-600' },
              { id: 'gronsaker', label: 'Grönsaker', icon: Carrot, color: 'from-green-500 to-emerald-600' },
            ].map(cat => {
              const count = categoryCounts[cat.id] || 0
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id
              const displayLabel = cat.labelFull || cat.label

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isActive) {
                      setSelectedCategory('all')
                    } else {
                      setSelectedCategory(cat.id)
                    }
                    setSelectedSubcategory(null)
                  }}
                  className={`relative flex items-center justify-center gap-1 sm:gap-2 p-2 sm:p-2.5 rounded-xl transition-all ${
                    isActive
                      ? `bg-gradient-to-br ${cat.color} text-white shadow-lg scale-[1.02]`
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                  <span className="text-[10px] sm:text-xs font-semibold sm:hidden">{cat.label}</span>
                  <span className="text-xs font-semibold hidden sm:block">{displayLabel}</span>
                  {count > 0 && (
                    <span className={`text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0.5 rounded-full ${
                      isActive ? 'bg-white/30 text-white' : 'bg-gray-300 text-gray-600'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
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

          {/* Product request button for non-coaches */}
          {!isCoach && (
            <button
              onClick={() => setIsClientRequestModalOpen(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">Saknar du ett livsmedel? Skicka en förfrågan</span>
            </button>
          )}
        </div>

        {/* Subcategory section */}
        <div className="px-4 pb-3">

          {/* Subcategory chips - show when category has subcategories */}
          {selectedCategory !== 'all' && (() => {
            // Merge hardcoded and DB subcategories
            const hardcodedSubs = SUBCATEGORIES_BY_CATEGORY[selectedCategory.toLowerCase()] || []
            const dbSubs = dbSubcategories.filter(s => s.parentKey === selectedCategory.toLowerCase())

            // Create merged map - DB overrides hardcoded labels
            const merged = new Map<string, { key: string; label: string }>()
            for (const sub of hardcodedSubs) {
              if (!hiddenCategories.has(sub.key)) {
                merged.set(sub.key, { key: sub.key, label: sub.label })
              }
            }
            for (const sub of dbSubs) {
              if (!hiddenCategories.has(sub.key)) {
                merged.set(sub.key, { key: sub.key, label: sub.label })
              }
            }

            const allSubcats = Array.from(merged.values())
            if (allSubcats.length === 0) return null

            return (
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
                {allSubcats.map(subcat => {
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
            )
          })()}
        </div>
      </div>

      {/* Category Description Section */}
      {selectedCategory !== 'all' && (() => {
        const currentCategory = categories.find(c => c.id === selectedCategory)
        const categoryLabel = currentCategory?.label || selectedCategory
        // Use database description first, then fall back to hardcoded, then default text
        const description = currentCategory?.description || CATEGORY_DESCRIPTIONS[selectedCategory] || `Utforska vårt utbud av ${categoryLabel.toLowerCase()}-produkter.`
        const CategoryIcon = currentCategory?.icon || Package

        const handleStartEdit = () => {
          setEditingDescriptionText(currentCategory?.description || CATEGORY_DESCRIPTIONS[selectedCategory] || '')
          setIsEditingDescription(true)
        }

        const handleSaveDescription = async () => {
          setIsSavingDescription(true)
          try {
            const res = await fetch('/api/product-categories', {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                key: selectedCategory,
                description: editingDescriptionText
              })
            })
            if (res.ok) {
              // Update local state
              setCategories(prev => prev.map(c =>
                c.id === selectedCategory
                  ? { ...c, description: editingDescriptionText || null }
                  : c
              ))
              setIsEditingDescription(false)
            }
          } catch (error) {
            console.error('Failed to save description:', error)
          } finally {
            setIsSavingDescription(false)
          }
        }

        return (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <CategoryIcon className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="font-semibold text-gray-900">{categoryLabel}</h3>
                  {isCoach && !isEditingDescription && (
                    <button
                      onClick={handleStartEdit}
                      className="p-1.5 rounded-lg hover:bg-amber-200/50 transition-colors"
                      title="Redigera beskrivning"
                    >
                      <Pencil className="w-4 h-4 text-amber-700" />
                    </button>
                  )}
                </div>
                {isEditingDescription ? (
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={editingDescriptionText}
                      onChange={(e) => setEditingDescriptionText(e.target.value)}
                      placeholder="Skriv en beskrivning för denna kategori..."
                      className="text-sm min-h-[80px] bg-white"
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveDescription}
                        disabled={isSavingDescription}
                        className="bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        {isSavingDescription ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-1" />
                        ) : (
                          <Save className="w-4 h-4 mr-1" />
                        )}
                        Spara
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditingDescription(false)}
                        disabled={isSavingDescription}
                      >
                        Avbryt
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-gray-600 leading-relaxed mt-1">
                    {description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )
      })()}

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
                    isFavorite={favoriteIds.has(product.id)}
                    showListPicker={showListPicker === product.id}
                    shoppingLists={shoppingLists}
                    onClick={() => setViewingProduct(product)}
                    onEdit={() => {
                      setEditingProduct(product)
                      setEditCategory(product.category || '')
                    }}
                    onToggleFavorite={() => handleToggleFavorite(product)}
                    onOpenListPicker={() => setShowListPicker(showListPicker === product.id ? null : product.id)}
                    onAddToList={(listId) => handleAddToShoppingList(product, listId)}
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
          categories={BUILT_IN_CATEGORIES}
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
        onClose={() => {
          setIsManualAddOpen(false)
          setPendingRequestData(null)
        }}
        onProductAdded={() => {
          fetchProducts()
          setPendingRequestData(null)
        }}
        initialData={pendingRequestData || undefined}
      />

      {/* Manage Categories Modal */}
      <ManageCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesChanged={() => {
          fetchCategories()
          fetchProducts()
        }}
      />

      {/* Product Requests Inbox Modal - Coach only */}
      {isCoach && (
        <ProductRequestsInbox
          isOpen={isRequestsInboxOpen}
          onClose={() => setIsRequestsInboxOpen(false)}
          onProductAdded={fetchProducts}
          onApproveRequest={(request) => {
            setPendingRequestData({
              name: request.name,
              brand: request.brand || undefined,
              category: request.category || undefined,
              frontImage: request.frontImage,
              nutritionImage: request.nutritionImage,
              requestId: request.id
            })
            setIsManualAddOpen(true)
          }}
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

function ProductCard({
  product,
  isCoach,
  isFavorite,
  showListPicker,
  shoppingLists,
  onClick,
  onEdit,
  onToggleFavorite,
  onOpenListPicker,
  onAddToList,
}: {
  product: Product
  isCoach: boolean
  isFavorite: boolean
  showListPicker: boolean
  shoppingLists: Array<{ id: string; name: string; color: string }>
  onClick: () => void
  onEdit: () => void
  onToggleFavorite: () => void
  onOpenListPicker: () => void
  onAddToList: (listId: string) => void
}) {
  return (
    <div className="bg-white rounded border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow relative">
      {/* Bild */}
      <div
        className="aspect-square bg-gray-50 relative cursor-pointer"
        onClick={onClick}
      >
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
        {/* Top right buttons */}
        <div className="absolute top-1 right-1 flex gap-1">
          {isCoach && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1 bg-white/90 rounded shadow-sm hover:bg-white"
            >
              <Edit2 className="w-3 h-3 text-gray-500" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div className="px-2 py-2 cursor-pointer" onClick={onClick}>
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-2">{product.name}</h3>
        <p className="text-[10px] text-gray-500 font-medium mt-1">Per 100{product.servingUnit || 'g'}:</p>
        <div className="text-[11px] text-gray-700 mt-0.5 space-y-px">
          <p>• Energi: <span className="font-semibold text-amber-600">{Math.round(product.kcal)} kcal</span></p>
          <p>• Protein: <span className="font-semibold">{Math.round(product.protein)} g</span></p>
          <p>• Kolhydrater: <span className="font-semibold">{Math.round(product.carbs)} g</span></p>
          <p>• Fett: <span className="font-semibold">{Math.round(product.fat)} g</span></p>
        </div>
      </div>

      {/* Action buttons */}
      <div className="px-2 pb-2 flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
          className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium transition-colors ${
            isFavorite
              ? 'bg-red-50 text-red-600 hover:bg-red-100'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-red-500' : ''}`} />
          <span className="hidden sm:inline">{isFavorite ? 'Favorit' : 'Favorit'}</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onOpenListPicker(); }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded text-xs font-medium bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors"
        >
          <ListPlus className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Handla</span>
        </button>
      </div>

      {/* List picker dropdown */}
      {showListPicker && (
        <div className="absolute bottom-14 left-2 right-2 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
          <div className="p-2 border-b border-gray-100 bg-gray-50">
            <p className="text-xs font-medium text-gray-700">Lägg till i lista</p>
          </div>
          {shoppingLists.length === 0 ? (
            <div className="p-3 text-center text-xs text-gray-500">
              Inga inköpslistor ännu
            </div>
          ) : (
            <div className="max-h-40 overflow-auto">
              {shoppingLists.map(list => (
                <button
                  key={list.id}
                  onClick={(e) => { e.stopPropagation(); onAddToList(list.id); }}
                  className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-50 text-left"
                >
                  <div
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: list.color }}
                  />
                  <span className="text-sm text-gray-700 truncate">{list.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
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
              {BUILT_IN_CATEGORIES.find(c => c.id === product.category)?.label || product.category}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">Per 100{product.servingUnit || 'g'}:</p>
        <div className="font-semibold text-amber-600 text-xs sm:text-base">{Math.round(product.kcal)} kcal</div>
        <div className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5">
          P: {Math.round(product.protein)}g • K: {Math.round(product.carbs)}g • F: {Math.round(product.fat)}g
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
  categories: typeof BUILT_IN_CATEGORIES
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
  onProductAdded,
  onApproveRequest
}: {
  isOpen: boolean
  onClose: () => void
  onProductAdded: () => void
  onApproveRequest: (request: ProductRequestItem) => void
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

  const handleApprove = (request: ProductRequestItem) => {
    // Close inbox and open ManualProductModal with request data
    onClose()
    onApproveRequest(request)
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
    <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col my-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Inbox className="w-5 h-5 text-gold-primary" />
            <h2 className="text-lg font-semibold">Livsmedelsförfrågningar</h2>
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
                          {BUILT_IN_CATEGORIES.find(c => c.id === request.category)?.label || request.category}
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
                        onClick={() => handleApprove(request)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Lägg till
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
