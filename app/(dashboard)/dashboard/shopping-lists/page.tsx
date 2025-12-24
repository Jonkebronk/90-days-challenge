'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Plus, ShoppingCart, Users, ChevronRight, CalendarDays, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  ShoppingListTabs,
  FavoriteProductList,
  RecurringItemManager,
  MealPlanToListWizard,
  type TabType,
} from '@/components/shopping-list'

type ShoppingList = {
  id: string
  name: string
  description: string | null
  color: string
  createdAt: string
  smartMealPlanId?: string | null
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

  const [activeTab, setActiveTab] = useState<TabType>('lists')
  const [ownLists, setOwnLists] = useState<ShoppingList[]>([])
  const [sharedLists, setSharedLists] = useState<ShoppingList[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [counts, setCounts] = useState({ lists: 0, favorites: 0, recurring: 0 })
  const [showMealPlanWizard, setShowMealPlanWizard] = useState(false)

  useEffect(() => {
    if (session?.user) {
      fetchLists()
      fetchCounts()
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

  const fetchCounts = async () => {
    try {
      const [listsRes, favoritesRes, recurringRes] = await Promise.all([
        fetch('/api/shopping-lists'),
        fetch('/api/favorites'),
        fetch('/api/recurring-items?active=true'),
      ])

      if (listsRes.ok && favoritesRes.ok && recurringRes.ok) {
        const [listsData, favoritesData, recurringData] = await Promise.all([
          listsRes.json(),
          favoritesRes.json(),
          recurringRes.json(),
        ])

        setCounts({
          lists: (listsData.ownLists?.length || 0) + (listsData.sharedLists?.length || 0),
          favorites: favoritesData.favorites?.length || 0,
          recurring: recurringData.items?.length || 0,
        })
      }
    } catch (error) {
      console.error('Error fetching counts:', error)
    }
  }

  const handleMealPlanSuccess = (listId: string) => {
    fetchLists()
    fetchCounts()
    router.push(`/dashboard/shopping-lists/${listId}`)
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

  const allLists = [...ownLists, ...sharedLists]

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="relative text-center py-8 bg-gradient-to-br from-gold-primary/5 to-transparent border border-gray-200 rounded-xl mb-4">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-gold-primary to-gold-secondary bg-clip-text text-transparent tracking-[1px]">
          INKÖPSLISTOR
        </h1>
        <p className="text-gray-600 mt-2">
          Hantera dina inköpslistor och favoriter
        </p>
      </div>

      {/* Tabs */}
      <ShoppingListTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        counts={counts}
        className="rounded-t-xl"
      />

      {/* Tab Content */}
      <div className="bg-white border-x border-b border-zinc-200 rounded-b-xl">
        {/* Lists Tab */}
        {activeTab === 'lists' && (
          <div className="p-4">
            {/* Action buttons */}
            <div className="flex gap-2 mb-4">
              <Button
                onClick={() => setShowMealPlanWizard(true)}
                className="flex-1 bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-bold"
              >
                <CalendarDays className="h-5 w-5 mr-2" />
                Från måltidsplan
              </Button>
              <Button
                onClick={() => router.push('/dashboard/content/shopping-lists')}
                variant="outline"
                className="border-gold-primary text-gold-primary hover:bg-gold-primary/5"
              >
                <Plus className="h-5 w-5 mr-1" />
                Ny lista
              </Button>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gold-primary" />
              </div>
            ) : allLists.length === 0 ? (
              <div className="text-center py-12">
                <ShoppingCart className="h-16 w-16 mx-auto text-zinc-300 mb-4" />
                <p className="text-zinc-600 text-lg mb-2">Inga inköpslistor ännu</p>
                <p className="text-sm text-zinc-500 mb-6">
                  Skapa en lista från din måltidsplan eller börja från scratch
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Own Lists */}
                {ownLists.length > 0 && (
                  <>
                    <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-1 mt-2 mb-2">
                      Mina listor
                    </h2>
                    {ownLists.map((list) => {
                      const totalItems = list._count.items
                      const isMealPlanList = !!list.smartMealPlanId

                      return (
                        <Card
                          key={list.id}
                          className="bg-white border border-zinc-200 hover:border-gold-primary hover:shadow-lg transition-all active:scale-98 cursor-pointer"
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
                                  <h3 className="font-semibold text-zinc-900 truncate">{list.name}</h3>
                                  {isMealPlanList && (
                                    <CalendarDays className="h-4 w-4 text-gold-primary shrink-0" />
                                  )}
                                </div>
                                {list.description && (
                                  <p className="text-sm text-zinc-600 truncate mt-0.5">
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
                              <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />
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
                    <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide px-1 mt-6 mb-2">
                      Delade med mig
                    </h2>
                    {sharedLists.map((list) => {
                      const totalItems = list._count.items

                      return (
                        <Card
                          key={list.id}
                          className="bg-white border border-zinc-200 hover:border-gold-primary hover:shadow-lg transition-all active:scale-98 cursor-pointer"
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
                                  <h3 className="font-semibold text-zinc-900 truncate">{list.name}</h3>
                                  <Users className="h-3.5 w-3.5 text-orange-600 flex-shrink-0" />
                                </div>
                                {list.description && (
                                  <p className="text-sm text-zinc-600 truncate mt-0.5">
                                    {list.description}
                                  </p>
                                )}
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge className="bg-blue-50 text-blue-700 border border-blue-200 text-xs">
                                    {totalItems} {totalItems === 1 ? 'vara' : 'varor'}
                                  </Badge>
                                </div>
                              </div>
                              <ChevronRight className="h-5 w-5 text-zinc-400 flex-shrink-0" />
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
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div className="p-4">
            <FavoriteProductList />
          </div>
        )}

        {/* Recurring Tab */}
        {activeTab === 'recurring' && (
          <div className="p-4">
            <RecurringItemManager />
          </div>
        )}
      </div>

      {/* Meal Plan Wizard Dialog */}
      <MealPlanToListWizard
        isOpen={showMealPlanWizard}
        onClose={() => setShowMealPlanWizard(false)}
        onSuccess={handleMealPlanSuccess}
      />
    </div>
  )
}
