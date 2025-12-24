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
  Search,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

type ShoppingListItem = {
  id: string
  foodItemId: string | null
  foodItem: {
    id: string
    name: string
  } | null
  customName: string | null
  quantity: number
  unit: string
  category: string
  checked: boolean
  notes: string | null
  orderIndex: number
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

type FoodItem = {
  id: string
  name: string
  imageUrl?: string | null
  calories?: number | null
  proteinG?: number | null
  carbsG?: number | null
  fatG?: number | null
  foodCategory?: {
    name: string
  } | null
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
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [customItemName, setCustomItemName] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [unit, setUnit] = useState('st')
  const [activeTab, setActiveTab] = useState<'search' | 'custom'>('search')
  const [addedFoodIds, setAddedFoodIds] = useState<Set<string>>(new Set())

  // Share state
  const [shareUserId, setShareUserId] = useState('')
  const [shareRole, setShareRole] = useState<'viewer' | 'editor'>('editor')

  useEffect(() => {
    params.then((p) => setListId(p.id))
  }, [params])

  useEffect(() => {
    if (listId && session?.user) {
      fetchShoppingList()
    }
  }, [listId, session])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (searchTerm.length >= 2 && activeTab === 'search') {
        searchFoodItems()
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(debounce)
  }, [searchTerm, activeTab])

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

  const searchFoodItems = async () => {
    try {
      const response = await fetch(
        `/api/food-items?search=${encodeURIComponent(searchTerm)}&limit=20`
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.items || [])
      }
    } catch (error) {
      console.error('Error searching food items:', error)
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

  const handleAddFromFoodBank = async (foodItem: FoodItem) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodItemId: foodItem.id,
          quantity: 1,
          unit: 'st',
          category: foodItem.foodCategory?.name || 'Övrigt',
        }),
      })

      if (response.ok) {
        toast.success(`${foodItem.name} tillagd`)
        setAddedFoodIds((prev) => new Set([...prev, foodItem.id]))
        fetchShoppingList()
      } else {
        toast.error('Kunde inte lägga till vara')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Ett fel uppstod')
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

    shoppingList.items.forEach((item) => {
      const category = item.category || 'Övrigt'
      if (!grouped[category]) {
        grouped[category] = []
      }
      grouped[category].push(item)
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
  const isOwner = shoppingList.userId === session.user.id
  const canEdit =
    isOwner ||
    shoppingList.shares.some(
      (s) => s.sharedWith === session.user.id && s.role === 'editor'
    )

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Sticky Header */}
      <div
        className="sticky top-0 z-20 border-b border-gold-primary/20 backdrop-blur-lg"
        style={{ backgroundColor: `${shoppingList.color}15` }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => router.push('/dashboard/shopping-lists')}
              className="text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsAddDialogOpen(true)}
                  className="text-white"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(true)}
                className="text-white"
              >
                <MoreVertical className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">{shoppingList.name}</h1>
          {shoppingList.description && (
            <p className="text-sm text-gray-300 mb-3">
              {shoppingList.description}
            </p>
          )}
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-200">
              {checkedItems} av {totalItems} klara
            </p>
            <Badge className="bg-[rgba(255,255,255,0.2)] text-white border-0">
              {progress}%
            </Badge>
          </div>
          <div className="w-full bg-[rgba(255,255,255,0.1)] h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-gold-light to-orange-500 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {totalItems === 0 ? (
          <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px] mt-8">
            <CardContent className="text-center py-16">
              <p className="text-gray-400 mb-4">Listan är tom</p>
              {canEdit && (
                <Button
                  onClick={() => setIsAddDialogOpen(true)}
                  className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till vara
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mb-2">
                  {category}
                </h2>
                <div className="space-y-2">
                  {items.map((item) => {
                    const name = item.foodItem?.name || item.customName || 'Okänd vara'
                    return (
                      <Card
                        key={item.id}
                        className={`transition-all ${
                          item.checked
                            ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)] opacity-70'
                            : 'bg-white/5 border-gold-primary/20'
                        }`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleToggleChecked(item.id, item.checked)}
                              className={`flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                item.checked
                                  ? 'bg-green-500'
                                  : 'border-2 border-[rgba(255,255,255,0.3)]'
                              }`}
                              disabled={!canEdit}
                            >
                              {item.checked && <Check className="h-4 w-4 text-white" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <p
                                className={`font-medium text-white ${
                                  item.checked ? 'line-through' : ''
                                }`}
                              >
                                {item.quantity} {item.unit} {name}
                              </p>
                              {item.notes && (
                                <p className="text-sm text-gray-500 mt-0.5">
                                  {item.notes}
                                </p>
                              )}
                            </div>
                            {canEdit && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteItem(item.id)}
                                className="text-gray-500 hover:text-red-400 flex-shrink-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.98)] border-2 border-gold-primary/30 backdrop-blur-[10px] max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Lägg till vara
            </DialogTitle>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button
              onClick={() => setActiveTab('search')}
              className={`flex-1 ${
                activeTab === 'search'
                  ? 'bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a]'
                  : 'bg-transparent border border-gold-primary/30 text-gray-200'
              }`}
            >
              <Search className="h-4 w-4 mr-1" />
              Sök livsmedel
            </Button>
            <Button
              onClick={() => setActiveTab('custom')}
              className={`flex-1 ${
                activeTab === 'custom'
                  ? 'bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a]'
                  : 'bg-transparent border border-gold-primary/30 text-gray-200'
              }`}
            >
              Egen vara
            </Button>
          </div>

          {activeTab === 'search' ? (
            <div className="flex-1 overflow-auto">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Sök livsmedel..."
                  className="pl-10 bg-black/30 border-gold-primary/30 text-white"
                  autoFocus
                />
              </div>

              <div className="space-y-2 max-h-[400px] overflow-auto">
                {searchResults.map((foodItem) => {
                  const isAdded = addedFoodIds.has(foodItem.id)
                  return (
                    <Card
                      key={foodItem.id}
                      className={`border transition-all cursor-pointer ${
                        isAdded
                          ? 'bg-green-500/20 border-green-500/50'
                          : 'bg-white/5 border-gold-primary/20 hover:border-[rgba(255,215,0,0.4)]'
                      }`}
                      onClick={() => !isAdded && handleAddFromFoodBank(foodItem)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center gap-3">
                          {/* Product image */}
                          <div className="w-12 h-12 rounded-lg bg-zinc-800 overflow-hidden shrink-0">
                            {foodItem.imageUrl ? (
                              <img
                                src={foodItem.imageUrl}
                                alt={foodItem.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                                Bild
                              </div>
                            )}
                          </div>

                          {/* Product info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white truncate">{foodItem.name}</p>
                            {foodItem.foodCategory && (
                              <p className="text-xs text-gray-500">
                                {foodItem.foodCategory.name}
                              </p>
                            )}
                            {/* Macros */}
                            <div className="flex items-center gap-2 mt-1 text-xs">
                              {foodItem.calories && (
                                <span className="text-orange-400">{Math.round(Number(foodItem.calories))} kcal</span>
                              )}
                              {foodItem.proteinG && (
                                <span className="text-blue-400">{Math.round(Number(foodItem.proteinG))}g P</span>
                              )}
                              {foodItem.carbsG && (
                                <span className="text-yellow-400">{Math.round(Number(foodItem.carbsG))}g K</span>
                              )}
                              {foodItem.fatG && (
                                <span className="text-red-400">{Math.round(Number(foodItem.fatG))}g F</span>
                              )}
                            </div>
                          </div>

                          {/* Add button */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                            isAdded ? 'bg-green-500' : 'bg-gold-primary/20'
                          }`}>
                            {isAdded ? (
                              <Check className="h-4 w-4 text-white" />
                            ) : (
                              <Plus className="h-4 w-4 text-[rgba(255,215,0,0.8)]" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
                {searchTerm.length >= 2 && searchResults.length === 0 && (
                  <p className="text-center text-gray-500 py-8">
                    Inga resultat hittades
                  </p>
                )}
                {searchTerm.length < 2 && (
                  <p className="text-center text-gray-500 py-8">
                    Skriv minst 2 tecken för att söka
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-200 mb-1.5 block">
                  Varunamn *
                </label>
                <Input
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  placeholder="t.ex. Äpplen"
                  className="bg-black/30 border-gold-primary/30 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm text-gray-200 mb-1.5 block">
                    Antal
                  </label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-black/30 border-gold-primary/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-200 mb-1.5 block">
                    Enhet
                  </label>
                  <Input
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="st, kg, l"
                    className="bg-black/30 border-gold-primary/30 text-white"
                  />
                </div>
              </div>
              <Button
                onClick={handleAddCustomItem}
                className="w-full bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold"
              >
                Lägg till
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Menu Dialog */}
      <Dialog open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.98)] border-2 border-gold-primary/30 backdrop-blur-[10px] max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-white">Meny</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {isOwner && (
              <Button
                onClick={() => {
                  setIsMenuOpen(false)
                  setIsShareDialogOpen(true)
                }}
                className="w-full justify-start bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white border border-gold-primary/20"
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
              className="w-full justify-start bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-white border border-gold-primary/20"
            >
              Exportera
            </Button>
            {canEdit && checkedItems > 0 && (
              <Button
                onClick={() => {
                  setIsMenuOpen(false)
                  handleClearChecked()
                }}
                className="w-full justify-start bg-[rgba(255,0,0,0.1)] hover:bg-[rgba(255,0,0,0.2)] text-red-400 border border-red-500/30"
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
        <DialogContent className="bg-[rgba(10,10,10,0.98)] border-2 border-gold-primary/30 backdrop-blur-[10px] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Dela lista
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-200 mb-1.5 block">
                Användar-ID
              </label>
              <Input
                value={shareUserId}
                onChange={(e) => setShareUserId(e.target.value)}
                placeholder="Mottagarens användar-ID"
                className="bg-black/30 border-gold-primary/30 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-gray-200 mb-1.5 block">
                Behörighet
              </label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setShareRole('viewer')}
                  className={`${
                    shareRole === 'viewer'
                      ? 'bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a]'
                      : 'bg-transparent border border-gold-primary/30 text-gray-200'
                  }`}
                >
                  Läsa
                </Button>
                <Button
                  onClick={() => setShareRole('editor')}
                  className={`${
                    shareRole === 'editor'
                      ? 'bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a]'
                      : 'bg-transparent border border-gold-primary/30 text-gray-200'
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
              className="bg-transparent border border-gold-primary/30 text-gray-200"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleShare}
              className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold"
            >
              Dela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
