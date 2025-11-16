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
      <div className="container mx-auto p-4">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-6 backdrop-blur-[10px]">
          <p className="text-[rgba(255,255,255,0.7)]">Du måste logga in för att se dina inköpslistor.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-[rgba(255,255,255,0.6)] text-center py-8">Laddar...</p>
      </div>
    )
  }

  const allLists = [...ownLists, ...sharedLists]

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0a] to-[#1a1a1a]">
      {/* Header - Sticky */}
      <div className="sticky top-0 z-10 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-[rgba(255,215,0,0.2)] p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              Inköpslistor
            </h1>
            <p className="text-sm text-[rgba(255,255,255,0.6)] mt-0.5">
              {allLists.length} {allLists.length === 1 ? 'lista' : 'listor'}
            </p>
          </div>
          <Button
            onClick={() => router.push('/dashboard/content/shopping-lists')}
            className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
          >
            <Plus className="h-5 w-5 mr-1" />
            Ny lista
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto p-4 pb-20">
        {allLists.length === 0 ? (
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px] mt-8">
            <CardContent className="text-center py-16">
              <ShoppingCart className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)] text-lg mb-2">Inga inköpslistor ännu</p>
              <p className="text-sm text-[rgba(255,255,255,0.4)] mb-6">
                Skapa din första lista för att komma igång
              </p>
              <Button
                onClick={() => router.push('/dashboard/content/shopping-lists')}
                className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
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
                <h2 className="text-sm font-semibold text-[rgba(255,255,255,0.6)] uppercase tracking-wide px-1 mt-4 mb-2">
                  Mina listor
                </h2>
                {ownLists.map((list) => {
                  const checkedItems = 0 // We'll calculate this in detail view
                  const totalItems = list._count.items

                  return (
                    <Card
                      key={list.id}
                      className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,215,0,0.2)] hover:border-[rgba(255,215,0,0.4)] transition-all active:scale-98 cursor-pointer"
                      onClick={() => router.push(`/dashboard/shopping-lists/${list.id}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-1 h-14 rounded-full flex-shrink-0"
                            style={{ backgroundColor: list.color }}
                          />
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-white truncate">{list.name}</h3>
                            {list.description && (
                              <p className="text-sm text-[rgba(255,255,255,0.5)] truncate mt-0.5">
                                {list.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)] text-xs">
                                {totalItems} {totalItems === 1 ? 'vara' : 'varor'}
                              </Badge>
                              {list.shares.length > 0 && (
                                <Badge className="bg-[rgba(34,197,94,0.1)] text-green-400 border border-[rgba(34,197,94,0.3)] text-xs">
                                  <Users className="h-3 w-3 mr-1" />
                                  Delad
                                </Badge>
                              )}
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-[rgba(255,255,255,0.4)] flex-shrink-0" />
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
                <h2 className="text-sm font-semibold text-[rgba(255,255,255,0.6)] uppercase tracking-wide px-1 mt-6 mb-2">
                  Delade med mig
                </h2>
                {sharedLists.map((list) => {
                  const totalItems = list._count.items

                  return (
                    <Card
                      key={list.id}
                      className="bg-[rgba(255,255,255,0.03)] border border-[rgba(255,165,0,0.2)] hover:border-[rgba(255,165,0,0.4)] transition-all active:scale-98 cursor-pointer"
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
                              <h3 className="font-semibold text-white truncate">{list.name}</h3>
                              <Users className="h-3.5 w-3.5 text-orange-400 flex-shrink-0" />
                            </div>
                            {list.description && (
                              <p className="text-sm text-[rgba(255,255,255,0.5)] truncate mt-0.5">
                                {list.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)] text-xs">
                                {totalItems} {totalItems === 1 ? 'vara' : 'varor'}
                              </Badge>
                            </div>
                          </div>
                          <ChevronRight className="h-5 w-5 text-[rgba(255,255,255,0.4)] flex-shrink-0" />
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
