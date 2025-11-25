'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Edit, Trash2, Flame, Dumbbell, Video, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog'
import { toast } from 'sonner'

interface WarmupExercise {
  id: string
  orderIndex: number
  name: string
  reps: string | null
  videoUrl: string | null
}

interface WarmupRoutine {
  id: string
  name: string
  description: string | null
  introText: string | null
  outroText: string | null
  exercises: WarmupExercise[]
  _count: {
    programs: number
  }
  createdAt: string
}

export default function WarmupsPage() {
  const [warmups, setWarmups] = useState<WarmupRoutine[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [warmupToDelete, setWarmupToDelete] = useState<WarmupRoutine | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetchWarmups()
  }, [])

  const fetchWarmups = async () => {
    try {
      const response = await fetch('/api/admin/warmups')
      if (response.ok) {
        const data = await response.json()
        setWarmups(data.warmups || [])
      } else {
        toast.error('Kunde inte hämta uppvärmningar')
      }
    } catch (error) {
      console.error('Error fetching warmups:', error)
      toast.error('Något gick fel')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!warmupToDelete) return

    setDeleting(true)
    try {
      const response = await fetch(`/api/admin/warmups/${warmupToDelete.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Uppvärmning borttagen')
        setWarmups(warmups.filter(w => w.id !== warmupToDelete.id))
        setDeleteDialogOpen(false)
        setWarmupToDelete(null)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte ta bort uppvärmning')
      }
    } catch (error) {
      console.error('Error deleting warmup:', error)
      toast.error('Något gick fel')
    } finally {
      setDeleting(false)
    }
  }

  const filteredWarmups = warmups.filter(warmup =>
    warmup.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/content">
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Tillbaka
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Flame className="w-7 h-7 text-orange-500" />
              Uppvärmningar
            </h1>
            <p className="text-gray-400 text-sm">
              Hantera uppvärmningsrutiner för träningsprogram
            </p>
          </div>
        </div>
        <Link href="/dashboard/content/warmups/create">
          <Button className="bg-orange-500 hover:bg-orange-600 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Ny Uppvärmning
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Sök uppvärmningar..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Warmups list */}
      {filteredWarmups.length === 0 ? (
        <Card className="bg-white border border-gray-200">
          <CardContent className="py-12 text-center">
            <Flame className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {searchTerm ? 'Inga uppvärmningar hittades' : 'Inga uppvärmningar ännu'}
            </h3>
            <p className="text-gray-600 mb-6">
              {searchTerm
                ? 'Prova att söka med andra ord'
                : 'Skapa din första uppvärmningsrutin för att komma igång'}
            </p>
            {!searchTerm && (
              <Link href="/dashboard/content/warmups/create">
                <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  Skapa Uppvärmning
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredWarmups.map((warmup) => (
            <Card
              key={warmup.id}
              className="bg-white border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all"
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
                        <Flame className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{warmup.name}</h3>
                        {warmup.description && (
                          <p className="text-sm text-gray-500 line-clamp-1">{warmup.description}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-3">
                      <Badge variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">
                        <Dumbbell className="w-3 h-3 mr-1" />
                        {warmup.exercises.length} övningar
                      </Badge>
                      {warmup.exercises.some(e => e.videoUrl) && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-600 border-purple-200">
                          <Video className="w-3 h-3 mr-1" />
                          Video
                        </Badge>
                      )}
                      <Badge variant="outline" className="bg-gray-50 text-gray-600 border-gray-200">
                        {warmup._count.programs} program
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/content/warmups/${warmup.id}/edit`}>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4 mr-1" />
                        Redigera
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        setWarmupToDelete(warmup)
                        setDeleteDialogOpen(true)
                      }}
                      disabled={warmup._count.programs > 0}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ta bort uppvärmning</DialogTitle>
            <DialogDescription>
              Är du säker på att du vill ta bort &quot;{warmupToDelete?.name}&quot;?
              Detta kan inte ångras.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleting}
            >
              Avbryt
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Tar bort...' : 'Ta bort'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
