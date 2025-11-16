'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ShoppingCart, Users, ChevronRight } from 'lucide-react'
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

export default function ClientShoppingListsPage() {
  const { data: session } = useSession()
  const router = useRouter()

  const [ownLists, setOwnLists] = useState<ShoppingList[]>([])
  const [sharedLists, setSharedLists] = useState<ShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)

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

  if (!session?.user) {
    return (
      <div className="p-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <p className="text-gray-700">Du måste logga in för att se dina inköpslistor.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="p-4">
        <p className="text-gray-600 text-center py-8">Laddar...</p>
      </div>
    )
  }

  const allLists = [...ownLists, ...sharedLists]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
          INKÖPSLISTOR
        </h1>
        <p className="text-gray-600 mt-2">
          {allLists.length} {allLists.length === 1 ? 'lista' : 'listor'}
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => router.push('/dashboard/content/shopping-lists')}
            className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-bold"
          >
            <Plus className="h-5 w-5 mr-1" />
            Ny lista
          </Button>
        </div>

        {allLists.length === 0 ? (
          <Card className="bg-white border border-gray-200">
            <CardContent className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto text-gold-primary mb-4" />
              <p className="text-gray-600 text-lg mb-2">Inga inköpslistor ännu</p>
              <p className="text-sm text-gray-500 mb-6">
                Skapa din första lista för att komma igång
              </p>
              <Button
                onClick={() => router.push('/dashboard/content/shopping-lists')}
                className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-bold"
              >
                <Plus className="h-4 w-4 mr-2" />
                Skapa lista
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {/* Own Lists */}
            {ownLists.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mt-4 mb-2">
                  Mina listor
                </h2>
                {ownLists.map((list) => {
                  const checkedItems = 0 // We'll calculate this in detail view
                  const totalItems = list._count.items

                  return (
                    <Card
                      key={list.id}
                      className="bg-white border border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                      onClick={() => router.push(`/dashboard/shopping-lists/${list.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-14 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-gray-900 truncate">{list.name}</h3>
                            {list.description && (
                              <p className="text-sm text-gray-600 truncate mt-0.5">
                                {list.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                {totalItems} {totalItems === 1 ? 'vara' : 'varor'}
                              </Badge>
                              {list.shares.length > 0 && (
                                <Badge className="bg-green-50 text-green-700 border border-green-200 text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  Delad
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )}

            {/* Shared Lists */}
            {sharedLists.length > 0 && (
              <>
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide px-1 mt-6 mb-2">
                  Delade med mig
                </h2>
                {sharedLists.map((list) => {
                  const totalItems = list._count.items

                  return (
                    <Card
                      key={list.id}
                      className="bg-white border border-gray-200 hover:border-gold-primary hover:shadow-lg transition-all active:scale-98 cursor-pointer"
                      onClick={() => router.push(`/dashboard/shopping-lists/${list.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-14 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 truncate">{list.name}</h3>
                              <Users className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                            </div>
                            {list.description && (
                              <p className="text-sm text-gray-600 truncate mt-0.5">
                                {list.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                {totalItems} {totalItems === 1 ? 'vara' : 'varor'}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
