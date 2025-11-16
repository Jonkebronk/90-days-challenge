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
  orderIndex: number
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
      const response = await fetch('/api/articles', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
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
        const data = await response.json()
        toast.success(article.published ? 'Artikel avpublicerad' : 'Artikel publicerad')

        // Update only the specific article in state to preserve scroll position
        setArticles(prevArticles =>
          prevArticles.map(a =>
            a.id === article.id ? { ...a, published: data.article.published } : a
          )
        )
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
    // Get ALL articles in the same category (not just filtered ones)
    const categoryArticles = articles
      .filter(a => a.categoryId === article.categoryId)
      .sort((a, b) => a.orderIndex - b.orderIndex)

    console.log('Moving article:', article.title, 'Direction:', direction)
    console.log('Category articles:', categoryArticles.map(a => ({ title: a.title, order: a.orderIndex })))

    const currentIndex = categoryArticles.findIndex(a => a.id === article.id)
    console.log('Current index:', currentIndex)

    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categoryArticles.length - 1)
    ) {
      console.log('Cannot move - at boundary')
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const otherArticle = categoryArticles[newIndex]

    console.log('Swapping with:', otherArticle.title, 'orderIndex:', otherArticle.orderIndex)

    try {
      toast.loading('Flyttar artikel...')

      // Swap orderIndex values
      const results = await Promise.all([
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

      console.log('API responses:', results.map(r => r.status))

      await fetchArticles()
      toast.dismiss()
      toast.success('Artikel flyttad')
    } catch (error) {
      console.error('Error moving article:', error)
      toast.dismiss()
      toast.error('Ett fel uppstod vid flytt av artikel')
    }
  }

  const handleMoveCategory = async (category: ArticleCategory, direction: 'up' | 'down') => {
    const currentIndex = categories.findIndex(c => c.id === category.id)
    if (
      (direction === 'up' && currentIndex === 0) ||
      (direction === 'down' && currentIndex === categories.length - 1)
    ) {
      return
    }

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
    const otherCategory = categories[newIndex]

    try {
      // Swap orderIndex values
      await Promise.all([
        fetch(`/api/article-categories/${category.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: otherCategory.orderIndex })
        }),
        fetch(`/api/article-categories/${otherCategory.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderIndex: category.orderIndex })
        })
      ])

      fetchCategories()
      fetchArticles()
    } catch (error) {
      console.error('Error moving category:', error)
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

  // Sort articles within each category by orderIndex
  Object.values(articlesByCategory).forEach(group => {
    group.articles.sort((a, b) => a.orderIndex - b.orderIndex)
  })

  // Sort category groups by category orderIndex
  const categoryGroups = Object.values(articlesByCategory).sort((a, b) =>
    a.category.orderIndex - b.category.orderIndex
  )

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-white border border-gray-200">
          <CardContent className="p-6">
            <p className="text-gray-600">Du har inte behörighet att se denna sida.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Skapa Artiklar</h1>
          <p className="text-gray-600 mt-1">
            Skapa och hantera artiklar för Kunskapsbanken
          </p>
        </div>
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
        >
          <Plus className="h-4 w-4 mr-2" />
          Ny artikel
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Filter className="h-5 w-5 text-gold-primary" />
            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-gray-600 mb-1 block">Kategori</Label>
                <Select value={filterCategory} onValueChange={setFilterCategory}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                    <SelectValue placeholder="Välj kategori" />
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
                <Label className="text-xs text-gray-600 mb-1 block">Fas</Label>
                <Select value={filterPhase} onValueChange={setFilterPhase}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
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
                <Label className="text-xs text-gray-600 mb-1 block">Status</Label>
                <Select value={filterPublished} onValueChange={setFilterPublished}>
                  <SelectTrigger className="bg-white border-gray-300 text-gray-900">
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
          <Card className="bg-white border border-gray-200">
            <CardContent className="py-8">
              <div className="flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
              </div>
            </CardContent>
          </Card>
        ) : filteredArticles.length === 0 ? (
          <Card className="bg-white border border-gray-200">
            <CardContent className="py-8">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto text-gold-primary mb-4" />
                <p className="text-gray-700">Inga artiklar ännu.</p>
                <p className="text-sm text-gray-500 mt-1">
                  Skapa din första artikel för att komma igång.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          categoryGroups.map((group) => {
            const categoryIndex = categories.findIndex(c => c.id === group.category.id)
            return (
            <Card
              key={group.category.id}
              className="overflow-hidden bg-white border border-gray-200"
            >
              <CardHeader
                className="border-b border-gray-200"
                style={{
                  background: `linear-gradient(to right, ${group.category.color}15, transparent)`
                }}
              >
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-1 h-8 rounded-full"
                      style={{
                        backgroundColor: group.category.color || '#D4AF37'
                      }}
                    />
                    <span className="text-gray-900 uppercase tracking-[1px] font-semibold">
                      {group.category.name}
                    </span>
                    <Badge className="bg-gold-primary/10 text-gold-primary border border-gold-primary/30">
                      {group.articles.length}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveCategory(group.category, 'up')}
                      disabled={categoryIndex === 0}
                      className="hover:bg-gray-100"
                    >
                      <ArrowUp className="h-4 w-4 text-gray-600" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleMoveCategory(group.category, 'down')}
                      disabled={categoryIndex === categories.length - 1}
                      className="hover:bg-gray-100"
                    >
                      <ArrowDown className="h-4 w-4 text-gray-600" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-gray-200 hover:bg-transparent">
                      <TableHead className="text-gray-600 font-semibold">Titel</TableHead>
                      <TableHead className="text-gray-600 font-semibold">Fas</TableHead>
                      <TableHead className="text-gray-600 font-semibold">Svårighetsgrad</TableHead>
                      <TableHead className="text-gray-600 font-semibold">Tid</TableHead>
                      <TableHead className="text-gray-600 font-semibold">Status</TableHead>
                      <TableHead className="text-right text-gray-600 font-semibold">Åtgärder</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {group.articles.map((article, index) => (
                      <TableRow key={article.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <TableCell className="font-medium text-gray-900">{article.title}</TableCell>
                        <TableCell className="text-gray-700">
                          {article.phase ? `Fas ${article.phase}` : '-'}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {article.difficulty ? (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-700">{article.difficulty}</Badge>
                          ) : '-'}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {article.estimatedReadingMinutes ? `${article.estimatedReadingMinutes} min` : '-'}
                        </TableCell>
                        <TableCell className="text-gray-700">
                          {article.published ? (
                            <Badge className="bg-green-100 text-green-700 border-green-200">Publicerad</Badge>
                          ) : (
                            <Badge variant="secondary" className="bg-gray-100 text-gray-600">Utkast</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {(() => {
                              // Get position in ALL category articles (not just filtered)
                              const allCategoryArticles = articles
                                .filter(a => a.categoryId === article.categoryId)
                                .sort((a, b) => a.orderIndex - b.orderIndex)
                              const positionInCategory = allCategoryArticles.findIndex(a => a.id === article.id)
                              const isFirst = positionInCategory === 0
                              const isLast = positionInCategory === allCategoryArticles.length - 1

                              return (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleMoveArticle(article, 'up')}
                                    disabled={isFirst}
                                    className="hover:bg-gray-100"
                                  >
                                    <ArrowUp className="h-4 w-4 text-gray-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleMoveArticle(article, 'down')}
                                    disabled={isLast}
                                    className="hover:bg-gray-100"
                                  >
                                    <ArrowDown className="h-4 w-4 text-gray-600" />
                                  </Button>
                                </>
                              )
                            })()}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleTogglePublished(article)}
                              title={article.published ? 'Avpublicera' : 'Publicera'}
                              className="hover:bg-gray-100"
                            >
                              {article.published ? (
                                <EyeOff className="h-4 w-4 text-gray-600" />
                              ) : (
                                <Eye className="h-4 w-4 text-gray-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => router.push(`/dashboard/content/articles/${article.id}`)}
                              className="hover:bg-gray-100"
                            >
                              <Pencil className="h-4 w-4 text-gold-primary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteArticle(article)}
                              className="hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
            )
          })
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="bg-white border border-gray-200">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Skapa ny artikel</DialogTitle>
            <DialogDescription className="text-gray-600">
              Lägg till en ny artikel till artikel banken.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title" className="text-gray-700">Titel *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="t.ex. Varför protein är viktigt"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="slug" className="text-gray-700">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="t.ex. varfor-protein-ar-viktigt"
                className="bg-white border-gray-300 text-gray-900 placeholder:text-gray-400"
              />
            </div>
            <div>
              <Label htmlFor="category" className="text-gray-700">Kategori *</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger className="bg-white border-gray-300 text-gray-900">
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
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Avbryt
            </Button>
            <Button
              onClick={handleCreateArticle}
              disabled={isSaving}
              className="bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white font-semibold"
            >
              {isSaving ? 'Skapar...' : 'Skapa artikel'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
