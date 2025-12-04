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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Laddar vanliga frågor...</p>
        </div>
      </div>
    )
  }

  if (categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center mb-6 sm:mb-8">
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
          <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
            Vanliga Frågor
          </h1>
          <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-12 text-center">
          <HelpCircle className="h-16 w-16 mx-auto text-gold-primary mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Inga vanliga frågor än</h2>
          <p className="text-gray-600">
            Din coach har inte lagt till några vanliga frågor än.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center mb-6 sm:mb-8">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-4 sm:mb-6 opacity-30" />
        <h1 className="font-['Orbitron',sans-serif] text-2xl sm:text-3xl md:text-4xl font-black tracking-[2px] sm:tracking-[3px] uppercase bg-gradient-to-br from-gold-light to-orange-500 bg-clip-text text-transparent mb-3 sm:mb-4">
          Vanliga Frågor
        </h1>
        <p className="text-gray-400 text-xs sm:text-sm tracking-[1px]">
          Svar på vanliga frågor om träning, kost och mer
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-4 sm:mt-6 opacity-30" />
      </div>

      <div className="max-w-4xl mx-auto space-y-8">
        {/* FAQ Categories */}
        {categories
          .sort((a, b) => a.orderIndex - b.orderIndex)
          .map((category, index) => (
            <div key={category.id} className="space-y-4">
              {/* Separator line between categories */}
              {index > 0 && (
                <div className="h-[1px] bg-gradient-to-r from-transparent via-gold-primary/30 to-transparent mb-6" />
              )}
              {/* Category Header */}
              <div className="mb-2">
                <h2 className="text-xl font-bold text-gold-light uppercase tracking-wide">{category.name}</h2>
                {category.description && (
                  <p className="text-gray-400 mt-1 text-sm">{category.description}</p>
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
                        className="bg-white border border-gray-200 cursor-pointer hover:border-gold-primary hover:shadow-lg transition-all"
                        onClick={() => toggleQuestion(question.id)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-gray-900 flex-1 pr-4">
                              {question.question}
                            </h3>
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-gold-primary flex-shrink-0" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-gold-primary flex-shrink-0" />
                            )}
                          </div>
                          {isExpanded && (
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <p className="text-gray-700 whitespace-pre-wrap">{question.answer}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )
                  })}
              </div>

              {/* "se fler..." link if needed */}
              {category.questions.length > 5 && (
                <p className="text-sm text-gray-500 italic">se fler...</p>
              )}
            </div>
          ))}
      </div>
    </div>
  )
}
