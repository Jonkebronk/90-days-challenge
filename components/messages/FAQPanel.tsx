'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, HelpCircle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

interface FaqQuestion {
  id: string
  question: string
  answer: string
  orderIndex: number
}

interface FaqCategory {
  id: string
  name: string
  slug: string
  description: string | null
  orderIndex: number
  questions: FaqQuestion[]
}

const categoryIcons: Record<string, string> = {
  kost: '🍎',
  traning: '🏋️',
  'check-in': '📊',
  allmant: '💬',
  general: '📋',
  nutrition: '🥗',
  training: '💪'
}

export function FAQPanel() {
  const [categories, setCategories] = useState<FaqCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      const response = await fetch('/api/faq-categories')
      if (response.ok) {
        const data = await response.json()
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
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null)
      setExpandedQuestion(null)
    } else {
      setExpandedCategory(categoryId)
      setExpandedQuestion(null)
    }
  }

  const toggleQuestion = (questionId: string) => {
    setExpandedQuestion(expandedQuestion === questionId ? null : questionId)
  }

  if (loading || categories.length === 0) {
    return null
  }

  return (
    <div className="relative">
      {/* Toggle Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 border-2 ${
          isOpen
            ? 'border-gold-primary bg-gold-primary/10 text-gold-primary'
            : 'border-gray-300 text-gray-600 hover:border-gold-primary hover:text-gold-primary'
        }`}
      >
        <HelpCircle className="w-4 h-4" />
        <span className="hidden sm:inline">FAQ</span>
      </Button>

      {/* FAQ Panel Dropdown */}
      {isOpen && (
        <Card className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 max-h-[70vh] overflow-hidden bg-white border-2 border-gray-200 shadow-xl z-50 rounded-xl">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-amber-50 to-orange-50">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-amber-600" />
              <span className="font-semibold text-gray-900">Vanliga frågor</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-white/50 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[60vh]">
            {categories
              .sort((a, b) => a.orderIndex - b.orderIndex)
              .map(category => (
                <div key={category.id} className="border-b border-gray-100 last:border-b-0">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(category.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{categoryIcons[category.slug] || '📋'}</span>
                      <span className="font-medium text-gray-900">
                        {category.name}
                      </span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                        expandedCategory === category.id ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Questions */}
                  {expandedCategory === category.id && (
                    <div className="bg-gray-50 px-4 pb-3">
                      {category.questions
                        .sort((a, b) => a.orderIndex - b.orderIndex)
                        .map(faq => (
                          <div key={faq.id} className="mt-2">
                            {/* Question */}
                            <button
                              onClick={() => toggleQuestion(faq.id)}
                              className={`w-full text-left p-3 rounded-lg transition-all ${
                                expandedQuestion === faq.id
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-white text-gray-700 hover:bg-amber-50'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <span className="text-sm font-medium">{faq.question}</span>
                                <ChevronDown
                                  className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
                                    expandedQuestion === faq.id ? 'rotate-180 text-amber-600' : 'text-gray-400'
                                  }`}
                                />
                              </div>
                            </button>

                            {/* Answer */}
                            {expandedQuestion === faq.id && (
                              <div className="mt-2 p-3 bg-white rounded-lg border border-amber-200">
                                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                                  {faq.answer}
                                </p>
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))}
          </div>
        </Card>
      )}
    </div>
  )
}

export default FAQPanel
