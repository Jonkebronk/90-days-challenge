'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  FileText,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Filter,
  ArrowUp,
  ArrowDown,
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
  LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'

type BranchArticle = {
  id: string
  title: string
  slug: string
  orderInBranch: number
  published: boolean
  difficulty?: string | null
  phase?: number | null
  estimatedReadingMinutes?: number | null
}

type Branch = {
  id: string
  name: string
  icon: string
  color: string
  orderIndex: number
  articles: BranchArticle[]
}

const iconMap: Record<string, LucideIcon> = {
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
}

export default function ArticlesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [branches, setBranches] = useState<Branch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Filters
  const [filterBranch, setFilterBranch] = useState<string>('all')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterPublished, setFilterPublished] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    branchId: ''
  })

  const isCoach = (session?.user as any)?.role?.toUpperCase() === 'COACH'

  useEffect(() => {
    if (session?.user && isCoach) {
      fetchBranches()
    }
  }, [session, isCoach])

  const fetchBranches = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/skill-tree-branches')
      if (response.ok) {
        const data = await response.json()
        // Fetch articles for each branch
        const branchesWithArticles = await Promise.all(
          data.branches.map(async (branch: Branch) => {
            const articlesRes = await fetch(`/api/skill-tree-branches/${branch.id}`)
            if (articlesRes.ok) {
              const articlesData = await articlesRes.json()
              return { ...branch, articles: articlesData.articles || [] }
            }
            return { ...branch, articles: [] }
          })
        )
        setBranches(branchesWithArticles)
      } else {
        toast.error('Kunde inte hämta grenar')
      }
    } catch (error) {
      console.error('Error fetching branches:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateArticle = async () => {
    if (!formData.title || !formData.slug) {
      toast.error('Titel och slug krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          published: false,
          skillTreeBranchId: formData.branchId || null
        })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Artikel skapad')
        setIsCreateDialogOpen(false)
        setFormData({ title: '', slug: '', branchId: '' })
        router.push(`/dashboard/content/articles/${data.article.id}`)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa artikel')
      }
    } catch (error) {
      console.error('Error creating article:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteArticle = async (article: BranchArticle) => {
    if (!confirm(`Är du säker på att du vill radera "${article.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Artikel raderad')
        fetchBranches()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera artikel')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleTogglePublished = async (article: BranchArticle) => {
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !article.published })
      })

      if (response.ok) {
        toast.success(article.published ? 'Artikel avpublicerad' : 'Artikel publicerad')
        // Update locally
        setBranches(prev => prev.map(branch => ({
          ...branch,
          articles: branch.articles.map(a =>
            a.id === article.id ? { ...a, published: !article.published } : a
          )
        })))
      } else {
        toast.error('Kunde inte uppdatera artikel')
      }
    } catch (error) {
      console.error('Error toggling published:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[åä]/g, 'a')
      .replace(/ö/g, 'o')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const handleTitleChange = (title: string) => {
    setFormData({ ...formData, title, slug: generateSlug(title) })
  }

  const handleMoveArticle = async (branchId: string, article: BranchArticle, direction: 'up' | 'down') => {
    const branch = branches.find(b => b.id === branchId)
    if (!branch) return

    const articles = [...branch.articles].sort((a, b) => a.orderInBranch - b.orderInBranch)
    const currentIndex = articles.findIndex(a => a.id === article.id)

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === articles.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const [movedArticle] = articles.splice(currentIndex, 1)
    articles.splice(newIndex, 0, movedArticle)

    // Optimistic update
    setBranches(prev => prev.map(b => {
      if (b.id !== branchId) return b
      return { ...b, articles: articles.map((a, i) => ({ ...a, orderInBranch: i })) }
    }))

    try {
      await fetch(`/api/skill-tree-branches/${branchId}/articles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articleIds: articles.map(a => a.id) })
      })
    } catch (error) {
      console.error('Error reordering:', error)
      fetchBranches()
    }
  }

  // Filter branches and articles
  const filteredBranches = branches
    .filter(branch => filterBranch === 'all' || branch.id === filterBranch)
    .map(branch => ({
      ...branch,
      articles: branch.articles
        .filter(article => {
          if (filterPhase !== 'all' && article.phase?.toString() !== filterPhase) return false
          if (filterPublished !== 'all' && article.published.toString() !== filterPublished) return false
          return true
        })
        .sort((a, b) => a.orderInBranch - b.orderInBranch)
    }))
    .filter(branch => branch.articles.length > 0 || filterBranch === branch.id)

  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || Heart
  }

  if (!session?.user || !isCoach) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-white/5 border border-gold-primary/20 backdrop-blur-[10px]">
          <CardContent className="p-6">
            <p className="text-gray-400">Du har inte behörighet att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-200">Skapa Artiklar</h1>
          <p className="text-gray-400 mt-1">
            Skapa och hantera artiklar för Kunskapskartan
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-black font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ny artikel
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border border-gold-primary/20 backdrop-blur-[10px]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gold-primary" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">Gren</Label>
                <Select value={filterBranch} onValueChange={setFilterBranch}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue placeholder="Välj gren" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla grenar</SelectItem>
                    {branches.map(branch => (
                      <SelectItem key={branch.id} value={branch.id}>
                        {branch.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">Fas</Label>
                <Select value={filterPhase} onValueChange={setFilterPhase}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue placeholder="Välj fas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla faser</SelectItem>
                    <SelectItem value="1">Fas 1 (1-30 dagar)</SelectItem>
                    <SelectItem value="2">Fas 2 (31-60 dagar)</SelectItem>
                    <SelectItem value="3">Fas 3 (61-90 dagar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-gray-400 mb-1 block">Status</Label>
                <Select value={filterPublished} onValueChange={setFilterPublished}>
                  <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                    <SelectValue placeholder="Välj status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla</SelectItem>
                    <SelectItem value="true">Publicerad</SelectItem>
                    <SelectItem value="false">Utkast</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-6">
        {isLoading ? (
          <Card className="bg-white/5 border border-gold-primary/20 backdrop-blur-[10px]">
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </CardContent>
          </Card>
        ) : filteredBranches.length === 0 ? (
          <Card className="bg-white/5 border border-gold-primary/20 backdrop-blur-[10px]">
            <CardContent className="py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-gold-primary mb-4" />
                <p className="text-gray-200">Inga artiklar ännu.</p>
                <p className="text-sm text-gray-400 mt-1">
                  Skapa din första artikel för att komma igång.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredBranches.map((branch) => {
            const Icon = getIconComponent(branch.icon)
            return (
              <Card
                key={branch.id}
                className="overflow-hidden bg-white/5 border border-gold-primary/20 backdrop-blur-[10px]"
              >
                <CardHeader
                  className="border-b border-gold-primary/20"
                  style={{
                    background: `linear-gradient(to right, ${branch.color}15, transparent)`
                  }}
                >
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: branch.color }}
                      >
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <span className="text-gray-200 uppercase tracking-[1px] font-semibold">
                        {branch.name}
                      </span>
                      <Badge className="bg-gold-primary/10 text-gold-primary border border-gold-primary/30">
                        {branch.articles.length}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {branch.articles.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">
                      Inga artiklar i denna gren
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="border-b border-gold-primary/20 hover:bg-transparent">
                          <TableHead className="text-gray-400 font-semibold">Titel</TableHead>
                          <TableHead className="text-gray-400 font-semibold">Fas</TableHead>
                          <TableHead className="text-gray-400 font-semibold">Svårighetsgrad</TableHead>
                          <TableHead className="text-gray-400 font-semibold">Tid</TableHead>
                          <TableHead className="text-gray-400 font-semibold">Status</TableHead>
                          <TableHead className="text-right text-gray-400 font-semibold">Åtgärder</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {branch.articles.map((article, index) => (
                          <TableRow key={article.id} className="border-b border-white/10 hover:bg-white/5">
                            <TableCell className="font-medium text-gray-200">{article.title}</TableCell>
                            <TableCell className="text-gray-300">
                              {article.phase ? `Fas ${article.phase}` : '-'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {article.difficulty ? (
                                <Badge variant="secondary" className="bg-white/10 text-gray-300">{article.difficulty}</Badge>
                              ) : '-'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {article.estimatedReadingMinutes ? `${article.estimatedReadingMinutes} min` : '-'}
                            </TableCell>
                            <TableCell className="text-gray-300">
                              {article.published ? (
                                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Publicerad</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-white/10 text-gray-400">Utkast</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMoveArticle(branch.id, article, 'up')}
                                  disabled={index === 0}
                                  className="hover:bg-white/10"
                                >
                                  <ArrowUp className="h-4 w-4 text-gray-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleMoveArticle(branch.id, article, 'down')}
                                  disabled={index === branch.articles.length - 1}
                                  className="hover:bg-white/10"
                                >
                                  <ArrowDown className="h-4 w-4 text-gray-400" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleTogglePublished(article)}
                                  title={article.published ? 'Avpublicera' : 'Publicera'}
                                  className="hover:bg-white/10"
                                >
                                  {article.published ? (
                                    <EyeOff className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <Eye className="h-4 w-4 text-gray-400" />
                                  )}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => router.push(`/dashboard/content/articles/${article.id}`)}
                                  className="hover:bg-white/10"
                                >
                                  <Pencil className="h-4 w-4 text-gold-primary" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteArticle(article)}
                                  className="hover:bg-red-500/10"
                                >
                                  <Trash2 className="h-4 w-4 text-red-400" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-gray-900 border border-gold-primary/30">
          <DialogHeader>
            <DialogTitle className="text-gray-200">Skapa ny artikel</DialogTitle>
            <DialogDescription className="text-gray-400">
              Lägg till en ny artikel till Kunskapskartan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-200">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="t.ex. Varför protein är viktigt"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label htmlFor="slug" className="text-gray-200">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. varfor-protein-ar-viktigt"
                className="bg-black/30 border-gold-primary/30 text-white placeholder:text-gray-500"
              />
            </div>
            <div>
              <Label htmlFor="branch" className="text-gray-200">Gren (valfritt)</Label>
              <Select
                value={formData.branchId}
                onValueChange={(value) => setFormData({ ...formData, branchId: value })}
              >
                <SelectTrigger className="bg-black/30 border-gold-primary/30 text-white">
                  <SelectValue placeholder="Välj gren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Ingen gren</SelectItem>
                  {branches.map(branch => (
                    <SelectItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500 mt-1">
                Du kan tilldela artikel till en gren senare via Kunskapskartan Admin
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-gold-primary/30 text-gray-300 hover:bg-white/10"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateArticle}
              disabled={isSaving}
              className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-black font-semibold"
            >
              {isSaving ? 'Skapar...' : 'Skapa artikel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
