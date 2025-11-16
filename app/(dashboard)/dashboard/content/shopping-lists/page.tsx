'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
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
import { Plus, ShoppingCart, Trash2, Edit, Users } from 'lucide-react'
import { toast } from 'sonner'

type ShoppingList = {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  _count: {
    items: number
  }
  shares: Array<{
    sharedWith: string
    role: string
  }>
}

export default function ShoppingListsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [ownLists, setOwnLists] = useState<ShoppingList[]>([])
  const [sharedLists, setSharedLists] = useState<ShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#FFD700',
  })

  useEffect(() => {
    if (session?.user) {
      fetchLists()
    }
  }, [session])

  const fetchLists = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/shopping-lists')
      if (response.ok) {
        const data = await response.json()
        setOwnLists(data.ownLists || [])
        setSharedLists(data.sharedLists || [])
      } else {
        toast.error('Kunde inte hämta inköpslistor')
      }
    } catch (error) {
      console.error('Error fetching lists:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateList = async () => {
    if (!formData.name) {
      toast.error('Namn krävs')
      return
    }

    try {
      const response = await fetch('/api/shopping-lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Inköpslista skapad')
        setIsCreateDialogOpen(false)
        setFormData({ name: '', description: '', color: '#FFD700' })
        // Navigate to the new list
        router.push(`/dashboard/content/shopping-lists/${data.list.id}`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa lista')
      }
    } catch (error) {
      console.error('Error creating list:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteList = async (listId: string, listName: string) => {
    if (!confirm(`Är du säker på att du vill radera "${listName}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/shopping-lists/${listId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Inköpslista raderad')
        fetchLists()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera lista')
      }
    } catch (error) {
      console.error('Error deleting list:', error)
      toast.error('Ett fel uppstod')
    }
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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-gray-400 text-center py-8">Laddar...</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent tracking-[1px]">
            Inköpslistor
          </h1>
          <p className="text-gray-400 mt-1">
            Hantera inköpslistor för dina klienter
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
        >
          <Plus className="h-4 w-4 mr-2" />
          Skapa ny lista
        </Button>
      </div>

      {/* Own Lists */}
      <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gold-light tracking-[1px]">
            Mina listor ({ownLists.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {ownLists.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-gray-400">Inga listor ännu.</p>
              <p className="text-sm text-[rgba(255,255,255,0.4)] mt-1">
                Skapa din första inköpslista för att komma igång.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {ownLists.map((list) => (
                <Card
                  key={list.id}
                  className="bg-black/30 border border-gold-primary/20 hover:border-[rgba(255,215,0,0.4)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/content/shopping-lists/${list.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        <h3 className="font-semibold text-white">{list.name}</h3>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-gray-400 hover:text-red-400"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteList(list.id, list.name)
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                    {list.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {list.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)]">
                        {list._count.items} items
                      </Badge>
                      {list.shares.length > 0 && (
                        <Badge className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)]">
                          <Users className="h-3 w-3 mr-1" />
                          Delad
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Shared Lists */}
      {sharedLists.length > 0 && (
        <Card className="bg-white/5 border-2 border-gold-primary/20 backdrop-blur-[10px]">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-gold-light tracking-[1px]">
              Delade med mig ({sharedLists.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sharedLists.map((list) => (
                <Card
                  key={list.id}
                  className="bg-black/30 border border-gold-primary/20 hover:border-[rgba(255,215,0,0.4)] transition-colors cursor-pointer"
                  onClick={() => router.push(`/dashboard/content/shopping-lists/${list.id}`)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: list.color }}
                        />
                        <h3 className="font-semibold text-white">{list.name}</h3>
                      </div>
                    </div>
                    {list.description && (
                      <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                        {list.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)]">
                        {list._count.items} items
                      </Badge>
                      <Badge className="bg-[rgba(255,165,0,0.1)] text-orange-300 border border-[rgba(255,165,0,0.3)]">
                        <Users className="h-3 w-3 mr-1" />
                        Delad
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create List Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-900/95 border-2 border-gold-primary/30 backdrop-blur-[10px] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent">
              Skapa inköpslista
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Skapa en ny inköpslista för dina klienter.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-200">
                Namn *
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="t.ex. Veckohandling"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="description" className="text-gray-200">
                Beskrivning
              </Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Valfri beskrivning"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-[rgba(255,255,255,0.4)]"
              />
            </div>
            <div>
              <Label htmlFor="color" className="text-gray-200">
                Färg
              </Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  id="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-16 cursor-pointer rounded border border-gold-primary/30"
                />
                <span className="text-sm text-gray-400">{formData.color}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsCreateDialogOpen(false)}
              className="bg-transparent border border-gold-primary/30 text-gray-200 hover:bg-gold-50 hover:text-gold-light"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateList}
              className="bg-gradient-to-br from-gold-light to-orange-500 text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              Skapa lista
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
