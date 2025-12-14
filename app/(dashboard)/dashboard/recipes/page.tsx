'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import {
  Search,
  ChefHat,
  Heart,
  Loader2,
  Grid3X3,
  List,
  Sunrise,
  Sun,
  Cookie,
  Moon,
  Lightbulb,
  Droplets,
  Clock,
  Users,
  Plus,
  FolderCog,
  Inbox,
  Send,
  X,
  Check,
  ImagePlus,
  ChevronDown
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ManageRecipeCategoriesModal } from '@/components/recipes/ManageRecipeCategoriesModal'
import { ManualRecipeModal } from '@/components/recipes/ManualRecipeModal'

interface Recipe {
  id: string
  title: string
  description: string | null
  categoryId: string
  subcategoryId: string | null
  servings: number
  prepTimeMinutes: number | null
  cookTimeMinutes: number | null
  difficulty: string | null
  coverImage: string | null
  caloriesPerServing: number | null
  proteinPerServing: number | null
  carbsPerServing: number | null
  fatPerServing: number | null
  category: {
    id: string
    name: string
    slug: string
  }
  subcategory: {
    id: string
    name: string
    slug: string
  } | null
  favorites: { id: string }[]
}

interface RecipeCategory {
  id: string
  name: string
  slug: string
  _count: { recipes: number }
  subcategories: { id: string; name: string; slug: string; categoryId: string }[]
}

interface RecipeSubcategory {
  id: string
  name: string
  slug: string
  categoryId: string
}

interface RecipeRequest {
  id: string
  title: string
  description: string | null
  categoryId: string | null
  image: string | null
  status: string
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
  }
  category: {
    id: string
    name: string
  } | null
}

// Main meal categories (4 prominent buttons)
const MAIN_CATEGORIES = [
  { id: 'frukost', label: 'Frukost', icon: Sunrise, color: 'from-orange-400 to-amber-500' },
  { id: 'lunch-middag', label: 'Lunch & Middag', labelShort: 'Lunch', icon: Sun, color: 'from-green-400 to-emerald-500' },
  { id: 'mellanmal', label: 'Mellanmål', labelShort: 'Mellan', icon: Cookie, color: 'from-pink-400 to-rose-500' },
  { id: 'kvallsmal', label: 'Kvällsmål', labelShort: 'Kväll', icon: Moon, color: 'from-indigo-400 to-purple-500' },
]

// Secondary categories (smaller buttons)
const SECONDARY_CATEGORIES = [
  { id: 'tillagning-tips', label: 'Tips på tillagning', labelShort: 'Tips', icon: Lightbulb, color: 'from-yellow-400 to-amber-500' },
  { id: 'sasar', label: 'Såser', icon: Droplets, color: 'from-purple-400 to-violet-500' },
]

export default function RecipesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [categories, setCategories] = useState<RecipeCategory[]>([])
  const [subcategories, setSubcategories] = useState<RecipeSubcategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null)
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Modal states
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false)
  const [isManualAddOpen, setIsManualAddOpen] = useState(false)
  const [isRequestsInboxOpen, setIsRequestsInboxOpen] = useState(false)
  const [isClientRequestOpen, setIsClientRequestOpen] = useState(false)
  const [pendingRequestData, setPendingRequestData] = useState<{
    title?: string
    description?: string
    categoryId?: string
    image?: string | null
    requestId?: string
  } | null>(null)

  // Fetch all data on mount
  useEffect(() => {
    if (session?.user) {
      fetchData()
    }
  }, [session])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      // Fetch recipes and categories in parallel
      const [recipesRes, categoriesRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/recipe-categories')
      ])

      if (recipesRes.ok) {
        const data = await recipesRes.json()
        setRecipes(data.recipes || [])
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories || [])
        // Extract subcategories from categories
        const allSubcategories: RecipeSubcategory[] = []
        for (const cat of data.categories || []) {
          if (cat.subcategories) {
            allSubcategories.push(...cat.subcategories)
          }
        }
        setSubcategories(allSubcategories)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Find category by slug or name match
  const findCategoryMatch = (categorySlug: string) => {
    return categories.find(c =>
      c.slug === categorySlug ||
      c.name.toLowerCase().includes(categorySlug.replace('-', ' '))
    )
  }

  // Filter recipes based on selection
  const filteredRecipes = recipes.filter(recipe => {
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesTitle = recipe.title.toLowerCase().includes(query)
      const matchesDesc = recipe.description?.toLowerCase().includes(query)
      if (!matchesTitle && !matchesDesc) return false
    }

    // Favorites filter
    if (showFavoritesOnly && recipe.favorites.length === 0) {
      return false
    }

    // Category filter
    if (selectedCategory) {
      const matchingCategory = findCategoryMatch(selectedCategory)
      if (matchingCategory && recipe.categoryId !== matchingCategory.id) {
        return false
      }
    }

    // Subcategory filter
    if (selectedSubcategory) {
      if (recipe.subcategoryId !== selectedSubcategory) {
        return false
      }
    }

    return true
  })

  // Get subcategories for selected category
  const getSubcategoriesForCategory = () => {
    if (!selectedCategory) return []
    const matchingCategory = findCategoryMatch(selectedCategory)
    if (!matchingCategory) return []
    return subcategories.filter(s => s.categoryId === matchingCategory.id)
  }

  // Get counts for categories
  const getCategoryCount = (categorySlug: string) => {
    const matchingCategory = findCategoryMatch(categorySlug)
    if (!matchingCategory) return 0
    return recipes.filter(r => r.categoryId === matchingCategory.id).length
  }

  const totalRecipes = recipes.length
  const favoriteCount = recipes.filter(r => r.favorites.length > 0).length
  const currentSubcategories = getSubcategoriesForCategory()

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4">
        <div className="px-4 py-3 sm:py-4">
          {/* Title row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900">Receptbank</h1>
              <p className="text-xs sm:text-sm text-gray-500">{totalRecipes} recept</p>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Coach only buttons */}
              {isCoach && (
                <>
                  {/* Inbox for recipe requests */}
                  <Button
                    onClick={() => setIsRequestsInboxOpen(true)}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <Inbox className="w-4 h-4 mr-2" />
                    Förfrågningar
                  </Button>
                  {/* Manage Categories button */}
                  <Button
                    onClick={() => setIsManageCategoriesOpen(true)}
                    variant="outline"
                    size="sm"
                    className="hidden sm:flex"
                  >
                    <FolderCog className="w-4 h-4 mr-2" />
                    Kategorier
                  </Button>
                  {/* Manual Add button */}
                  <Button
                    onClick={() => setIsManualAddOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    size="sm"
                  >
                    <Plus className="w-4 h-4 sm:mr-2" />
                    <span className="hidden sm:inline">Lägg till</span>
                  </Button>
                </>
              )}
              {/* Client only: Request recipe button */}
              {!isCoach && (
                <Button
                  onClick={() => setIsClientRequestOpen(true)}
                  className="bg-amber-500 hover:bg-amber-600 text-black"
                  size="sm"
                >
                  <Send className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Föreslå recept</span>
                </Button>
              )}
              <div className="hidden sm:block h-6 w-px bg-gray-200" />
              {/* Favorites toggle */}
              <Button
                variant={showFavoritesOnly ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={showFavoritesOnly ? 'bg-red-500 hover:bg-red-600 text-white' : ''}
              >
                <Heart className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
                <span className="hidden sm:inline ml-1.5">{favoriteCount}</span>
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

          {/* Main categories - 4 columns on desktop, 2x2 on mobile */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 sm:gap-2 mb-2">
            {MAIN_CATEGORIES.map(cat => {
              const count = getCategoryCount(cat.id)
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isActive) {
                      setSelectedCategory(null)
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
                  <span className="text-[10px] sm:text-xs font-semibold text-center leading-tight sm:hidden">
                    {cat.labelShort || cat.label}
                  </span>
                  <span className="text-xs font-semibold text-center leading-tight hidden sm:block">{cat.label}</span>
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
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {SECONDARY_CATEGORIES.map(cat => {
              const count = getCategoryCount(cat.id)
              const Icon = cat.icon
              const isActive = selectedCategory === cat.id

              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (isActive) {
                      setSelectedCategory(null)
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
                  <span className="text-[10px] sm:text-xs font-semibold sm:hidden">{cat.labelShort || cat.label}</span>
                  <span className="text-xs font-semibold hidden sm:block">{cat.label}</span>
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

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Sök recept..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
            />
          </div>

          {/* Client recipe request button */}
          {!isCoach && (
            <button
              onClick={() => setIsClientRequestOpen(true)}
              className="w-full mt-3 flex items-center justify-center gap-2 p-2.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg text-amber-700 transition-colors"
            >
              <Send className="w-4 h-4" />
              <span className="text-sm font-medium">Saknar du ett recept? Skicka ett förslag</span>
            </button>
          )}
        </div>

        {/* Subcategory chips - show when category is selected and has subcategories */}
        {selectedCategory && currentSubcategories.length > 0 && (
          <div className="px-4 pb-3">
            <div className="flex flex-wrap gap-1.5 pt-2 border-t border-gray-200">
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
              {currentSubcategories.map(subcat => {
                const isActive = selectedSubcategory === subcat.id
                const count = recipes.filter(r => r.subcategoryId === subcat.id).length

                return (
                  <button
                    key={subcat.id}
                    onClick={() => setSelectedSubcategory(isActive ? null : subcat.id)}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm transition-colors ${
                      isActive
                        ? 'bg-gray-800 text-white font-medium'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    <span>{subcat.name}</span>
                    {count > 0 && (
                      <span className={`text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                        {count}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-gold-primary" />
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12 px-4">
            <ChefHat className="w-10 h-10 sm:w-12 sm:h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm sm:text-base">
              {searchQuery ? 'Inga recept matchade din sökning' : 'Inga recept hittades'}
            </p>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              {selectedCategory ? 'Prova att välja en annan kategori' : 'Börja lägga till recept för att bygga din receptbank'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1.5 sm:gap-2">
            {filteredRecipes.map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredRecipes.map(recipe => (
              <RecipeRow
                key={recipe.id}
                recipe={recipe}
                onClick={() => router.push(`/dashboard/recipes/${recipe.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Manage Categories Modal */}
      <ManageRecipeCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        onCategoriesChanged={fetchData}
      />

      {/* Manual Recipe Add Modal */}
      <ManualRecipeModal
        isOpen={isManualAddOpen}
        onClose={() => {
          setIsManualAddOpen(false)
          setPendingRequestData(null)
        }}
        onRecipeAdded={() => {
          fetchData()
          setPendingRequestData(null)
        }}
        initialData={pendingRequestData || undefined}
      />

      {/* Recipe Requests Inbox - Coach only */}
      {isCoach && (
        <RecipeRequestsInbox
          isOpen={isRequestsInboxOpen}
          onClose={() => setIsRequestsInboxOpen(false)}
          categories={categories}
          onApproveRequest={(request) => {
            setPendingRequestData({
              title: request.title,
              description: request.description || undefined,
              categoryId: request.categoryId || undefined,
              image: request.image,
              requestId: request.id
            })
            setIsRequestsInboxOpen(false)
            setIsManualAddOpen(true)
          }}
        />
      )}

      {/* Client Request Modal */}
      {!isCoach && (
        <ClientRecipeRequestModal
          isOpen={isClientRequestOpen}
          onClose={() => setIsClientRequestOpen(false)}
          categories={categories}
        />
      )}
    </div>
  )
}

function RecipeCard({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  const isFavorite = recipe.favorites.length > 0
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)

  return (
    <div
      className="bg-white rounded border border-gray-100 overflow-hidden hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onClick}
    >
      {/* Image */}
      <div className="aspect-square bg-gray-50 relative">
        {recipe.coverImage ? (
          <img
            src={recipe.coverImage}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-8 h-8 text-gray-200" />
          </div>
        )}
        {isFavorite && (
          <div className="absolute top-1 right-1 p-1 bg-white/90 rounded-full">
            <Heart className="w-3 h-3 text-red-500 fill-current" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-2 py-2">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug mb-1">{recipe.title}</h3>
        <div className="flex items-center gap-2 text-[10px] text-gray-500 mb-1">
          <span className="flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {recipe.servings} port
          </span>
          {totalTime > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {totalTime} min
            </span>
          )}
        </div>
        {(recipe.caloriesPerServing || recipe.proteinPerServing) && (
          <>
            <p className="text-[10px] text-gray-500 font-medium">Per portion:</p>
            <div className="text-[11px] text-gray-700 mt-0.5 space-y-px">
              {recipe.caloriesPerServing && (
                <p>• Energi: <span className="font-semibold text-amber-600">{Math.round(recipe.caloriesPerServing)} kcal</span></p>
              )}
              {recipe.proteinPerServing && (
                <p>• Protein: <span className="font-semibold">{Math.round(recipe.proteinPerServing)} g</span></p>
              )}
              {recipe.carbsPerServing && (
                <p>• Kolhydrater: <span className="font-semibold">{Math.round(recipe.carbsPerServing)} g</span></p>
              )}
              {recipe.fatPerServing && (
                <p>• Fett: <span className="font-semibold">{Math.round(recipe.fatPerServing)} g</span></p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function RecipeRow({ recipe, onClick }: { recipe: Recipe; onClick: () => void }) {
  const isFavorite = recipe.favorites.length > 0
  const totalTime = (recipe.prepTimeMinutes || 0) + (recipe.cookTimeMinutes || 0)

  return (
    <div
      className="bg-white rounded-lg border border-gray-200 p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
        {recipe.coverImage ? (
          <img
            src={recipe.coverImage}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ChefHat className="w-6 h-6 text-gray-300" />
          </div>
        )}
        {isFavorite && (
          <div className="absolute top-0.5 right-0.5 p-0.5 bg-white/90 rounded-full">
            <Heart className="w-2.5 h-2.5 text-red-500 fill-current" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 text-xs sm:text-sm truncate">{recipe.title}</h3>
        <div className="flex items-center gap-2 mt-0.5 text-[10px] sm:text-xs text-gray-500">
          <span className="flex items-center gap-0.5">
            <Users className="w-3 h-3" />
            {recipe.servings} port
          </span>
          {totalTime > 0 && (
            <span className="flex items-center gap-0.5">
              <Clock className="w-3 h-3" />
              {totalTime} min
            </span>
          )}
          {recipe.category && (
            <span className="px-1.5 py-0.5 rounded bg-gray-100 text-gray-600">
              {recipe.category.name}
            </span>
          )}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        {recipe.caloriesPerServing && (
          <>
            <p className="text-[9px] sm:text-[10px] text-gray-500 font-medium">Per portion:</p>
            <div className="font-semibold text-amber-600 text-xs sm:text-base">{Math.round(recipe.caloriesPerServing)} kcal</div>
            {(recipe.proteinPerServing || recipe.carbsPerServing || recipe.fatPerServing) && (
              <div className="text-[9px] sm:text-[10px] text-gray-600 mt-0.5">
                {recipe.proteinPerServing && `P: ${Math.round(recipe.proteinPerServing)}g`}
                {recipe.carbsPerServing && ` • K: ${Math.round(recipe.carbsPerServing)}g`}
                {recipe.fatPerServing && ` • F: ${Math.round(recipe.fatPerServing)}g`}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

// Client Recipe Request Modal
function ClientRecipeRequestModal({
  isOpen,
  onClose,
  categories
}: {
  isOpen: boolean
  onClose: () => void
  categories: RecipeCategory[]
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [image, setImage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleImageUpload = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async () => {
    if (!title.trim()) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/recipe-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          categoryId: categoryId || null,
          image
        })
      })

      if (res.ok) {
        setSubmitted(true)
        setTitle('')
        setDescription('')
        setCategoryId('')
        setImage(null)
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
            <span className="font-medium">Föreslå recept</span>
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
            Har du ett receptförslag? Beskriv det nedan så tar vi en titt!
          </p>

          {/* Image upload */}
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Bild (valfritt)</p>
            <label className="block aspect-video bg-gray-100 rounded-lg cursor-pointer overflow-hidden relative border-2 border-dashed border-gray-300 hover:border-amber-400 transition-colors">
              {image ? (
                <img src={image} alt="Förhandsvisning" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                  <ImagePlus className="w-8 h-8 mb-2" />
                  <span className="text-xs">Lägg till bild</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              />
              {image && (
                <button
                  onClick={(e) => { e.preventDefault(); setImage(null) }}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </label>
          </div>

          {/* Title input */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Receptnamn *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="t.ex. Proteinrik chokladmousse"
              className="w-full"
            />
          </div>

          {/* Description */}
          <div className="mb-3">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Beskrivning (valfritt)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Beskriv receptet eller vilka ingredienser du tänker dig..."
              className="w-full p-2.5 border border-gray-200 rounded-lg text-sm resize-none"
              rows={3}
            />
          </div>

          {/* Category dropdown */}
          <div className="mb-4">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Kategori (valfritt)</label>
            <div className="relative">
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full p-2.5 border border-gray-200 rounded-lg appearance-none bg-white pr-10 text-sm"
              >
                <option value="">Välj kategori</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
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
            disabled={isSubmitting || !title.trim()}
            className="w-full bg-amber-500 hover:bg-amber-600 text-black font-medium"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : submitted ? (
              <Check className="w-4 h-4 mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            {submitted ? 'Förslag skickat!' : 'Skicka förslag'}
          </Button>
        </div>
      </div>
    </div>
  )
}

// Recipe Requests Inbox for Coaches
function RecipeRequestsInbox({
  isOpen,
  onClose,
  categories,
  onApproveRequest
}: {
  isOpen: boolean
  onClose: () => void
  categories: RecipeCategory[]
  onApproveRequest: (request: any) => void
}) {
  const [requests, setRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRequests()
    }
  }, [isOpen])

  const fetchRequests = async () => {
    setIsLoading(true)
    try {
      const res = await fetch('/api/recipe-requests')
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

  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch(`/api/recipe-requests/${requestId}`, {
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
            <h2 className="text-lg font-semibold">Receptförfrågningar</h2>
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
                        <h3 className="font-medium text-gray-900">{request.title}</h3>
                      </div>
                      {request.description && (
                        <p className="text-sm text-gray-600 mb-2">{request.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mb-2">
                        Från: {request.user?.name || request.user?.email} · {new Date(request.createdAt).toLocaleDateString('sv-SE')}
                      </p>
                      {request.category && (
                        <span className="text-xs bg-gray-200 px-2 py-0.5 rounded">
                          {request.category.name}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {request.image && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedRequest(selectedRequest?.id === request.id ? null : request)}
                        >
                          Visa bild
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
                        onClick={() => onApproveRequest(request)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Skapa
                      </Button>
                    </div>
                  </div>

                  {/* Image preview */}
                  {request.image && selectedRequest?.id === request.id && (
                    <div className="mt-3 pt-3 border-t">
                      <img src={request.image} alt="Förhandsvisning" className="w-full max-h-64 object-contain rounded-lg" />
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
