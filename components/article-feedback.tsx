'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface ArticleFeedbackProps {
  articleId: string
  initialFeedback?: {
    isHelpful: boolean
    comment?: string | null
  } | null
  className?: string
}

export function ArticleFeedback({ articleId, initialFeedback, className }: ArticleFeedbackProps) {
  const [isHelpful, setIsHelpful] = useState<boolean | null>(
    initialFeedback?.isHelpful ?? null
  )
  const [showComment, setShowComment] = useState(false)
  const [comment, setComment] = useState(initialFeedback?.comment || '')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleFeedback = async (helpful: boolean) => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/articles/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          isHelpful: helpful,
          comment: comment || undefined,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit feedback')

      setIsHelpful(helpful)
      toast.success('Tack för din feedback!')

      // Show comment field if negative feedback
      if (!helpful) {
        setShowComment(true)
      }
    } catch (error) {
      toast.error('Kunde inte skicka feedback')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCommentSubmit = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/articles/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          isHelpful: isHelpful!,
          comment,
        }),
      })

      if (!response.ok) throw new Error('Failed to submit comment')

      toast.success('Kommentar sparad!')
      setShowComment(false)
    } catch (error) {
      toast.error('Kunde inte spara kommentar')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className={cn('p-6 space-y-4', className)}>
      <h3 className="font-semibold text-lg">Var denna artikel hjälpsam?</h3>

      <div className="flex gap-3">
        <Button
          variant={isHelpful === true ? 'default' : 'outline'}
          size="lg"
          onClick={() => handleFeedback(true)}
          disabled={isSubmitting}
          className="flex-1"
        >
          <ThumbsUp
            className={cn('h-5 w-5 mr-2', isHelpful === true && 'fill-current')}
          />
          Ja, hjälpsam
        </Button>

        <Button
          variant={isHelpful === false ? 'default' : 'outline'}
          size="lg"
          onClick={() => handleFeedback(false)}
          disabled={isSubmitting}
          className="flex-1"
        >
          <ThumbsDown
            className={cn('h-5 w-5 mr-2', isHelpful === false && 'fill-current')}
          />
          Nej, inte hjälpsam
        </Button>
      </div>

      {/* Comment Section */}
      {(showComment || initialFeedback?.comment) && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MessageSquare className="h-4 w-4" />
            <span>Berätta gärna mer (frivilligt)</span>
          </div>

          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Vad kan vi förbättra?"
            rows={3}
            disabled={isSubmitting}
          />

          <Button
            onClick={handleCommentSubmit}
            disabled={isSubmitting || !comment.trim()}
            size="sm"
          >
            Skicka kommentar
          </Button>
        </div>
      )}

      {isHelpful !== null && !showComment && (
        <p className="text-sm text-muted-foreground">
          Tack för din feedback! Detta hjälper oss att förbättra innehållet.
        </p>
      )}
    </Card>
  )
}
