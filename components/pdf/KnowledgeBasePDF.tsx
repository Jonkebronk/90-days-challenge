import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { CoverPage } from './CoverPage'
import { TableOfContents } from './TableOfContents'
import { ChapterHeader } from './ChapterHeader'
import { ArticlePage } from './ArticlePage'
import { styles, colors } from './styles'

interface Article {
  id: string
  title: string
  content: string
  difficulty?: string | null
  estimatedReadingMinutes?: number | null
  orderIndex: number
}

interface Category {
  id: string
  name: string
  description?: string | null
  orderIndex: number
  articles: Article[]
}

interface KnowledgeBasePDFProps {
  categories: Category[]
  title?: string
  subtitle?: string
  audience?: 'client' | 'coach'
}

// Footer component for content pages
function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>90-Dagars Utmaningen - Kunskapsbank</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  )
}

export function KnowledgeBasePDF({
  categories,
  title = '90-DAGARS UTMANINGEN',
  subtitle = 'Kunskapsbank',
  audience = 'client',
}: KnowledgeBasePDFProps) {
  // Sort categories by orderIndex
  const sortedCategories = [...categories].sort((a, b) => a.orderIndex - b.orderIndex)

  // Build table of contents data
  const tocChapters = sortedCategories.map((cat, catIndex) => ({
    number: catIndex + 1,
    title: cat.name,
    articles: cat.articles
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((article, artIndex) => ({
        number: `${catIndex + 1}.${artIndex + 1}`,
        title: article.title,
      })),
  }))

  return (
    <Document
      title={`${title} - ${subtitle}`}
      author="90-Dagars Utmaningen"
      subject="Kunskapsbank"
      keywords="träning, kost, hälsa, livsstil"
    >
      {/* Cover Page */}
      <CoverPage
        title={title}
        subtitle={audience === 'coach' ? 'Coach Kunskapsbank' : subtitle}
      />

      {/* Table of Contents */}
      <TableOfContents chapters={tocChapters} />

      {/* Chapters (Categories) */}
      {sortedCategories.map((category, catIndex) => {
        const chapterNumber = catIndex + 1
        const sortedArticles = [...category.articles].sort((a, b) => a.orderIndex - b.orderIndex)

        return (
          <React.Fragment key={category.id}>
            {/* Chapter Header Page */}
            <ChapterHeader
              chapterNumber={chapterNumber}
              title={category.name}
              description={category.description || undefined}
            />

            {/* Articles in this chapter */}
            <Page size="A4" style={styles.page} wrap>
              <PageFooter />

              {sortedArticles.map((article, artIndex) => (
                <ArticlePage
                  key={article.id}
                  title={article.title}
                  content={article.content}
                  categoryName={category.name}
                  difficulty={article.difficulty || undefined}
                  readingTime={article.estimatedReadingMinutes || undefined}
                  articleNumber={`${chapterNumber}.${artIndex + 1}`}
                />
              ))}
            </Page>
          </React.Fragment>
        )
      })}
    </Document>
  )
}
