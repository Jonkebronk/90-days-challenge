'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  ArrowLeft,
  Check,
  Plus,
  Share2,
  MoreVertical,
  Trash2,
  Minus,
  Package,
  ChefHat,
  ExternalLink,
  CalendarDays,
  Heart,
  ShoppingCart,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { ProductDetailModal } from '@/components/products/ProductDetailModal'
import { FavoriteProductList, MealPlanToListWizard } from '@/components/shopping-list'

type ProductData = {
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
  source: string
  servingUnit?: string
}

type ShoppingListItem = {
  id: string
  foodItemId: string | null
  foodItem: {
    id: string
    name: string
    imageUrl?: string | null
  } | null
  productId: string | null
  product: ProductData | null
  recipeId: string | null
  recipe: {
    id: string
    title: string
    coverImage: string | null
  } | null
  customName: string | null
  customImageUrl: string | null
  quantity: number
  unit: string
  category: string
  checked: boolean
  notes: string | null
  orderIndex: number
  source: string
}

type ShoppingList = {
  id: string
  name: string
  description: string | null
  color: string
  userId: string
  items: ShoppingListItem[]
  shares: Array<{
    id: string
    sharedWith: string
    role: string
  }>
}

export default function ClientShoppingListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { data: session } = useSession()
  const router = useRouter()

  const [listId, setListId] = useState<string>('')
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  // Add item state
  const [customItemName, setCustomItemName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('st')

  // Share state
  const [shareUserId, setShareUserId] = useState('')
  const [shareRole, setShareRole] = useState<'viewer' | 'editor'>('editor')

  // Product detail modal state
  const [selectedProduct, setSelectedProduct] = useState<ProductData | null>(null)
  const [isProductDetailOpen, setIsProductDetailOpen] = useState(false)

  // Tab and wizard state
  const [activeTab, setActiveTab] = useState<'list' | 'favorites'>('list')
  const [showMealPlanWizard, setShowMealPlanWizard] = useState(false)

  useEffect(() => {
    params.then((p) => setListId(p.id))
  }, [params])

  useEffect(() => {
    if (listId && session?.user) {
      fetchShoppingList()
    }
  }, [listId, session])

  const fetchShoppingList = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/shopping-lists/${listId}`)
      if (response.ok) {
        const data = await response.json()
        setShoppingList(data.list)
      } else {
        toast.error('Kunde inte hämta inköpslistan')
        router.push('/dashboard/shopping-lists')
      }
    } catch (error) {
      console.error('Error fetching shopping list:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleChecked = async (itemId: string, currentChecked: boolean) => {
    if (!shoppingList) return

    // Optimistic update
    setShoppingList({
      ...shoppingList,
      items: shoppingList.items.map((item) =>
        item.id === itemId ? { ...item, checked: !currentChecked } : item
      ),
    })

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: !currentChecked }),
      })

      if (!response.ok) {
        toast.error('Kunde inte uppdatera vara')
        fetchShoppingList() // Revert on error
      }
    } catch (error) {
      console.error('Error toggling item:', error)
      toast.error('Ett fel uppstod')
      fetchShoppingList()
    }
  }

  const handleAddCustomItem = async () => {
    if (!customItemName.trim()) {
      toast.error('Ange varunamn')
      return
    }

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customName: customItemName,
          quantity: parseFloat(quantity) || 1,
          unit: unit || 'st',
        }),
      })

      if (response.ok) {
        toast.success('Vara tillagd')
        setIsAddDialogOpen(false)
        setCustomItemName('')
        setQuantity('1')
        setUnit('st')
        fetchShoppingList()
      } else {
        toast.error('Kunde inte lägga till vara')
      }
    } catch (error) {
      console.error('Error adding custom item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Vara borttagen')
        fetchShoppingList()
      } else {
        toast.error('Kunde inte ta bort vara')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return

    // Optimistic update
    setShoppingList(prev => {
      if (!prev) return prev
      return {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, quantity: newQuantity } : item
        ),
      }
    })

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: newQuantity }),
      })

      if (!response.ok) {
        fetchShoppingList() // Revert on error
      }
    } catch (error) {
      console.error('Error updating quantity:', error)
      fetchShoppingList()
    }
  }

  const handleClearChecked = async () => {
    if (!confirm('Vill du ta bort alla checkade varor?')) return

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/clear-checked`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Checkade varor borttagna')
        fetchShoppingList()
      } else {
        toast.error('Kunde inte ta bort varor')
      }
    } catch (error) {
      console.error('Error clearing checked:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleShare = async () => {
    if (!shareUserId.trim()) {
      toast.error('Ange användar-ID')
      return
    }

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sharedWith: shareUserId,
          role: shareRole,
        }),
      })

      if (response.ok) {
        toast.success('Listan delad')
        setIsShareDialogOpen(false)
        setShareUserId('')
        fetchShoppingList()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte dela lista')
      }
    } catch (error) {
      console.error('Error sharing list:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleExport = () => {
    if (!shoppingList) return

    const grouped = groupItemsByCategory()
    let exportText = `${shoppingList.name}\n\n`

    Object.entries(grouped).forEach(([category, items]) => {
      exportText += `${category}\n`
      items.forEach((item) => {
        const name = item.foodItem?.name || item.customName || 'Okänd vara'
        const checkMark = item.checked ? '✓' : '○'
        exportText += `${checkMark} ${item.quantity} ${item.unit} ${name}\n`
      })
      exportText += '\n'
    })

    navigator.clipboard.writeText(exportText)
    toast.success('Kopierat till urklipp')
  }

  const groupItemsByCategory = () => {
    if (!shoppingList) return {}

    const grouped: Record<string, ShoppingListItem[]> = {}

    // Only include items without a recipe in category grouping
    shoppingList.items
      .filter((item) => !item.recipeId)
      .forEach((item) => {
        const category = item.category || 'Övrigt'
        if (!grouped[category]) {
          grouped[category] = []
        }
        grouped[category].push(item)
      })

    return grouped
  }

  // Group items by recipe
  const groupItemsByRecipe = () => {
    if (!shoppingList) return {}

    const grouped: Record<string, { recipe: ShoppingListItem['recipe']; items: ShoppingListItem[] }> = {}

    shoppingList.items
      .filter((item) => item.recipeId && item.recipe)
      .forEach((item) => {
        const recipeId = item.recipeId!
        if (!grouped[recipeId]) {
          grouped[recipeId] = {
            recipe: item.recipe,
            items: [],
          }
        }
        grouped[recipeId].items.push(item)
      })

    return grouped
  }

  if (!session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-300">Du måste logga in</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-400">Laddar...</p>
      </div>
    )
  }

  if (!shoppingList) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-gray-300">Listan hittades inte</p>
      </div>
    )
  }

  const totalItems = shoppingList.items.length
  const checkedItems = shoppingList.items.filter((item) => item.checked).length
  const progress = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0
  const grouped = groupItemsByCategory()
  const groupedByRecipe = groupItemsByRecipe()
  const isOwner = shoppingList.userId === session.user.id
  // Alla som har tillgång till listan kan redigera
  const canEdit = true

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header with Tabs */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200">
        {/* Title row */}
        <div className="relative text-center py-6 bg-gradient-to-br from-gold-primary/5 to-transparent">
          <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
            INKÖPSLISTA
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex">
          <button
            onClick={() => setActiveTab('list')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'list'
                ? 'text-gold-primary border-b-2 border-gold-primary bg-gold-primary/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart className="h-5 w-5" />
            Inköpslista
            {totalItems > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === 'list' ? 'bg-gold-primary text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {totalItems}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex-1 py-3 px-4 text-center font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'favorites'
                ? 'text-gold-primary border-b-2 border-gold-primary bg-gold-primary/5'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Heart className="h-5 w-5" />
            Favoriter
          </button>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'list' ? (
        <>
          {/* Action bar */}
          <div className="bg-white border-b border-gray-200 p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {canEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddDialogOpen(true)}
                    className="border-gray-300"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Lägg till
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMenuOpen(true)}
                  className="text-gray-500"
                >
                  <MoreVertical className="h-5 w-5" />
                </Button>
              </div>
              <Button
                onClick={() => setShowMealPlanWizard(true)}
                size="sm"
                className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-bold"
              >
                <CalendarDays className="h-4 w-4 mr-2" />
                Från måltidsplan
              </Button>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-gray-600 font-medium">
                {checkedItems} av {totalItems} klara
              </p>
              <Badge className="bg-gold-primary/10 text-gold-primary border-0 font-bold">
                {progress}%
              </Badge>
            </div>
            <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-gold-primary to-gold-secondary transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Shopping list content */}
          <div className="p-4 pb-24">
        {totalItems === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Listan är tom</p>
              {canEdit && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till vara
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {/* Regular items section - always first */}
            {Object.keys(grouped).length > 0 && (
              <div>
                <h2 className="text-sm font-semibold text-gray-600 uppercase tracking-wide px-1 mb-2">
                  Inköpslista
                </h2>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                  {Object.values(grouped).flat().map((item, idx, allItems) => {
                    const name = item.foodItem?.name || item.customName || 'Okänd vara'
                    const imageUrl = item.foodItem?.imageUrl || item.customImageUrl
                    return (
                      <div
                        key={item.id}
                        className={`transition-all ${
                          item.checked ? 'bg-gray-50' : ''
                        } ${idx !== allItems.length - 1 ? 'border-b border-gray-100' : ''}`}
                      >
                        <div className="flex items-stretch">
                          {/* Checkbox */}
                          <button
                            onClick={() => handleToggleChecked(item.id, item.checked)}
                            className={`w-12 flex items-center justify-center transition-all ${
                              item.checked
                                ? 'bg-green-500'
                                : 'bg-gray-100 hover:bg-gray-200'
                            }`}
                            disabled={!canEdit}
                          >
                            {item.checked ? (
                              <Check className="h-5 w-5 text-white" />
                            ) : (
                              <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                            )}
                          </button>

                          {/* Product image + info (clickable for nutrition details) */}
                          <button
                            onClick={() => {
                              if (item.product) {
                                setSelectedProduct(item.product)
                                setIsProductDetailOpen(true)
                              }
                            }}
                            className={`flex flex-1 items-stretch text-left ${item.product ? 'cursor-pointer hover:bg-gray-50' : 'cursor-default'}`}
                            disabled={!item.product}
                          >
                            {/* Product image */}
                            <div className="w-20 h-20 bg-gray-50 flex-shrink-0">
                              {imageUrl ? (
                                <img
                                  src={imageUrl}
                                  alt={name}
                                  className="w-full h-full object-contain p-1"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Package className="w-8 h-8 text-gray-300" />
                                </div>
                              )}
                            </div>

                            {/* Product info */}
                            <div className="flex-1 p-3 flex flex-col justify-center min-w-0">
                              <p className={`font-semibold text-gray-900 truncate ${
                                item.checked ? 'line-through text-gray-500' : ''
                              }`}>
                                {name}
                              </p>
                              {item.notes && (
                                <p className="text-xs text-gray-500 truncate mt-0.5">
                                  {item.notes}
                                </p>
                              )}
                              {item.product && (
                                <p className="text-xs text-amber-600 mt-0.5">
                                  Tryck för näringsinformation
                                </p>
                              )}
                            </div>
                          </button>

                          {/* Quantity controls */}
                          <div className="flex items-center gap-1 px-2 bg-gray-50">
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                              disabled={!canEdit || item.quantity <= 1}
                              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <div className="w-12 text-center">
                              <span className="font-bold text-gray-900">{item.quantity}</span>
                              <span className="text-xs text-gray-500 ml-0.5">{item.unit}</span>
                            </div>
                            <button
                              onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              disabled={!canEdit}
                              className="w-8 h-8 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>

                          {/* Delete button */}
                          {canEdit && (
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="w-12 flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Recipe sections - below regular items */}
            {Object.entries(groupedByRecipe).map(([recipeId, { recipe, items }]) => (
              <div key={recipeId} className="bg-white rounded-xl border border-emerald-200 shadow-sm overflow-hidden">
                {/* Recipe header card */}
                <Link
                  href={`/dashboard/recipes/${recipeId}`}
                  className="flex items-center gap-3 p-3 bg-emerald-50 hover:bg-emerald-100 transition-colors border-b border-emerald-200"
                >
                  {recipe?.coverImage ? (
                    <img
                      src={recipe.coverImage}
                      alt={recipe.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <ChefHat className="w-7 h-7 text-emerald-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ChefHat className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <span className="text-xs uppercase tracking-wide text-emerald-600 font-medium">
                        Recept
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 truncate">{recipe?.title}</h3>
                    <p className="text-xs text-gray-500">
                      {items.length} ingredienser • {items.filter(i => i.checked).length} klara
                    </p>
                  </div>
                  <ExternalLink className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                </Link>

                {/* Recipe ingredients */}
                <div>
                  {items.map((item, idx) => {
                    const name = item.customName || item.foodItem?.name || 'Okänd vara'
                    return (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 px-4 py-2.5 ${
                          idx !== items.length - 1 ? 'border-b border-gray-100' : ''
                        } ${item.checked ? 'bg-gray-50' : ''}`}
                      >
                        {/* Checkbox */}
                        <button
                          onClick={() => handleToggleChecked(item.id, item.checked)}
                          className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                            item.checked
                              ? 'bg-emerald-500'
                              : 'border-2 border-gray-300 hover:border-emerald-400'
                          }`}
                          disabled={!canEdit}
                        >
                          {item.checked && <Check className="h-4 w-4 text-white" />}
                        </button>

                        {/* Item name */}
                        <span className={`flex-1 text-sm ${
                          item.checked ? 'line-through text-gray-400' : 'text-gray-900'
                        }`}>
                          {name}
                        </span>

                        {/* Quantity */}
                        <span className="text-xs text-gray-500">
                          {item.quantity} {item.unit}
                        </span>

                        {/* Delete button */}
                        {canEdit && (
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
          </div>
        </>
      ) : (
        /* Favorites Tab */
        <div className="p-4 pb-24 bg-white min-h-[60vh]">
          <FavoriteProductList />
        </div>
      )}

      {/* Meal Plan Wizard Dialog */}
      <MealPlanToListWizard
        isOpen={showMealPlanWizard}
        onClose={() => setShowMealPlanWizard(false)}
        onSuccess={(newListId) => {
          setShowMealPlanWizard(false)
          router.push(`/dashboard/shopping-lists/${newListId}`)
        }}
      />

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Lägg till vara
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm text-gray-500 mb-4">
            Tips: Du kan också lägga till varor direkt från Livsmedel-sidan eller dina Favoriter.
          </p>

          <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-700 font-medium mb-1.5 block">
                  Varunamn *
                </label>
                <Input
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="t.ex. Äpplen"
                  className="border-gray-300"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-700 font-medium mb-1.5 block">
                    Antal
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="border-gray-300"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-700 font-medium mb-1.5 block">
                    Enhet
                  </label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="st, kg, l"
                    className="border-gray-300"
                  />
                </div>
              </div>
            <Button
              onClick={handleAddCustomItem}
              className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-bold"
            >
              Lägg till
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Menu Dialog */}
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">Meny</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {isOwner && (
              <Button
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsShareDialogOpen(true)
                }}
                variant="outline"
                className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Dela lista
              </Button>
            )}
            <Button
              onClick={() => {
                setIsMenuOpen(false)
                handleExport()
              }}
              variant="outline"
              className="w-full justify-start border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Exportera
            </Button>
            {canEdit && checkedItems > 0 && (
              <Button
                onClick={() => {
                  setIsMenuOpen(false)
                  handleClearChecked()
                }}
                variant="outline"
                className="w-full justify-start border-red-200 text-red-600 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Radera checkade ({checkedItems})
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-white border border-gray-200 shadow-xl max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-900">
              Dela lista
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-700 font-medium mb-1.5 block">
                Användar-ID
              </label>
              <Input
                value={shareUserId}
                onChange={(e) => setShareUserId(e.target.value)}
                placeholder="Mottagarens användar-ID"
                className="border-gray-300"
              />
            </div>
            <div>
              <label className="text-sm text-gray-700 font-medium mb-1.5 block">
                Behörighet
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShareRole('viewer')}
                  variant="outline"
                  className={`${
                    shareRole === 'viewer'
                      ? 'bg-gold-primary/10 border-gold-primary text-gold-primary'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  Läsa
                </Button>
                <Button
                  onClick={() => setShareRole('editor')}
                  variant="outline"
                  className={`${
                    shareRole === 'editor'
                      ? 'bg-gold-primary/10 border-gold-primary text-gold-primary'
                      : 'border-gray-300 text-gray-600'
                  }`}
                >
                  Redigera
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsShareDialogOpen(false)}
              variant="outline"
              className="border-gray-300 text-gray-600"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleShare}
              className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-bold"
            >
              Dela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Detail Modal */}
      <ProductDetailModal
        isOpen={isProductDetailOpen}
        product={selectedProduct}
        onClose={() => {
          setIsProductDetailOpen(false)
          setSelectedProduct(null)
        }}
      />
    </div>
  )
}
