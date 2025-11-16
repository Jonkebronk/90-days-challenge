'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent } from '@/components/ui/card'
import { LearningPathCard } from '@/components/learning-path-card'
import { Loader2, Map } from 'lucide-react'

interface LearningPath {
  id: string
  title: string
  description: string | null
  slug: string
  coverImage: string | null
  difficulty: string | null
  estimatedDuration: number | null
  totalArticles: number
  completedArticles: number
  progress: number
  isLocked: boolean
  isStarted: boolean
  isCompleted: boolean
  isAssigned: boolean
  dueDate: string | null
}

export default function LearningPathsPage() {
  const { data: session } = useSession()
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchPaths()
    }
  }, [session])

  const fetchPaths = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/learning-paths')
      if (response.ok) {
        const data = await response.json()
        setPaths(data.paths)
      }
    } catch (error) {
      console.error('Error fetching paths:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du måste vara inloggad för att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="container mx-auto p-6 space-y-8 max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent mb-3">
            Lärandevägar
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
            Strukturerade läranderesor för din utveckling
          </p>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
        </div>

        {/* Stats */}
        {!isLoading && (
          <div className="flex items-center justify-center gap-8 mb-8 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[rgba(255,255,255,0.5)]">Totalt:</span>
              <span className="text-[#FFD700] font-semibold">{paths.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[rgba(255,255,255,0.5)]">Påbörjade:</span>
              <span className="text-yellow-400 font-semibold">
                {paths.filter(p => p.isStarted && !p.isCompleted).length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[rgba(255,255,255,0.5)]">Klara:</span>
              <span className="text-green-400 font-semibold">
                {paths.filter(p => p.isCompleted).length}
              </span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-[#FFD700]" />
          </div>
        ) : (
          <>
            {/* Paths Grid */}
            {paths.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paths.map((path) => (
                  <LearningPathCard key={path.id} {...path} />
                ))}
              </div>
            ) : (
              <Card className="bg-[rgba(10,10,10,0.5)] backdrop-blur-sm border-[rgba(255,215,0,0.2)]">
                <CardContent className="p-12 text-center">
                  <Map className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.3)] mb-4" />
                  <p className="text-[rgba(255,255,255,0.5)] mb-2">
                    Inga lärandevägar publicerade än
                  </p>
                  <p className="text-sm text-[rgba(255,255,255,0.3)]">
                    Kom tillbaka snart!
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}
