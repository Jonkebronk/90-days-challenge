'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronRight, HelpCircle, MessageSquare, X } from 'lucide-react'
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

interface FAQPanelProps {
  onSelectAnswer?: (answer: string) => void
  isCoach?: boolean
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

export function FAQPanel({ onSelectAnswer, isCoach = false }: FAQPanelProps) {
  const [categories, setCategories] = useState<FaqCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedCategories, setExpandedCategories] = useState<string[]>([])
  const [selectedFAQ, setSelectedFAQ] = useState<FaqQuestion | null>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    fetchFAQs()
  }, [])

  const fetchFAQs = async () => {
    try {
      // Fetch from the existing FAQ system
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
      }
    } catch (error) {
      console.error('Error fetching FAQs:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    )
  }

  const handleSelectFAQ = (faq: FaqQuestion) => {
    setSelectedFAQ(faq)
  }

  const handleUseAnswer = () => {
    if (selectedFAQ && onSelectAnswer) {
      onSelectAnswer(selectedFAQ.answer)
      setSelectedFAQ(null)
      setIsOpen(false)
    }
  }

  if (loading) {
    return null
  }

  if (categories.length === 0) {
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
        <span className="hidden sm:inline">Vanliga frågor</span>
      </Button>

      {/* FAQ Panel Dropdown */}
      {isOpen && (
        <Card className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 max-h-[400px] overflow-hidden bg-white border-2 border-gray-200 shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-200 bg-gray-50">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gold-primary" />
              <span className="font-semibold text-gray-900">Vanliga frågor</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-200 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[320px]">
            {selectedFAQ ? (
              // Show selected FAQ answer
              <div className="p-4">
                <button
                  onClick={() => setSelectedFAQ(null)}
                  className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-3"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" />
                  Tillbaka
                </button>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="font-medium text-blue-900 text-sm">{selectedFAQ.question}</p>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-3">
                  <p className="text-gray-700 text-sm whitespace-pre-wrap">{selectedFAQ.answer}</p>
                </div>
                <Button
                  onClick={handleUseAnswer}
                  className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-white"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Använd som svar
                </Button>
              </div>
            ) : (
              // Show FAQ categories
              <div className="p-2">
                {categories
                  .sort((a, b) => a.orderIndex - b.orderIndex)
                  .map(category => (
                  <div key={category.id} className="mb-1">
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className="w-full flex items-center justify-between p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{categoryIcons[category.slug] || '📋'}</span>
                        <span className="font-medium text-gray-900 text-sm">
                          {category.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({category.questions.length})
                        </span>
                      </div>
                      {expandedCategories.includes(category.id) ? (
                        <ChevronDown className="w-4 h-4 text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      )}
                    </button>

                    {expandedCategories.includes(category.id) && (
                      <div className="ml-4 mt-1 space-y-1">
                        {category.questions
                          .sort((a, b) => a.orderIndex - b.orderIndex)
                          .map(faq => (
                          <button
                            key={faq.id}
                            onClick={() => handleSelectFAQ(faq)}
                            className="w-full text-left p-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors"
                          >
                            {faq.question}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

export default FAQPanel
