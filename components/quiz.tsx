'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { CheckCircle2, XCircle } from 'lucide-react'

type QuizOption = {
  text: string
  correct: boolean
  explanation?: string
}

type QuizProps = {
  question: string
  options: QuizOption[]
}

export function Quiz({ question, options }: QuizProps) {
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [showResult, setShowResult] = useState(false)

  const handleSelectOption = (index: number) => {
    setSelectedOption(index)
    setShowResult(true)
  }

  const handleTryAgain = () => {
    setSelectedOption(null)
    setShowResult(false)
  }

  const isCorrect = selectedOption !== null && options[selectedOption]?.correct

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
        <p className="font-medium text-lg">{question}</p>
      </div>

      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selectedOption === index
          const isCorrectOption = option.correct

          let cardClassName = 'p-4 cursor-pointer transition-all border-2 '

          if (!showResult) {
            cardClassName += 'hover:border-blue-500 hover:shadow-md'
          } else {
            if (isSelected) {
              cardClassName += isCorrect
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
            } else if (isCorrectOption) {
              cardClassName += 'border-green-500 bg-green-50'
            } else {
              cardClassName += 'opacity-50'
            }
          }

          return (
            <Card
              key={index}
              className={cardClassName}
              onClick={() => !showResult && handleSelectOption(index)}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-1">
                  {showResult && isCorrectOption && (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  )}
                  {showResult && isSelected && !isCorrect && (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  {!showResult && (
                    <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{option.text}</p>
                  {showResult && option.explanation && (isSelected || isCorrectOption) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {option.explanation}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {showResult && (
        <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
          {isCorrect ? (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">Rätt svar! Bra jobbat!</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              <span className="font-medium">Fel svar. Försök igen!</span>
            </div>
          )}
          {!isCorrect && (
            <Button variant="outline" size="sm" onClick={handleTryAgain}>
              Försök igen
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
