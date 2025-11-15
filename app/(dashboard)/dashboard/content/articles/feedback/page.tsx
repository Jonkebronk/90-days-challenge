'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type Feedback = {
  id: string
  isHelpful: boolean
  comment: string | null
  createdAt: string
  article: {
    id: string
    title: string
  }
  user: {
    name: string | null
    email: string
  }
}

export default function ArticleFeedbackPage() {
  const { data: session } = useSession()
  const [feedbackData, setFeedbackData] = useState<Feedback[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (session?.user && (session.user as any).role === 'coach') {
      fetchFeedback()
    }
  }, [session])

  const fetchFeedback = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/articles/feedback/all')
      if (response.ok) {
        const data = await response.json()
        setFeedbackData(data.feedback)
      } else {
        toast.error('Kunde inte hämta feedback')
      }
    } catch (error) {
      console.error('Error fetching feedback:', error)
      toast.error('Ett fel uppstod')
    } finally {
      setIsLoading(false)
    }
  }

  if (!session?.user || (session.user as any).role !== 'coach') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">
              Du måste vara inloggad som coach för att se denna sida.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const helpfulCount = feedbackData.filter((f) => f.isHelpful).length
  const notHelpfulCount = feedbackData.filter((f) => !f.isHelpful).length
  const withCommentsCount = feedbackData.filter((f) => f.comment).length

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-7xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Artikel Feedback</h1>
        <p className="text-muted-foreground mt-2">Se vad klienter tycker om ditt innehåll</p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Totalt Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{feedbackData.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Positiv</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{helpfulCount}</div>
            {feedbackData.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((helpfulCount / feedbackData.length) * 100)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Negativ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{notHelpfulCount}</div>
            {feedbackData.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round((notHelpfulCount / feedbackData.length) * 100)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Med Kommentarer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{withCommentsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Feedback List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Laddar feedback...</p>
        </div>
      ) : feedbackData.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Ingen feedback ännu.</p>
            <p className="text-sm text-muted-foreground/70 mt-2">
              Feedback kommer visas här när klienter betygsätter artiklar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {feedbackData.map((feedback) => (
            <Card key={feedback.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Link
                        href={`/dashboard/content/articles/${feedback.article.id}`}
                        className="font-semibold hover:underline hover:text-primary"
                      >
                        {feedback.article.title}
                      </Link>

                      {feedback.isHelpful ? (
                        <Badge className="gap-1 bg-green-500 hover:bg-green-600">
                          <ThumbsUp className="h-3 w-3" />
                          Hjälpsam
                        </Badge>
                      ) : (
                        <Badge variant="destructive" className="gap-1">
                          <ThumbsDown className="h-3 w-3" />
                          Inte hjälpsam
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground">
                      {feedback.user.name || feedback.user.email} •{' '}
                      {new Date(feedback.createdAt).toLocaleDateString('sv-SE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>

                    {feedback.comment && (
                      <div className="mt-3 p-3 bg-muted rounded-md">
                        <div className="flex gap-2 text-sm text-muted-foreground mb-1">
                          <MessageSquare className="h-4 w-4" />
                          <span>Kommentar:</span>
                        </div>
                        <p className="text-sm">{feedback.comment}</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
