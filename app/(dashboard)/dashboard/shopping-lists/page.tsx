'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

// This page auto-redirects to the user's single shopping list
// Creates one if it doesn't exist
export default function ClientShoppingListsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user) return

    const initializeShoppingList = async () => {
      try {
        // Fetch existing lists
        const response = await fetch('/api/shopping-lists')
        if (!response.ok) {
          toast.error('Kunde inte hämta inköpslista')
          return
        }

        const data = await response.json()
        const allLists = [...(data.ownLists || []), ...(data.sharedLists || [])]

        if (allLists.length > 0) {
          // Redirect to the first (and should be only) list
          router.replace(`/dashboard/shopping-lists/${allLists[0].id}`)
        } else {
          // Create a default shopping list
          setIsCreating(true)
          const createResponse = await fetch('/api/shopping-lists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: 'Min inköpslista',
              description: 'Din personliga inköpslista',
              color: '#FFD700',
            }),
          })

          if (createResponse.ok) {
            const { list } = await createResponse.json()
            router.replace(`/dashboard/shopping-lists/${list.id}`)
          } else {
            toast.error('Kunde inte skapa inköpslista')
            setIsCreating(false)
          }
        }
      } catch (error) {
        console.error('Error initializing shopping list:', error)
        toast.error('Ett fel uppstod')
        setIsCreating(false)
      }
    }

    initializeShoppingList()
  }, [session, status, router])

  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-gold-primary mx-auto mb-4" />
        <p className="text-gray-600">
          {isCreating ? 'Skapar din inköpslista...' : 'Laddar inköpslista...'}
        </p>
      </div>
    </div>
  )
}
