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
} from 'lucide-react'
import { toast } from 'sonner'

type ArticleCategory = {
  id: string
  name: string
  slug: string
  color?: string
}

type Article = {
  id: string
  title: string
  slug: string
  categoryId: string
  difficulty?: string | null
  phase?: number | null
  estimatedReadingMinutes?: number | null
  orderIndex: number
  published: boolean
  publishedAt?: Date | null
  createdAt: Date
  category: ArticleCategory
  _count: {
    roadmapAssignments: number
    progress: number
  }
}

export default function ArticlesPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  // Filters
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterPhase, setFilterPhase] = useState<string>('all')
  const [filterPublished, setFilterPublished] = useState<string>('all')

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    categoryId: ''
  })

  useEffect(() => {
    if (session?.user) {
      fetchArticles()
      fetchCategories()
    }
  }, [session])

  const fetchArticles = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/articles')
      if (response.ok) {
        const data = await response.json()
        setArticles(data.articles)
      } else {
        toast.error('Kunde inte hämta artiklar')
      }
    } catch (error) {
      console.error('Error fetching articles:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/article-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const handleCreateArticle = async () => {
    if (!formData.title || !formData.slug || !formData.categoryId) {
      toast.error('Alla fält krävs')
      return
    }

    try {
      setIsSaving(true)
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, published: false })
      })

      if (response.ok) {
        const data = await response.json()
        toast.success('Artikel skapad')
        setIsCreateDialogOpen(false)
        setFormData({ title: '', slug: '', categoryId: '' })
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

  const handleDeleteArticle = async (article: Article) => {
    if (!confirm(`Är du säker på att du vill radera "${article.title}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        toast.success('Artikel raderad')
        fetchArticles()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte radera artikel')
      }
    } catch (error) {
      console.error('Error deleting article:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleTogglePublished = async (article: Article) => {
    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ published: !article.published })
      })

      if (response.ok) {
        toast.success(article.published ? 'Artikel avpublicerad' : 'Artikel publicerad')
        fetchArticles()
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

  const handleMoveArticle = async (article: Article, direction: 'up' | 'down') => {
    const currentIndex = filteredArticles.findIndex(a => a.id === article.id)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === filteredArticles.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const otherArticle = filteredArticles[newIndex]

    try {
      // Swap orderIndex values
      await Promise.all([
        fetch(`/api/articles/${article.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: otherArticle.orderIndex })
        }),
        fetch(`/api/articles/${otherArticle.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: article.orderIndex })
        })
      ])

      fetchArticles()
    } catch (error) {
      console.error('Error moving article:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const filteredArticles = articles.filter(article => {
    if (filterCategory !== 'all' && article.categoryId !== filterCategory) return false
    if (filterPhase !== 'all' && article.phase?.toString() !== filterPhase) return false
    if (filterPublished !== 'all' && article.published.toString() !== filterPublished) return false
    return true
  })

  // Group articles by category
  const articlesByCategory = filteredArticles.reduce((acc, article) => {
    const categoryId = article.categoryId
    if (!acc[categoryId]) {
      acc[categoryId] = {
        category: article.category,
        articles: []
      }
    }
    acc[categoryId].articles.push(article)
    return acc
  }, {} as Record<string, { category: ArticleCategory; articles: Article[] }>)

  const categoryGroups = Object.values(articlesByCategory)

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Du har inte behörighet att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Artiklar</h1>
          <p className="text-muted-foreground mt-1">
            Skapa och hantera artiklar för artikel banken
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Ny artikel
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-gradient-to-br from-[#1a0933]/50 to-[#0a0a0a]/50 border-[rgba(255,215,0,0.2)]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-[#FFD700]" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Kategori</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alla kategorier</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Fas</Label>
                <Select value={filterPhase} onValueChange={setFilterPhase}>
                  <SelectTrigger>
                    <SelectValue />
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
                <Label className="text-xs">Status</Label>
                <Select value={filterPublished} onValueChange={setFilterPublished}>
                  <SelectTrigger>
                    <SelectValue />
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
          <Card className="bg-gradient-to-br from-[#1a0933]/50 to-[#0a0a0a]/50 border-[rgba(255,215,0,0.2)]">
            <CardContent className="py-8">
              <p className="text-[rgba(255,255,255,0.6)] text-center">Laddar...</p>
            </CardContent>
          </Card>
        ) : filteredArticles.length === 0 ? (
          <Card className="bg-gradient-to-br from-[#1a0933]/50 to-[#0a0a0a]/50 border-[rgba(255,215,0,0.2)]">
            <CardContent className="py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
                <p className="text-[rgba(255,255,255,0.7)]">Inga artiklar ännu.</p>
                <p className="text-sm text-[rgba(255,255,255,0.5)] mt-1">
                  Skapa din första artikel för att komma igång.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          categoryGroups.map((group) => (
            <Card
              key={group.category.id}
              className="overflow-hidden bg-gradient-to-br from-[#1a0933]/50 to-[#0a0a0a]/50 border-[rgba(255,215,0,0.2)]"
            >
              <CardHeader
                className="border-b border-[rgba(255,215,0,0.2)]"
                style={{
                  background: `linear-gradient(to right, ${group.category.color}1a, transparent)`
                }}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-8 rounded-full shadow-lg"
                      style={{
                        backgroundColor: group.category.color || '#FFD700',
                        boxShadow: `0 0 10px ${group.category.color}40`
                      }}
                    />
                    <span className="text-[rgba(255,255,255,0.9)] uppercase tracking-[1px] font-semibold">
                      {group.category.name}
                    </span>
                    <Badge
                      className="bg-[rgba(255,215,0,0.15)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]"
                    >
                      {group.articles.length}
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Titel</TableHead>
                      <TableHead>Fas</TableHead>
                      <TableHead>Svårighetsgrad</TableHead>
                      <TableHead>Tid</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.articles.map((article, index) => (
                      <TableRow key={article.id}>
                        <TableCell className="font-medium">{article.title}</TableCell>
                        <TableCell>
                          {article.phase ? `Fas ${article.phase}` : '-'}
                        </TableCell>
                        <TableCell>
                          {article.difficulty ? (
                            <Badge variant="secondary">{article.difficulty}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell>
                          {article.estimatedReadingMinutes ? `${article.estimatedReadingMinutes} min` : '-'}
                        </TableCell>
                        <TableCell>
                          {article.published ? (
                            <Badge className="bg-green-600">Publicerad</Badge>
                          ) : (
                            <Badge variant="secondary">Utkast</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveArticle(article, 'up')}
                              disabled={index === 0}
                            >
                              <ArrowUp className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleMoveArticle(article, 'down')}
                              disabled={index === group.articles.length - 1}
                            >
                              <ArrowDown className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePublished(article)}
                              title={article.published ? 'Avpublicera' : 'Publicera'}
                            >
                              {article.published ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/dashboard/content/articles/${article.id}`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteArticle(article)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa ny artikel</DialogTitle>
            <DialogDescription>
              Lägg till en ny artikel till artikel banken.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="t.ex. Varför protein är viktigt"
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. varfor-protein-ar-viktigt"
              />
            </div>
            <div>
              <Label htmlFor="category">Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Avbryt
            </Button>
            <Button onClick={handleCreateArticle} disabled={isSaving}>
              {isSaving ? 'Skapar...' : 'Skapa artikel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
