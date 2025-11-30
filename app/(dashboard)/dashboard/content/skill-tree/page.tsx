'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Pencil,
  Trash2,
  ArrowUp,
  ArrowDown,
  X,
  Map,
  Heart,
  Leaf,
  Dumbbell,
  BookOpen,
  Brain,
  Zap,
  Target,
  Flame,
  Star
} from 'lucide-react'
import { toast } from 'sonner'

type Branch = {
  id: string
  name: string
  icon: string
  color: string
  categorySlugs: string[]
  orderIndex: number
}

type Category = {
  id: string
  name: string
  slug: string
  color?: string
}

const iconOptions = [
  { name: 'Heart', icon: Heart },
  { name: 'Leaf', icon: Leaf },
  { name: 'Dumbbell', icon: Dumbbell },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Brain', icon: Brain },
  { name: 'Zap', icon: Zap },
  { name: 'Target', icon: Target },
  { name: 'Flame', icon: Flame },
  { name: 'Star', icon: Star }
]

const colorOptions = [
  { name: 'Lila', value: '#A855F7' },
  { name: 'Grön', value: '#22C55E' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Blå', value: '#3B82F6' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Röd', value: '#EF4444' },
  { name: 'Guld', value: '#FFD700' }
]

export default function SkillTreeAdminPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Heart',
    color: '#A855F7',
    categorySlugs: [] as string[]
  })

  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  useEffect(() => {
    if (session?.user && isCoach) {
      fetchData()
    }
  }, [session, isCoach])

  const fetchData = async () => {
    try {
      setIsLoading(true)
      const [branchesRes, categoriesRes] = await Promise.all([
        fetch('/api/skill-tree-branches'),
        fetch('/api/article-categories?audience=client')
      ])

      if (branchesRes.ok) {
        const data = await branchesRes.json()
        setBranches(data.branches)
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Kunde inte hämta data')
    } finally {
      setIsLoading(false)
    }
  }

  const openCreateDialog = () => {
    setEditingBranch(null)
    setFormData({
      name: '',
      icon: 'Heart',
      color: '#A855F7',
      categorySlugs: []
    })
    setDialogOpen(true)
  }

  const openEditDialog = (branch: Branch) => {
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      icon: branch.icon,
      color: branch.color,
      categorySlugs: branch.categorySlugs
    })
    setDialogOpen(true)
  }

  const handleSave = async () => {
    if (!formData.name) {
      toast.error('Namn krävs')
      return
    }

    try {
      if (editingBranch) {
        // Update
        const response = await fetch(`/api/skill-tree-branches/${editingBranch.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          toast.success('Gren uppdaterad!')
          fetchData()
        } else {
          toast.error('Kunde inte uppdatera gren')
        }
      } else {
        // Create
        const response = await fetch('/api/skill-tree-branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          toast.success('Gren skapad!')
          fetchData()
        } else {
          toast.error('Kunde inte skapa gren')
        }
      }

      setDialogOpen(false)
    } catch (error) {
      console.error('Error saving branch:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDelete = async (branch: Branch) => {
    if (!confirm(`Vill du verkligen ta bort "${branch.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/skill-tree-branches/${branch.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Gren borttagen!')
        fetchData()
      } else {
        toast.error('Kunde inte ta bort gren')
      }
    } catch (error) {
      console.error('Error deleting branch:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleReorder = async (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= branches.length) return

    const newBranches = [...branches]
    const temp = newBranches[index]
    newBranches[index] = newBranches[newIndex]
    newBranches[newIndex] = temp

    setBranches(newBranches)

    try {
      await fetch('/api/skill-tree-branches', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchIds: newBranches.map(b => b.id)
        })
      })
    } catch (error) {
      console.error('Error reordering:', error)
      fetchData() // Revert on error
    }
  }

  const toggleCategory = (slug: string) => {
    setFormData(prev => ({
      ...prev,
      categorySlugs: prev.categorySlugs.includes(slug)
        ? prev.categorySlugs.filter(s => s !== slug)
        : [...prev.categorySlugs, slug]
    }))
  }

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.name === iconName)
    return option?.icon || Heart
  }

  if (!session?.user || !isCoach) {
    return (
      <div className="container mx-auto p-6 text-center">
        <p className="text-gray-400">Du har inte behörighet att se denna sida.</p>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Kunskapskartan Admin
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Hantera grenar och kategorikopplingar
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button
          onClick={openCreateDialog}
          className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-semibold hover:opacity-90"
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till gren
        </Button>
      </div>

      {/* Branches List */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      ) : branches.length === 0 ? (
        <Card className="bg-white/5 border-gold-primary/30">
          <CardContent className="text-center py-12">
            <Map className="w-16 h-16 mx-auto text-gray-500 mb-4" />
            <p className="text-gray-400 mb-4">Inga grenar skapade ännu</p>
            <Button onClick={openCreateDialog} variant="outline" className="border-gold-primary/50 text-gold-light">
              Skapa din första gren
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {branches.map((branch, index) => {
            const Icon = getIconComponent(branch.icon)
            return (
              <Card key={branch.id} className="bg-white/5 border-white/10 hover:border-white/20 transition-all">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    {/* Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: branch.color }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white">{branch.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {branch.categorySlugs.length > 0 ? (
                          branch.categorySlugs.map(slug => {
                            const cat = categories.find(c => c.slug === slug)
                            return (
                              <Badge
                                key={slug}
                                variant="outline"
                                className="text-xs border-gray-600 text-gray-400"
                              >
                                {cat?.name || slug}
                              </Badge>
                            )
                          })
                        ) : (
                          <span className="text-xs text-gray-500">Inga kategorier kopplade</span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(index, 'up')}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-white"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleReorder(index, 'down')}
                        disabled={index === branches.length - 1}
                        className="text-gray-400 hover:text-white"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(branch)}
                        className="text-gray-400 hover:text-gold-light"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(branch)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-gray-900 border-gold-primary/30 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-gold-light">
              {editingBranch ? 'Redigera gren' : 'Skapa ny gren'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-gray-200">Namn</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="T.ex. Livsstil"
                className="bg-black/30 border-gold-primary/30 text-white"
              />
            </div>

            {/* Icon */}
            <div className="space-y-2">
              <Label className="text-gray-200">Ikon</Label>
              <Select value={formData.icon} onValueChange={(value) => setFormData({ ...formData, icon: value })}>
                <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map(option => {
                    const IconComponent = option.icon
                    return (
                      <SelectItem key={option.name} value={option.name}>
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <span>{option.name}</span>
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Color */}
            <div className="space-y-2">
              <Label className="text-gray-200">Färg</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, color: option.value })}
                    className={`w-10 h-10 rounded-lg border-2 transition-all ${
                      formData.color === option.value
                        ? 'border-white scale-110'
                        : 'border-transparent hover:border-white/50'
                    }`}
                    style={{ backgroundColor: option.value }}
                    title={option.name}
                  />
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="space-y-2">
              <Label className="text-gray-200">Kategorier</Label>
              <p className="text-xs text-gray-500 mb-2">
                Välj vilka kategorier som ska visas under denna gren
              </p>
              <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-2 bg-black/20 rounded-lg">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => toggleCategory(cat.slug)}
                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                      formData.categorySlugs.includes(cat.slug)
                        ? 'bg-gold-primary text-black font-medium'
                        : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {formData.categorySlugs.length > 0 && (
                <p className="text-xs text-gray-400">
                  {formData.categorySlugs.length} kategori(er) valda
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-gold-light to-orange-500 text-[#0a0a0a] font-semibold"
            >
              {editingBranch ? 'Spara' : 'Skapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
