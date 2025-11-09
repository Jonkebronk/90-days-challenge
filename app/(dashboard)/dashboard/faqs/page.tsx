'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'
import { toast } from 'sonner'

type FaqQuestion = {
  id: string
  categoryId: string
  question: string
  answer: string
  orderIndex: number
  published: boolean
}

type FaqCategory = {
  id: string
  name: string
  slug: string
  description: string | null
  orderIndex: number
  questions: FaqQuestion[]
}

export default function ClientFaqsPage() {
  const [categories, setCategories] = useState<FaqCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set())

  useEffect(() => {
    fetchFaqs()
  }, [])

  const fetchFaqs = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/faq-categories')
      if (response.ok) {
        const data = await response.json()
        // Fetch questions for each category
        const categoriesWithQuestions = await Promise.all(
          data.categories.map(async (cat: FaqCategory) => {
            const qResponse = await fetch(`/api/faq-categories/${cat.id}`)
            if (qResponse.ok) {
              const qData = await qResponse.json()
              return qData.category
            }
            return cat
          })
        )
        setCategories(categoriesWithQuestions.filter(cat => cat.questions && cat.questions.length > 0))
      } else {
        toast.error('Kunde inte hämta vanliga frågor')
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestions((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(questionId)) {
        newSet.delete(questionId)
      } else {
        newSet.add(questionId)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-[rgba(255,255,255,0.8)]">Laddar vanliga frågor...</p>
          </div>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] rounded-xl p-12 backdrop-blur-[10px] text-center">
          <HelpCircle className="h-16 w-16 mx-auto text-[rgba(255,215,0,0.5)] mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Inga vanliga frågor än</h2>
          <p className="text-[rgba(255,255,255,0.6)]">
            Din coach har inte lagt till några vanliga frågor än.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header - Centrerad som Kostschema */}
      <div className="relative text-center py-8 bg-gradient-to-br from-[rgba(255,215,0,0.05)] to-transparent border-2 border-[rgba(255,215,0,0.2)] rounded-xl backdrop-blur-[10px]">
        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent tracking-[1px]">
          VANLIGA FRÅGOR
        </h1>
        <p className="text-[rgba(255,255,255,0.6)] mt-2">
          Svar på vanliga frågor om träning, kost och mer
        </p>
      </div>

      {/* FAQ Categories */}
      {categories
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((category) => (
          <div key={category.id} className="space-y-4">
            {/* Category Header */}
            <div>
              <h2 className="text-2xl font-bold text-white">{category.name}</h2>
              {category.description && (
                <p className="text-[rgba(255,255,255,0.6)] mt-1">{category.description}</p>
              )}
            </div>

            {/* Questions */}
            <div className="space-y-3">
              {category.questions
                .sort((a, b) => a.orderIndex - b.orderIndex)
                .map((question) => {
                  const isExpanded = expandedQuestions.has(question.id)

                  return (
                    <Card
                      key={question.id}
                      className="bg-gradient-to-br from-[#3b82f6] to-[#2563eb] border-none cursor-pointer hover:from-[#2563eb] hover:to-[#1d4ed8] transition-all"
                      onClick={() => toggleQuestion(question.id)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-white flex-1 pr-4">
                            {question.question}
                          </h3>
                          {isExpanded ? (
                            <ChevronUp className="h-5 w-5 text-white flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-white flex-shrink-0" />
                          )}
                        </div>
                        {isExpanded && (
                          <div className="mt-4 pt-4 border-t border-[rgba(255,255,255,0.2)]">
                            <p className="text-white whitespace-pre-wrap">{question.answer}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
            </div>

            {/* "se fler..." link if needed */}
            {category.questions.length > 5 && (
              <p className="text-sm text-[rgba(255,255,255,0.6)] italic">se fler...</p>
            )}
          </div>
        ))}
    </div>
  )
}
