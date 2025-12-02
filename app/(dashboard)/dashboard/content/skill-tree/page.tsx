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
  Trophy,
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
  skillTreeSubcategoryId?: string | null
}

type Subcategory = {
  id: string
  name: string
  orderIndex: number
  articles: BranchArticle[]
}

type Branch = {
  id: string
  name: string
  icon: string
  color: string
  categorySlugs: string[]
  orderIndex: number
  articles?: BranchArticle[]
  subcategories?: Subcategory[]
}

type Article = {
  id: string
  title: string
  slug: string
  published: boolean
  skillTreeBranchId?: string | null
  skillTreeSubcategoryId?: string | null
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
  { name: 'Star', icon: Star },
  { name: 'Trophy', icon: Trophy }
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
  const [subcategoryDialogOpen, setSubcategoryDialogOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [selectedBranchForArticle, setSelectedBranchForArticle] = useState<Branch | null>(null)
  const [selectedSubcategoryForArticle, setSelectedSubcategoryForArticle] = useState<Subcategory | null>(null)
  const [selectedBranchForSubcategory, setSelectedBranchForSubcategory] = useState<Branch | null>(null)
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    icon: 'Heart',
    color: '#A855F7'
  })
  const [subcategoryFormData, setSubcategoryFormData] = useState({ name: '' })

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
        fetch('/api/skill-tree-branches?includeArticles=true&includeAll=true'),
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
          b.id === branchId ? {
            ...b,
            articles: data.articles || [],
            subcategories: data.subcategories || []
          } : b
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

  // Subcategory functions
  const openSubcategoryDialog = (branch: Branch, subcategory?: Subcategory) => {
    setSelectedBranchForSubcategory(branch)
    setEditingSubcategory(subcategory || null)
    setSubcategoryFormData({ name: subcategory?.name || '' })
    setSubcategoryDialogOpen(true)
  }

  const handleSaveSubcategory = async () => {
    if (!subcategoryFormData.name || !selectedBranchForSubcategory) {
      toast.error('Namn krävs')
      return
    }

    try {
      if (editingSubcategory) {
        await fetch(`/api/skill-tree-branches/${selectedBranchForSubcategory.id}/subcategories/${editingSubcategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: subcategoryFormData.name })
        })
        toast.success('Subkategori uppdaterad!')
      } else {
        await fetch(`/api/skill-tree-branches/${selectedBranchForSubcategory.id}/subcategories`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: subcategoryFormData.name })
        })
        toast.success('Subkategori skapad!')
      }
      setSubcategoryDialogOpen(false)
      fetchBranchArticles(selectedBranchForSubcategory.id)
    } catch (error) {
      console.error('Error saving subcategory:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteSubcategory = async (branchId: string, subcategoryId: string) => {
    if (!confirm('Vill du verkligen ta bort denna subkategori? Artiklarna kommer behållas i grenen.')) return

    try {
      await fetch(`/api/skill-tree-branches/${branchId}/subcategories/${subcategoryId}`, {
        method: 'DELETE'
      })
      toast.success('Subkategori borttagen!')
      fetchBranchArticles(branchId)
    } catch (error) {
      console.error('Error deleting subcategory:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleAddArticleToSubcategory = async (articleId: string) => {
    if (!selectedBranchForArticle || !selectedSubcategoryForArticle) return

    try {
      const response = await fetch(`/api/skill-tree-branches/${selectedBranchForArticle.id}/subcategories/${selectedSubcategoryForArticle.id}/articles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })

      if (response.ok) {
        toast.success('Artikel tillagd!')
        await fetchBranchArticles(selectedBranchForArticle.id)
        setAllArticles(prev => prev.map(a =>
          a.id === articleId ? { ...a, skillTreeBranchId: selectedBranchForArticle.id, skillTreeSubcategoryId: selectedSubcategoryForArticle.id } : a
        ))
      } else {
        toast.error('Kunde inte lägga till artikel')
      }
    } catch (error) {
      console.error('Error adding article:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleRemoveArticleFromSubcategory = async (branchId: string, subcategoryId: string, articleId: string) => {
    try {
      await fetch(`/api/skill-tree-branches/${branchId}/subcategories/${subcategoryId}/articles`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleId })
      })
      toast.success('Artikel borttagen från subkategori')
      fetchBranchArticles(branchId)
    } catch (error) {
      console.error('Error removing article:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const openAddArticleToSubcategoryDialog = (branch: Branch, subcategory: Subcategory) => {
    setSelectedBranchForArticle(branch)
    setSelectedSubcategoryForArticle(subcategory)
    setAddArticleDialogOpen(true)
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
            // Count both loose articles and articles in subcategories
            const looseArticleCount = articles.length
            const subcategoryArticleCount = (branch.subcategories || []).reduce((sum, sub) => sum + (sub.articles?.length || 0), 0)
            const articleCount = looseArticleCount + subcategoryArticleCount

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
                        {articleCount} artikel{articleCount !== 1 ? 'ar' : ''}
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
                  <div className="border-t border-white/10 bg-black/20 p-4 space-y-4">
                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openSubcategoryDialog(branch)}
                        className="border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Ny subkategori
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAddArticleDialog(branch)}
                        className="border-gold-primary/50 text-gold-light hover:bg-gold-primary/10"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Lägg till artikel
                      </Button>
                    </div>

                    {/* Subcategories */}
                    {(branch.subcategories || []).map((subcategory) => (
                      <div key={subcategory.id} className="bg-white/5 rounded-lg border border-cyan-500/30 overflow-hidden">
                        <div className="flex items-center justify-between p-3 bg-cyan-500/10">
                          <span className="font-semibold text-cyan-400 text-sm uppercase tracking-wider">
                            {subcategory.name}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAddArticleToSubcategoryDialog(branch, subcategory)}
                              className="h-7 w-7 text-cyan-400 hover:text-cyan-300"
                              title="Lägg till artikel"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openSubcategoryDialog(branch, subcategory)}
                              className="h-7 w-7 text-gray-400 hover:text-white"
                              title="Redigera"
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteSubcategory(branch.id, subcategory.id)}
                              className="h-7 w-7 text-gray-400 hover:text-red-500"
                              title="Ta bort"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        {subcategory.articles.length === 0 ? (
                          <p className="text-gray-500 text-xs text-center py-3">Inga artiklar</p>
                        ) : (
                          <div className="p-2 space-y-1">
                            {subcategory.articles.map((article) => (
                              <div
                                key={article.id}
                                className="flex items-center gap-2 p-2 bg-black/20 rounded hover:bg-black/40 cursor-pointer"
                                onClick={() => router.push(`/dashboard/content/articles/${article.id}`)}
                              >
                                <FileText className="w-3 h-3 text-gray-500" />
                                <span className="flex-1 text-xs text-gray-300 truncate">{article.title}</span>
                                {!article.published && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 border-yellow-500/50 text-yellow-500">Utkast</Badge>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleRemoveArticleFromSubcategory(branch.id, subcategory.id, article.id)
                                  }}
                                  className="h-6 w-6 text-gray-500 hover:text-red-400"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Loose Articles (not in subcategory) */}
                    {articles.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Artiklar utan subkategori</p>
                        {articles.map((article, artIndex) => (
                          <div
                            key={article.id}
                            className="flex items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                            onClick={() => router.push(`/dashboard/content/articles/${article.id}`)}
                          >
                            <FileText className="w-4 h-4 text-gray-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-white truncate hover:text-gold-light">{article.title}</p>
                            </div>
                            {!article.published && (
                              <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-500">Utkast</Badge>
                            )}
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
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

                    {/* Empty state */}
                    {articles.length === 0 && (branch.subcategories || []).length === 0 && (
                      <p className="text-gray-500 text-sm text-center py-4">
                        Inga artiklar eller subkategorier ännu
                      </p>
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
      <Dialog open={addArticleDialogOpen} onOpenChange={(open) => {
        setAddArticleDialogOpen(open)
        if (!open) setSelectedSubcategoryForArticle(null)
      }}>
        <DialogContent className="bg-gray-900 border-gold-primary/30 max-w-lg max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-gold-light">
              Lägg till artikel till {selectedSubcategoryForArticle ? selectedSubcategoryForArticle.name : selectedBranchForArticle?.name}
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
                      if (selectedSubcategoryForArticle) {
                        handleAddArticleToSubcategory(article.id)
                      } else {
                        handleAddArticle(article.id)
                      }
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

      {/* Subcategory Dialog */}
      <Dialog open={subcategoryDialogOpen} onOpenChange={setSubcategoryDialogOpen}>
        <DialogContent className="bg-gray-900 border-cyan-500/30 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-cyan-400">
              {editingSubcategory ? 'Redigera subkategori' : 'Ny subkategori'}
            </DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label className="text-gray-200">Namn</Label>
              <Input
                value={subcategoryFormData.name}
                onChange={(e) => setSubcategoryFormData({ name: e.target.value })}
                placeholder="T.ex. GRUNDEN"
                className="bg-black/30 border-cyan-500/30 text-white uppercase"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSubcategoryDialogOpen(false)}
              className="border-gray-600 text-gray-300"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleSaveSubcategory}
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              {editingSubcategory ? 'Spara' : 'Skapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
