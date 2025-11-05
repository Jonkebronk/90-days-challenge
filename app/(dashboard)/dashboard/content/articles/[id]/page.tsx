'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ArrowLeft, Save, Eye, EyeOff, Plus, X, Upload, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { MDXPreview } from '@/components/mdx-preview'

type ArticleCategory = {
  id: string
  name: string
}

type Article = {
  id: string
  title: string
  content: string
  slug: string
  categoryId: string
  tags: string[]
  difficulty?: string | null
  phase?: number | null
  estimatedReadingMinutes?: number | null
  coverImage?: string | null
  published: boolean
  category: ArticleCategory
}

export default function ArticleEditorPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const params = useParams()
  const articleId = params.id as string

  const [article, setArticle] = useState<Article | null>(null)
  const [categories, setCategories] = useState<ArticleCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit')

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    slug: '',
    categoryId: '',
    tags: [] as string[],
    difficulty: '',
    phase: '',
    estimatedReadingMinutes: '',
    coverImage: '',
    published: false
  })

  const [newTag, setNewTag] = useState('')
  const [isImporting, setIsImporting] = useState(false)

  const handleFileImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['.docx', '.pdf', '.txt']
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!validTypes.includes(fileExt)) {
      toast.error('Ogiltig filtyp. Vänligen ladda upp .docx, .pdf eller .txt filer.')
      return
    }

    setIsImporting(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await fetch('/api/articles/extract-text', {
        method: 'POST',
        body: formData
      })

      if (response.ok) {
        const data = await response.json()

        // Update form with extracted content
        setFormData(prev => ({
          ...prev,
          title: prev.title || data.title, // Only set title if empty
          content: data.text,
          slug: prev.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        }))

        toast.success(`Innehåll importerat från ${file.name}`)
      } else {
        const error = await response.json()
        toast.error(error.error || 'Kunde inte importera filen')
      }
    } catch (error) {
      console.error('Error importing file:', error)
      toast.error('Ett fel uppstod vid import av filen')
    } finally {
      setIsImporting(false)
      // Reset file input
      event.target.value = ''
    }
  }

  // Auto-save to localStorage on formData change
  useEffect(() => {
    if (!isLoading && article) {
      const draftKey = `article-draft-${articleId}`
      localStorage.setItem(draftKey, JSON.stringify(formData))
    }
  }, [formData, isLoading, article, articleId])

  useEffect(() => {
    if (session?.user) {
      fetchArticle()
      fetchCategories()
    }
  }, [session, articleId])

  const fetchArticle = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/articles/${articleId}`)
      if (response.ok) {
        const data = await response.json()
        setArticle(data.article)

        // Check for draft in localStorage
        const draftKey = `article-draft-${articleId}`
        const savedDraft = localStorage.getItem(draftKey)

        if (savedDraft) {
          const draft = JSON.parse(savedDraft)
          // Only use draft if it's different from saved version
          if (draft.content !== data.article.content || draft.title !== data.article.title) {
            toast.info('Utkast återställt från senaste redigering', { duration: 3000 })
            setFormData(draft)
          } else {
            // Draft is same as saved, clear it
            localStorage.removeItem(draftKey)
            setFormData({
              title: data.article.title,
              content: data.article.content,
              slug: data.article.slug,
              categoryId: data.article.categoryId,
              tags: data.article.tags || [],
              difficulty: data.article.difficulty || '',
              phase: data.article.phase?.toString() || '',
              estimatedReadingMinutes: data.article.estimatedReadingMinutes?.toString() || '',
              coverImage: data.article.coverImage || '',
              published: data.article.published
            })
          }
        } else {
          setFormData({
            title: data.article.title,
            content: data.article.content,
            slug: data.article.slug,
            categoryId: data.article.categoryId,
            tags: data.article.tags || [],
            difficulty: data.article.difficulty || '',
            phase: data.article.phase?.toString() || '',
            estimatedReadingMinutes: data.article.estimatedReadingMinutes?.toString() || '',
            coverImage: data.article.coverImage || '',
            published: data.article.published
          })
        }
      } else {
        toast.error('Kunde inte hämta artikel')
        router.push('/dashboard/content/articles')
      }
    } catch (error) {
      console.error('Error fetching article:', error)
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

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phase: formData.phase ? parseInt(formData.phase) : null,
          estimatedReadingMinutes: formData.estimatedReadingMinutes
            ? parseInt(formData.estimatedReadingMinutes)
            : null
        })
      })

      if (response.ok) {
        // Clear draft from localStorage after successful save
        const draftKey = `article-draft-${articleId}`
        localStorage.removeItem(draftKey)

        toast.success('Artikel sparad')
        fetchArticle()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte spara artikel')
      }
    } catch (error) {
      console.error('Error saving article:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsSaving(false)
    }
  }

  const handleTogglePublished = async () => {
    try {
      const newPublished = !formData.published

      // First save all content, then toggle published status
      const response = await fetch(`/api/articles/${articleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phase: formData.phase ? parseInt(formData.phase) : null,
          estimatedReadingMinutes: formData.estimatedReadingMinutes
            ? parseInt(formData.estimatedReadingMinutes)
            : null,
          published: newPublished
        })
      })

      if (response.ok) {
        toast.success(newPublished ? 'Artikel sparad och publicerad' : 'Artikel sparad och avpublicerad')
        setFormData({ ...formData, published: newPublished })
        fetchArticle()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte uppdatera artikel')
      }
    } catch (error) {
      console.error('Error toggling published:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleAddTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData({ ...formData, tags: [...formData.tags, newTag] })
      setNewTag('')
    }
  }

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) })
  }

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

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <p className="text-muted-foreground">Laddar...</p>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Artikel hittades inte.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/dashboard/content/articles')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Tillbaka
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{article.title}</h1>
            <p className="text-sm text-muted-foreground">
              {article.category.name}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTogglePublished}
          >
            {formData.published ? (
              <>
                <EyeOff className="h-4 w-4 mr-2" />
                Avpublicera
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 mr-2" />
                Publicera
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Sparar...' : 'Spara'}
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category">Kategori</Label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              >
                <SelectTrigger>
                  <SelectValue />
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
            <div>
              <Label htmlFor="phase">Fas</Label>
              <Select
                value={formData.phase || 'none'}
                onValueChange={(value) => setFormData({ ...formData, phase: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj fas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen fas</SelectItem>
                  <SelectItem value="1">Fas 1 (1-30 dagar)</SelectItem>
                  <SelectItem value="2">Fas 2 (31-60 dagar)</SelectItem>
                  <SelectItem value="3">Fas 3 (61-90 dagar)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="difficulty">Svårighetsgrad</Label>
              <Select
                value={formData.difficulty || 'none'}
                onValueChange={(value) => setFormData({ ...formData, difficulty: value === 'none' ? '' : value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Välj nivå" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Ingen nivå</SelectItem>
                  <SelectItem value="beginner">Nybörjare</SelectItem>
                  <SelectItem value="intermediate">Medel</SelectItem>
                  <SelectItem value="advanced">Avancerad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="readingTime">Läsningstid (minuter)</Label>
              <Input
                id="readingTime"
                type="number"
                value={formData.estimatedReadingMinutes}
                onChange={(e) => setFormData({ ...formData, estimatedReadingMinutes: e.target.value })}
                placeholder="t.ex. 5"
              />
            </div>
            <div>
              <Label htmlFor="coverImage">Omslagsbild URL</Label>
              <Input
                id="coverImage"
                value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
          </div>

          {/* Tags */}
          <div>
            <Label>Taggar</Label>
            <div className="flex flex-wrap gap-2 mt-2 mb-3">
              {formData.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveTag(tag)}
                  />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddTag()
                  }
                }}
                placeholder="Lägg till tagg..."
              />
              <Button variant="outline" onClick={handleAddTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Innehåll</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'edit' | 'preview')}>
            <TabsList className="grid w-full grid-cols-2 max-w-md mb-4">
              <TabsTrigger value="edit">Redigera</TabsTrigger>
              <TabsTrigger value="preview">Förhandsgranska</TabsTrigger>
            </TabsList>

            <TabsContent value="edit">
              {/* File Import Section */}
              <div className="mb-4 p-4 bg-gradient-to-r from-[rgba(255,215,0,0.05)] to-[rgba(255,215,0,0.02)] border-2 border-[rgba(255,215,0,0.2)] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-[#FFD700]" />
                    <h3 className="font-semibold text-[#FFD700]">Importera innehåll från fil</h3>
                  </div>
                </div>
                <p className="text-sm text-[rgba(255,255,255,0.6)] mb-3">
                  Ladda upp ett Word-dokument (.docx), PDF (.pdf) eller textfil (.txt) för att importera innehållet
                </p>
                <div className="flex items-center gap-3">
                  <label htmlFor="file-import" className="cursor-pointer">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isImporting}
                      className="border-[rgba(255,215,0,0.4)] hover:bg-[rgba(255,215,0,0.1)] text-[#FFD700]"
                      onClick={() => document.getElementById('file-import')?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isImporting ? 'Importerar...' : 'Välj fil'}
                    </Button>
                    <input
                      id="file-import"
                      type="file"
                      accept=".docx,.pdf,.txt"
                      onChange={handleFileImport}
                      className="hidden"
                    />
                  </label>
                  <span className="text-xs text-[rgba(255,255,255,0.5)]">
                    .docx, .pdf, .txt
                  </span>
                </div>
              </div>

              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Skriv artikelinnehåll här med MDX-formatering... eller importera från fil ovan"
                className="min-h-[500px] font-mono"
              />
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">MDX Tips:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li># för rubriker (H1)</li>
                  <li>## för underrubriker (H2)</li>
                  <li>**text** för fet text</li>
                  <li>*text* för kursiv text</li>
                  <li>[länktext](url) för länkar</li>
                  <li>- för punktlistor</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="preview">
              <div className="min-h-[500px] border rounded-lg p-6 bg-white">
                <div className="prose prose-lg max-w-none">
                  <MDXPreview content={formData.content} />
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
