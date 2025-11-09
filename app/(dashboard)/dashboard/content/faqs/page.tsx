'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  HelpCircle,
  Pencil,
  Trash2,
  FolderPlus,
} from 'lucide-react'
import { toast } from 'sonner'

type FaqCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  orderIndex: number
  _count?: {
    questions: number
  }
}

type FaqQuestion = {
  id: string
  categoryId: string
  question: string
  answer: string
  orderIndex: number
  published: boolean
  category: {
    id: string
    name: string
  }
}

export default function FaqsPage() {
  const { data: session } = useSession()
  const [categories, setCategories] = useState<FaqCategory[]>([])
  const [questions, setQuestions] = useState<FaqQuestion[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false)
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<FaqCategory | null>(null)
  const [editingQuestion, setEditingQuestion] = useState<FaqQuestion | null>(null)
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all')

  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    description: '',
    orderIndex: '',
  })

  const [questionFormData, setQuestionFormData] = useState({
    categoryId: '',
    question: '',
    answer: '',
    orderIndex: '',
    published: true,
  })

  useEffect(() => {
    if (session?.user) {
      fetchCategories()
      fetchQuestions()
    }
  }, [session])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/faq-categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories)
      } else {
        toast.error('Kunde inte hämta kategorier')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const fetchQuestions = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/faq-questions')
      if (response.ok) {
        const data = await response.json()
        setQuestions(data.questions)
      } else {
        toast.error('Kunde inte hämta frågor')
      }
    } catch (error) {
      console.error('Error fetching questions:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateCategory = async () => {
    if (!categoryFormData.name) {
      toast.error('Namn krävs')
      return
    }

    try {
      const response = await fetch('/api/faq-categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryFormData.name,
          description: categoryFormData.description || null,
          orderIndex: categoryFormData.orderIndex ? parseInt(categoryFormData.orderIndex) : 0,
        }),
      })

      if (response.ok) {
        toast.success('Kategori skapad')
        setIsCategoryDialogOpen(false)
        setCategoryFormData({ name: '', description: '', orderIndex: '' })
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa kategori')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      const response = await fetch(`/api/faq-categories/${editingCategory.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: categoryFormData.name,
          description: categoryFormData.description || null,
          orderIndex: categoryFormData.orderIndex ? parseInt(categoryFormData.orderIndex) : 0,
        }),
      })

      if (response.ok) {
        toast.success('Kategori uppdaterad')
        setIsCategoryDialogOpen(false)
        setEditingCategory(null)
        setCategoryFormData({ name: '', description: '', orderIndex: '' })
        fetchCategories()
      } else {
        toast.error('Kunde inte uppdatera kategori')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteCategory = async (category: FaqCategory) => {
    if (!confirm(`Är du säker på att du vill ta bort kategorin "${category.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/faq-categories/${category.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Kategori borttagen')
        fetchCategories()
        fetchQuestions()
      } else {
        toast.error('Kunde inte ta bort kategori')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleCreateQuestion = async () => {
    if (!questionFormData.categoryId || !questionFormData.question || !questionFormData.answer) {
      toast.error('Kategori, fråga och svar krävs')
      return
    }

    try {
      const response = await fetch('/api/faq-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: questionFormData.categoryId,
          question: questionFormData.question,
          answer: questionFormData.answer,
          orderIndex: questionFormData.orderIndex ? parseInt(questionFormData.orderIndex) : 0,
          published: questionFormData.published,
        }),
      })

      if (response.ok) {
        toast.success('Fråga skapad')
        setIsQuestionDialogOpen(false)
        setQuestionFormData({
          categoryId: '',
          question: '',
          answer: '',
          orderIndex: '',
          published: true,
        })
        fetchQuestions()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Kunde inte skapa fråga')
      }
    } catch (error) {
      console.error('Error creating question:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleUpdateQuestion = async () => {
    if (!editingQuestion) return

    try {
      const response = await fetch(`/api/faq-questions/${editingQuestion.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: questionFormData.categoryId,
          question: questionFormData.question,
          answer: questionFormData.answer,
          orderIndex: questionFormData.orderIndex ? parseInt(questionFormData.orderIndex) : 0,
          published: questionFormData.published,
        }),
      })

      if (response.ok) {
        toast.success('Fråga uppdaterad')
        setIsQuestionDialogOpen(false)
        setEditingQuestion(null)
        setQuestionFormData({
          categoryId: '',
          question: '',
          answer: '',
          orderIndex: '',
          published: true,
        })
        fetchQuestions()
      } else {
        toast.error('Kunde inte uppdatera fråga')
      }
    } catch (error) {
      console.error('Error updating question:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const handleDeleteQuestion = async (question: FaqQuestion) => {
    if (!confirm(`Är du säker på att du vill ta bort frågan "${question.question}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/faq-questions/${question.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Fråga borttagen')
        fetchQuestions()
      } else {
        toast.error('Kunde inte ta bort fråga')
      }
    } catch (error) {
      console.error('Error deleting question:', error)
      toast.error('Ett fel uppstod')
    }
  }

  const openEditCategoryDialog = (category: FaqCategory) => {
    setEditingCategory(category)
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      orderIndex: category.orderIndex.toString(),
    })
    setIsCategoryDialogOpen(true)
  }

  const openEditQuestionDialog = (question: FaqQuestion) => {
    setEditingQuestion(question)
    setQuestionFormData({
      categoryId: question.categoryId,
      question: question.question,
      answer: question.answer,
      orderIndex: question.orderIndex.toString(),
      published: question.published,
    })
    setIsQuestionDialogOpen(true)
  }

  const filteredQuestions = selectedCategoryFilter === 'all'
    ? questions
    : questions.filter(q => q.categoryId === selectedCategoryFilter)

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
            VANLIGA FRÅGOR
          </h1>
          <p className="text-[rgba(255,255,255,0.6)] mt-1">
            Hantera FAQ-kategorier och frågor
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => {
              setEditingCategory(null)
              setCategoryFormData({ name: '', description: '', orderIndex: '' })
              setIsCategoryDialogOpen(true)
            }}
            className="bg-transparent border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
          >
            <FolderPlus className="h-4 w-4 mr-2" />
            Ny kategori
          </Button>
          <Button
            onClick={() => {
              setEditingQuestion(null)
              setQuestionFormData({
                categoryId: categories[0]?.id || '',
                question: '',
                answer: '',
                orderIndex: '',
                published: true,
              })
              setIsQuestionDialogOpen(true)
            }}
            className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            disabled={categories.length === 0}
          >
            <Plus className="h-4 w-4 mr-2" />
            Ny fråga
          </Button>
        </div>
      </div>

      {/* Categories Overview */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-[#FFD700]">Kategorier</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderPlus className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)]">Inga kategorier än. Skapa din första kategori!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="p-4 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.2)] rounded-lg hover:border-[rgba(255,215,0,0.4)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-white">{category.name}</h3>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditCategoryDialog(category)}
                        className="h-8 w-8 text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteCategory(category)}
                        className="h-8 w-8 text-[rgba(255,255,255,0.6)] hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {category.description && (
                    <p className="text-sm text-[rgba(255,255,255,0.6)] mb-2">{category.description}</p>
                  )}
                  <Badge className="bg-[rgba(255,215,0,0.1)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]">
                    {category._count?.questions || 0} frågor
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Questions List */}
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-[#FFD700]">Frågor</CardTitle>
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
              <SelectTrigger className="w-48 bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                <SelectItem value="all" className="text-white hover:bg-[rgba(255,215,0,0.1)]">
                  Alla kategorier
                </SelectItem>
                {categories.map((cat) => (
                  <SelectItem
                    key={cat.id}
                    value={cat.id}
                    className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                  >
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-[rgba(255,255,255,0.6)] py-8">Laddar...</p>
          ) : filteredQuestions.length === 0 ? (
            <div className="text-center py-8">
              <HelpCircle className="h-12 w-12 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
              <p className="text-[rgba(255,255,255,0.6)]">
                {selectedCategoryFilter === 'all'
                  ? 'Inga frågor än. Skapa din första fråga!'
                  : 'Inga frågor i denna kategori än.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredQuestions.map((question) => (
                <div
                  key={question.id}
                  className="p-4 bg-[rgba(0,0,0,0.3)] border border-[rgba(255,215,0,0.2)] rounded-lg hover:border-[rgba(255,215,0,0.4)] transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge className="bg-[rgba(100,100,255,0.1)] text-blue-300 border border-[rgba(100,100,255,0.3)] text-xs">
                          {question.category.name}
                        </Badge>
                        {!question.published && (
                          <Badge className="bg-[rgba(150,150,150,0.1)] text-gray-400 border border-[rgba(150,150,150,0.3)] text-xs">
                            Opublicerad
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-bold text-white mb-2">{question.question}</h4>
                      <p className="text-sm text-[rgba(255,255,255,0.6)] line-clamp-2">
                        {question.answer}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditQuestionDialog(question)}
                        className="h-8 w-8 text-[rgba(255,255,255,0.6)] hover:text-[#FFD700]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question)}
                        className="h-8 w-8 text-[rgba(255,255,255,0.6)] hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              {editingCategory ? 'Redigera kategori' : 'Skapa kategori'}
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Kategorier hjälper till att organisera vanliga frågor
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="catName" className="text-[rgba(255,255,255,0.8)]">
                Namn *
              </Label>
              <Input
                id="catName"
                value={categoryFormData.name}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, name: e.target.value })}
                placeholder="t.ex. Träning, Kost, Övrigt"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="catDesc" className="text-[rgba(255,255,255,0.8)]">
                Beskrivning
              </Label>
              <Textarea
                id="catDesc"
                value={categoryFormData.description}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, description: e.target.value })}
                rows={2}
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="catOrder" className="text-[rgba(255,255,255,0.8)]">
                Sorteringsordning
              </Label>
              <Input
                id="catOrder"
                type="number"
                value={categoryFormData.orderIndex}
                onChange={(e) => setCategoryFormData({ ...categoryFormData, orderIndex: e.target.value })}
                placeholder="0"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsCategoryDialogOpen(false)}
              className="bg-transparent border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
            >
              Avbryt
            </Button>
            <Button
              onClick={editingCategory ? handleUpdateCategory : handleCreateCategory}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {editingCategory ? 'Uppdatera' : 'Skapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="bg-[rgba(10,10,10,0.95)] border-2 border-[rgba(255,215,0,0.3)] backdrop-blur-[10px] max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
              {editingQuestion ? 'Redigera fråga' : 'Skapa fråga'}
            </DialogTitle>
            <DialogDescription className="text-[rgba(255,255,255,0.6)]">
              Lägg till en vanlig fråga med svar
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="qCategory" className="text-[rgba(255,255,255,0.8)]">
                Kategori *
              </Label>
              <Select
                value={questionFormData.categoryId}
                onValueChange={(value) => setQuestionFormData({ ...questionFormData, categoryId: value })}
              >
                <SelectTrigger className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white">
                  <SelectValue placeholder="Välj kategori" />
                </SelectTrigger>
                <SelectContent className="bg-[rgba(10,10,10,0.95)] border-[rgba(255,215,0,0.3)]">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="text-white hover:bg-[rgba(255,215,0,0.1)]"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="qQuestion" className="text-[rgba(255,255,255,0.8)]">
                Fråga *
              </Label>
              <Textarea
                id="qQuestion"
                value={questionFormData.question}
                onChange={(e) => setQuestionFormData({ ...questionFormData, question: e.target.value })}
                rows={2}
                placeholder="Kan man byta powerwalk mot HIIT?"
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div>
              <Label htmlFor="qAnswer" className="text-[rgba(255,255,255,0.8)]">
                Svar *
              </Label>
              <Textarea
                id="qAnswer"
                value={questionFormData.answer}
                onChange={(e) => setQuestionFormData({ ...questionFormData, answer: e.target.value })}
                rows={5}
                placeholder="Skriv ett detaljerat svar..."
                className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qOrder" className="text-[rgba(255,255,255,0.8)]">
                  Sorteringsordning
                </Label>
                <Input
                  id="qOrder"
                  type="number"
                  value={questionFormData.orderIndex}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, orderIndex: e.target.value })}
                  placeholder="0"
                  className="bg-[rgba(0,0,0,0.3)] border-[rgba(255,215,0,0.3)] text-white"
                />
              </div>
              <div className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  id="qPublished"
                  checked={questionFormData.published}
                  onChange={(e) => setQuestionFormData({ ...questionFormData, published: e.target.checked })}
                  className="w-4 h-4"
                />
                <Label htmlFor="qPublished" className="text-[rgba(255,255,255,0.8)] cursor-pointer">
                  Publicerad
                </Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsQuestionDialogOpen(false)}
              className="bg-transparent border border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
            >
              Avbryt
            </Button>
            <Button
              onClick={editingQuestion ? handleUpdateQuestion : handleCreateQuestion}
              className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] text-[#0a0a0a] font-bold hover:scale-105 transition-transform"
            >
              {editingQuestion ? 'Uppdatera' : 'Skapa'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
