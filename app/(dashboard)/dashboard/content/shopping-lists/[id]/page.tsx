'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  Plus,
  Search,
  Trash2,
  Check,
  X,
  Users,
  Share2,
  FileDown,
  CheckCheck,
  Eraser,
} from 'lucide-react'
import { toast } from 'sonner'

type FoodItem = {
  id: string
  name: string
  categoryId?: string
  foodCategory?: {
    name: string
    color: string
    icon: string
  }
}

type ShoppingListItem = {
  id: string
  foodItemId: string | null
  foodItem?: FoodItem
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
  createdBy: string
  items: ShoppingListItem[]
  shares: Array<{
    id: string
    sharedWith: string
    role: string
  }>
}

export default function ShoppingListDetailPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const listId = params.id as string

  const [list, setList] = useState<ShoppingList | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [userRole, setUserRole] = useState<string>('viewer')
  const [isOwner, setIsOwner] = useState(false)

  // Search and add items
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<FoodItem[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [customItemName, setCustomItemName] = useState('')
  const [customItemQuantity, setCustomItemQuantity] = useState('1')
  const [customItemUnit, setCustomItemUnit] = useState('st')

  // Sharing
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [shareUserId, setShareUserId] = useState('')
  const [shareRole, setShareRole] = useState('editor')

  useEffect(() => {
    if (session?.user && listId) {
      fetchList()
    }
  }, [session, listId])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchFoodItems()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const fetchList = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/shopping-lists/${listId}`)
      if (response.ok) {
        const data = await response.json()
        setList(data.list)
        setUserRole(data.userRole)
        setIsOwner(data.isOwner)
      } else {
        toast.error('Kunde inte hämta inköpslista')
        router.push('/dashboard/content/shopping-lists')
      }
    } catch (error) {
      console.error('Error fetching list:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const searchFoodItems = async () => {
    try {
      setIsSearching(true)
      const response = await fetch(
        `/api/food-items?search=${encodeURIComponent(searchQuery)}&limit=10&approved=true`
      )
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.items || [])
      }
    } catch (error) {
      console.error('Error searching food items:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddFoodItem = async (foodItem: FoodItem) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          foodItemId: foodItem.id,
          quantity: 1,
          unit: 'st',
        }),
      })

      if (response.ok) {
        toast.success(`${foodItem.name} tillagd`)
        setSearchQuery('')
        fetchList()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte lägga till vara')
      }
    } catch (error) {
      console.error('Error adding item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleAddCustomItem = async () => {
    if (!customItemName) {
      toast.error('Namn krävs')
      return
    }

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customName: customItemName,
          quantity: parseFloat(customItemQuantity) || 1,
          unit: customItemUnit,
        }),
      })

      if (response.ok) {
        toast.success('Vara tillagd')
        setCustomItemName('')
        setCustomItemQuantity('1')
        setCustomItemUnit('st')
        fetchList()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte lägga till vara')
      }
    } catch (error) {
      console.error('Error adding custom item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleToggleChecked = async (itemId: string, currentChecked: boolean) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checked: !currentChecked }),
      })

      if (response.ok) {
        fetchList()
      }
    } catch (error) {
      console.error('Error toggling item:', error)
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Vara borttagen')
        fetchList()
      } else {
        toast.error('Kunde inte ta bort vara')
      }
    } catch (error) {
      console.error('Error deleting item:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleCheckAll = async () => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/check-all`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Alla varor avbockade')
        fetchList()
      }
    } catch (error) {
      console.error('Error checking all:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleUncheckAll = async () => {
    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/uncheck-all`, {
        method: 'POST',
      })

      if (response.ok) {
        toast.success('Alla varor avmarkerade')
        fetchList()
      }
    } catch (error) {
      console.error('Error unchecking all:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleClearChecked = async () => {
    if (!confirm('Är du säker på att du vill ta bort alla avbockade varor?')) {
      return
    }

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/items/clear-checked`, {
        method: 'DELETE',
      })

      if (response.ok) {
        const data = await response.json()
        toast.success(`${data.count} varor borttagna`)
        fetchList()
      }
    } catch (error) {
      console.error('Error clearing checked:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleShare = async () => {
    if (!shareUserId) {
      toast.error('Användar-ID krävs')
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
        toast.success('Lista delad')
        setIsShareDialogOpen(false)
        setShareUserId('')
        fetchList()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte dela lista')
      }
    } catch (error) {
      console.error('Error sharing list:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleRemoveShare = async (shareId: string) => {
    if (!confirm('Är du säker på att du vill ta bort delningen?')) {
      return
    }

    try {
      const response = await fetch(`/api/shopping-lists/${listId}/share/${shareId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Delning borttagen')
        fetchList()
      }
    } catch (error) {
      console.error('Error removing share:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleExport = () => {
    if (!list) return

    const grouped = groupItemsByCategory()
    let text = `${list.name}\n${'='.repeat(list.name.length)}\n\n`

    Object.entries(grouped).forEach(([category, items]) => {
      text += `${category}:\n`
      items.forEach((item) => {
        const name = item.foodItem?.name || item.customName
        const checked = item.checked ? '✓' : '○'
        text += `  ${checked} ${item.quantity} ${item.unit} ${name}\n`
      })
      text += '\n'
    })

    navigator.clipboard.writeText(text)
    toast.success('Kopierad till urklipp')
  }

  const groupItemsByCategory = (): Record<string, ShoppingListItem[]> => {
    if (!list) return {}

    const grouped: Record<string, ShoppingListItem[]> = {}

    list.items.forEach((item) => {
      if (!grouped[item.category]) {
        grouped[item.category] = []
      }
      grouped[item.category].push(item)
    })

    return grouped
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-white/5 border-2 border-gold-primary/20 rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-gray-300">
            Du har inte behörighet att se denna sida.
          </p>
        </div>
      </div>
    )
  }

  if (isLoading || !list) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-gray-400 text-center py-8">Laddar...</p>
      </div>
    )
  }

  const grouped = groupItemsByCategory()
  const totalItems = list.items.length
  const checkedItems = list.items.filter((i) => i.checked).length
  const canEdit = userRole === 'owner' || userRole === 'editor'

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/dashboard/content/shopping-lists')}
            className="text-gray-400 hover:text-gold-light hover:bg-gold-50"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 rounded-full" style={{ backgroundColor: list.color }} />
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
                {list.name}
              </h1>
              {list.description && (
                <p className="text-gray-400 mt-1">{list.description}</p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isOwner && (
            <Button
              onClick={() => setIsShareDialogOpen(true)}
              className="bg-transparent border border-gold-primary/30 text-gray-200 hover:bg-gold-50 hover:text-gold-light"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Dela
              {list.shares.length > 0 && (
                <Badge className="ml-2 bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]">
                  {list.shares.length}
                </Badge>
              )}
            </Button>
          )}
          <Button
            onClick={handleExport}
            className="bg-transparent border border-gold-primary/30 text-gray-200 hover:bg-gold-50 hover:text-gold-light"
          >
            <FileDown className="h-4 w-4 mr-2" />
            Exportera
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">
              {checkedItems} av {totalItems} varor avbockade
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={handleCheckAll}
                disabled={!canEdit}
                className="bg-transparent border border-gold-primary/30 text-gray-200 hover:bg-gold-50 hover:text-gold-light disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5 mr-1" />
                Bocka alla
              </Button>
              <Button
                size="sm"
                onClick={handleUncheckAll}
                disabled={!canEdit}
                className="bg-transparent border border-gold-primary/30 text-gray-200 hover:bg-gold-50 hover:text-gold-light disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5 mr-1" />
                Avbocka alla
              </Button>
              <Button
                size="sm"
                onClick={handleClearChecked}
                disabled={!canEdit || checkedItems === 0}
                className="bg-transparent border border-[rgba(255,0,0,0.3)] text-gray-200 hover:bg-[rgba(255,0,0,0.1)] hover:text-red-400 disabled:opacity-50"
              >
                <Eraser className="h-3.5 w-3.5 mr-1" />
                Rensa avbockade
              </Button>
            </div>
          </div>
          <div className="w-full bg-black/30 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-[#4ade80] to-[#22c55e] h-2 rounded-full transition-all"
              style={{ width: `${totalItems > 0 ? (checkedItems / totalItems) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Add Items */}
        <div className="lg:col-span-1 space-y-4">
          {canEdit && (
            <>
              {/* Search Food Bank */}
              <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gold-light tracking-[1px]">
                    Sök i livsmedelsbanken
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-[rgba(255,255,255,0.4)]" />
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Sök livsmedel..."
                      className="pl-10 bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                    />
                  </div>
                  {isSearching && (
                    <p className="text-sm text-gray-400">Söker...</p>
                  )}
                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-80 overflow-y-auto">
                      {searchResults.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-[rgba(0,0,0,0.2)] rounded hover:bg-gold-50 transition-colors"
                        >
                          <div>
                            <p className="text-sm text-white">{item.name}</p>
                            {item.foodCategory && (
                              <Badge
                                className="text-xs mt-1"
                                style={{
                                  backgroundColor: `${item.foodCategory.color}20`,
                                  color: item.foodCategory.color,
                                  borderColor: item.foodCategory.color,
                                }}
                              >
                                {item.foodCategory.name}
                              </Badge>
                            )}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleAddFoodItem(item)}
                            className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Add Custom Item */}
              <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-gold-light tracking-[1px]">
                    Lägg till egen vara
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label className="text-gray-200">Namn</Label>
                    <Input
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder="t.ex. Mjölk"
                      className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-gray-200">Antal</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={customItemQuantity}
                        onChange={(e) => setCustomItemQuantity(e.target.value)}
                        className="bg-black/30 border-gold-primary/30 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-200">Enhet</Label>
                      <Input
                        value={customItemUnit}
                        onChange={(e) => setCustomItemUnit(e.target.value)}
                        placeholder="st, kg, l..."
                        className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCustomItem}
                    className="w-full bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Lägg till
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Right: Shopping List Items */}
        <div className="lg:col-span-2">
          <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-xl font-bold text-gold-light tracking-[1px]">
                Inköpslista ({totalItems} varor)
              </CardTitle>
            </CardHeader>
            <CardContent>
              {totalItems === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">Inga varor ännu.</p>
                  <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                    Sök i livsmedelsbanken eller lägg till egna varor.
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(grouped).map(([category, items]) => (
                    <div key={category}>
                      <h3 className="text-lg font-semibold text-gold-light mb-3">{category}</h3>
                      <div className="space-y-2">
                        {items.map((item) => {
                          const name = item.foodItem?.name || item.customName
                          return (
                            <div
                              key={item.id}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                                item.checked
                                  ? 'bg-[rgba(34,197,94,0.1)] border-[rgba(34,197,94,0.3)] opacity-60'
                                  : 'bg-[rgba(0,0,0,0.2)] border-gold-primary/10'
                              }`}
                            >
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleToggleChecked(item.id, item.checked)}
                                disabled={!canEdit}
                                className="flex-shrink-0 hover:bg-gold-50"
                              >
                                {item.checked ? (
                                  <Check className="h-5 w-5 text-green-400" />
                                ) : (
                                  <div className="h-5 w-5 rounded border-2 border-[rgba(255,255,255,0.3)]" />
                                )}
                              </Button>
                              <div className="flex-1">
                                <p
                                  className={`font-medium ${
                                    item.checked
                                      ? 'text-gray-500 line-through'
                                      : 'text-white'
                                  }`}
                                >
                                  {item.quantity} {item.unit} {name}
                                </p>
                                {item.notes && (
                                  <p className="text-sm text-gray-500 mt-1">
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                              {canEdit && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="flex-shrink-0 text-gray-400 hover:text-red-400 hover:bg-[rgba(255,0,0,0.1)]"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="bg-gray-900/95 border-2 border-gold-primary/30 backdrop-blur-[10px] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Dela inköpslista
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Dela denna lista med familj eller partner.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-gray-200">Användar-ID</Label>
              <Input
                value={shareUserId}
                onChange={(e) => setShareUserId(e.target.value)}
                placeholder="Användarens ID"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
              <p className="text-xs text-[rgba(255,255,255,0.4)] mt-1">
                Du hittar användar-ID i användarens profil
              </p>
            </div>
            <div>
              <Label className="text-gray-200">Behörighet</Label>
              <div className="flex gap-2 mt-2">
                <Button
                  onClick={() => setShareRole('viewer')}
                  className={`flex-1 ${
                    shareRole === 'viewer'
                      ? 'bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a]'
                      : 'bg-transparent border border-gold-primary/30 text-gray-200'
                  }`}
                >
                  Läsare
                </Button>
                <Button
                  onClick={() => setShareRole('editor')}
                  className={`flex-1 ${
                    shareRole === 'editor'
                      ? 'bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a]'
                      : 'bg-transparent border border-gold-primary/30 text-gray-200'
                  }`}
                >
                  Redigerare
                </Button>
              </div>
            </div>

            {/* Current Shares */}
            {list.shares.length > 0 && (
              <div>
                <Label className="text-gray-200 mb-2 block">
                  Delad med ({list.shares.length})
                </Label>
                <div className="space-y-2">
                  {list.shares.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center justify-between p-2 bg-[rgba(0,0,0,0.2)] rounded"
                    >
                      <div>
                        <p className="text-sm text-white">{share.sharedWith}</p>
                        <Badge className="text-xs mt-1">
                          {share.role === 'editor' ? 'Redigerare' : 'Läsare'}
                        </Badge>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveShare(share.id)}
                        className="text-red-400 hover:text-red-500 hover:bg-[rgba(255,0,0,0.1)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsShareDialogOpen(false)}
              className="bg-transparent border border-gold-primary/30 text-gray-200 hover:bg-gold-50 hover:text-gold-light"
            >
              Stäng
            </Button>
            <Button
              onClick={handleShare}
              className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              <Users className="h-4 w-4 mr-2" />
              Dela
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
