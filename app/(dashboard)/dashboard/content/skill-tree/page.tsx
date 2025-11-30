'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
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
  Star,
  ChevronDown,
  ChevronRight,
  GripVertical,
  FileText
} from 'lucide-react'
import { toast } from 'sonner'

type BranchArticle = {
  id: string
  title: string
  slug: string
  orderInBranch: number
  published: boolean
  estimatedReadingMinutes?: number
}

type Branch = {
  id: string
  name: string
  icon: string
  color: string
  categorySlugs: string[]
  orderIndex: number
  articles?: BranchArticle[]
}

type Article = {
  id: string
  title: string
  slug: string
  published: boolean
  skillTreeBranchId?: string | null
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
  const [allArticles, setAllArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedBranch, setExpandedBranch] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [addArticleDialogOpen, setAddArticleDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [selectedBranchForArticle, setSelectedBranchForArticle] = useState<Branch | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Heart',
    color: '#A855F7'
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
      const [branchesRes, articlesRes] = await Promise.all([
        fetch('/api/skill-tree-branches'),
        fetch('/api/articles?audience=client')
      ])

      if (branchesRes.ok) {
        const data = await branchesRes.json()
        setBranches(data.branches)
      }

      if (articlesRes.ok) {
        const data = await articlesRes.json()
        setAllArticles(data.articles.map((a: any) => ({
          id: a.id,
          title: a.title,
          slug: a.slug,
          published: a.published,
          skillTreeBranchId: a.skillTreeBranchId
        })))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Kunde inte hämta data')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchBranchArticles = async (branchId: string) => {
    try {
      const response = await fetch(`/api/skill-tree-branches/${branchId}`)
      if (response.ok) {
        const data = await response.json()
        setBranches(prev => prev.map(b =>
          b.id === branchId ? { ...b, articles: data.branch.articles } : b
        ))
      }
    } catch (error) {
      console.error('Error fetching branch articles:', error)
    }
  }

  const toggleBranch = async (branchId: string) => {
    if (expandedBranch === branchId) {
      setExpandedBranch(null)
    } else {
      setExpandedBranch(branchId)
      // Fetch articles for this branch if not already loaded
      const branch = branches.find(b => b.id === branchId)
      if (!branch?.articles) {
        await fetchBranchArticles(branchId)
      }
    }
  }

  const openCreateDialog = () => {
    setEditingBranch(null)
    setFormData({
      name: '',
      icon: 'Heart',
      color: '#A855F7'
    })
    setDialogOpen(true)
  }

  const openEditDialog = (branch: Branch, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingBranch(branch)
    setFormData({
      name: branch.name,
      icon: branch.icon,
      color: branch.color
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
        const response = await fetch(`/api/skill-tree-branches/${editingBranch.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          toast.success('Gren uppdaterad!')
          fetchData()
          setDialogOpen(false)
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Update error:', errorData)
          toast.error(errorData.error || 'Kunde inte uppdatera gren')
        }
      } else {
        const response = await fetch('/api/skill-tree-branches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        })

        if (response.ok) {
          toast.success('Gren skapad!')
          fetchData()
          setDialogOpen(false)
        } else {
          const errorData = await response.json().catch(() => ({}))
          console.error('Create error:', errorData)
          toast.error(errorData.error || 'Kunde inte skapa gren')
        }
      }
    } catch (error) {
      console.error('Error saving branch:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDelete = async (branch: Branch, e: React.MouseEvent) => {
    e.stopPropagation()
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

  const handleBranchReorder = async (index: number, direction: 'up' | 'down', e: React.MouseEvent) => {
    e.stopPropagation()
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
      fetchData()
    }
  }

  const openAddArticleDialog = (branch: Branch) => {
    setSelectedBranchForArticle(branch)
    setAddArticleDialogOpen(true)
  }

  const handleAddArticle = async (articleId: string) => {
    if (!selectedBranchForArticle) return

    try {
      const response = await fetch(`/api/skill-tree-branches/${selectedBranchForArticle.id}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })

      if (response.ok) {
        toast.success('Artikel tillagd!')
        await fetchBranchArticles(selectedBranchForArticle.id)
        // Update allArticles to reflect the change
        setAllArticles(prev => prev.map(a =>
          a.id === articleId ? { ...a, skillTreeBranchId: selectedBranchForArticle.id } : a
        ))
      } else {
        toast.error('Kunde inte lägga till artikel')
      }
    } catch (error) {
      console.error('Error adding article:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleRemoveArticle = async (branchId: string, articleId: string) => {
    try {
      const response = await fetch(`/api/skill-tree-branches/${branchId}/articles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })

      if (response.ok) {
        toast.success('Artikel borttagen från gren')
        await fetchBranchArticles(branchId)
        setAllArticles(prev => prev.map(a =>
          a.id === articleId ? { ...a, skillTreeBranchId: null } : a
        ))
      } else {
        toast.error('Kunde inte ta bort artikel')
      }
    } catch (error) {
      console.error('Error removing article:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleArticleReorder = async (branchId: string, articles: BranchArticle[], index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1
    if (newIndex < 0 || newIndex >= articles.length) return

    const newArticles = [...articles]
    const temp = newArticles[index]
    newArticles[index] = newArticles[newIndex]
    newArticles[newIndex] = temp

    // Update local state immediately
    setBranches(prev => prev.map(b =>
      b.id === branchId ? { ...b, articles: newArticles } : b
    ))

    try {
      await fetch(`/api/skill-tree-branches/${branchId}/articles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleIds: newArticles.map(a => a.id)
        })
      })
    } catch (error) {
      console.error('Error reordering articles:', error)
      fetchBranchArticles(branchId)
    }
  }

  const getIconComponent = (iconName: string) => {
    const option = iconOptions.find(o => o.name === iconName)
    return option?.icon || Heart
  }

  // Get available articles (not assigned to any branch)
  const availableArticles = allArticles.filter(a => !a.skillTreeBranchId)

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
          Hantera grenar och artiklar
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
            const isExpanded = expandedBranch === branch.id
            const articles = branch.articles || []

            return (
              <Card key={branch.id} className="bg-white/5 border-white/10 overflow-hidden">
                {/* Branch Header */}
                <div
                  className="p-4 cursor-pointer hover:bg-white/5 transition-all"
                  onClick={() => toggleBranch(branch.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Expand Icon */}
                    <div className="text-gray-400">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5" />
                      ) : (
                        <ChevronRight className="w-5 h-5" />
                      )}
                    </div>

                    {/* Branch Icon */}
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: branch.color }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white">{branch.name}</h3>
                      <p className="text-xs text-gray-500">
                        {articles.length} artikel{articles.length !== 1 ? 'ar' : ''}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleBranchReorder(index, 'up', e)}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-white"
                      >
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleBranchReorder(index, 'down', e)}
                        disabled={index === branches.length - 1}
                        className="text-gray-400 hover:text-white"
                      >
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => openEditDialog(branch, e)}
                        className="text-gray-400 hover:text-gold-light"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDelete(branch, e)}
                        className="text-gray-400 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Articles List (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-white/10 bg-black/20 p-4">
                    {/* Add Article Button */}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openAddArticleDialog(branch)}
                      className="mb-4 border-gold-primary/50 text-gold-light hover:bg-gold-primary/10"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Lägg till artikel
                    </Button>

                    {articles.length === 0 ? (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Inga artiklar tillagda ännu
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {articles.map((article, artIndex) => (
                          <div
                            key={article.id}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10"
                          >
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate">{article.title}</p>
                              {article.estimatedReadingMinutes && (
                                <p className="text-xs text-gray-500">
                                  {article.estimatedReadingMinutes} min läsning
                                </p>
                              )}
                            </div>
                            {!article.published && (
                              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">
                                Utkast
                              </Badge>
                            )}
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleArticleReorder(branch.id, articles, artIndex, 'up')}
                                disabled={artIndex === 0}
                                className="h-8 w-8 text-gray-400 hover:text-white"
                              >
                                <ArrowUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleArticleReorder(branch.id, articles, artIndex, 'down')}
                                disabled={artIndex === articles.length - 1}
                                className="h-8 w-8 text-gray-400 hover:text-white"
                              >
                                <ArrowDown className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveArticle(branch.id, article.id)}
                                className="h-8 w-8 text-gray-400 hover:text-red-500"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Create/Edit Branch Dialog */}
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

      {/* Add Article Dialog */}
      <Dialog open={addArticleDialogOpen} onOpenChange={setAddArticleDialogOpen}>
        <DialogContent className="bg-gray-900 border-gold-primary/30 max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-gold-light">
              Lägg till artikel till {selectedBranchForArticle?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            {availableArticles.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                Alla artiklar är redan tilldelade till grenar
              </p>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto">
                {availableArticles.map(article => (
                  <button
                    key={article.id}
                    onClick={() => {
                      handleAddArticle(article.id)
                      setAddArticleDialogOpen(false)
                    }}
                    className="w-full flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 hover:border-gold-primary/30 transition-all text-left"
                  >
                    <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">{article.title}</p>
                    </div>
                    {!article.published && (
                      <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">
                        Utkast
                      </Badge>
                    )}
                    <Plus className="w-4 h-4 text-gold-light" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAddArticleDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Stäng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
