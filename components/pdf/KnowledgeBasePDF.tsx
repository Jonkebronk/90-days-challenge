import React from 'react'
import { Document, Page, View, Text } from '@react-pdf/renderer'
import { CoverPage } from './CoverPage'
import { TableOfContents } from './TableOfContents'
import { ChapterHeader } from './ChapterHeader'
import { ArticlePage } from './ArticlePage'
import { styles } from './styles'

interface Article {
  id: string
  title: string
  content: string
  difficulty?: string | null
  estimatedReadingMinutes?: number | null
  orderInBranch?: number
  orderIndex?: number
}

interface Subcategory {
  id: string
  name: string
  orderIndex: number
  articles: Article[]
}

interface Branch {
  id: string
  name: string
  color: string
  orderIndex: number
  articles: Article[]
  subcategories: Subcategory[]
}

interface Category {
  id: string
  name: string
  description?: string | null
  orderIndex: number
  articles: Article[]
}

interface SkillTreeData {
  type: 'skillTree'
  branches: Branch[]
  singleBranch?: Branch | null // Present when filtering to a single branch
}

interface CategoryData {
  type: 'categories'
  categories: Category[]
  singleCategory?: Category | null // Present when filtering to a single category
}

interface KnowledgeBasePDFProps {
  data: SkillTreeData | CategoryData
  audience?: 'client' | 'coach'
  logoUrl?: string
}

// Footer component for content pages
function PageFooter({ branchName }: { branchName?: string }) {
  const footerText = branchName
    ? `Friskvårdskompassen - ${branchName}`
    : 'Friskvårdskompassen - Kunskapskartan'
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>{footerText}</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}`}
      />
    </View>
  )
}

export function KnowledgeBasePDF({
  data,
  audience = 'client',
  logoUrl,
}: KnowledgeBasePDFProps) {
  // Build table of contents based on data type
  const tocChapters: { number: number; title: string; subcategories?: { name: string; articles: { number: string; title: string }[] }[]; articles: { number: string; title: string }[] }[] = []

  if (data.type === 'skillTree') {
    data.branches.forEach((branch, branchIndex) => {
      const chapterNumber = branchIndex + 1
      const subcategoriesData: { name: string; articles: { number: string; title: string }[] }[] = []
      let articleCounter = 1

      // Add subcategories with their articles
      branch.subcategories.forEach((sub) => {
        if (sub.articles.length > 0) {
          subcategoriesData.push({
            name: sub.name,
            articles: sub.articles.map((article) => ({
              number: `${chapterNumber}.${articleCounter++}`,
              title: article.title,
            })),
          })
        }
      })

      // Add loose articles (not in subcategory)
      const looseArticles = branch.articles.map((article) => ({
        number: `${chapterNumber}.${articleCounter++}`,
        title: article.title,
      }))

      tocChapters.push({
        number: chapterNumber,
        title: branch.name,
        subcategories: subcategoriesData.length > 0 ? subcategoriesData : undefined,
        articles: looseArticles,
      })
    })
  } else {
    data.categories.forEach((category, catIndex) => {
      tocChapters.push({
        number: catIndex + 1,
        title: category.name,
        articles: category.articles.map((article, artIndex) => ({
          number: `${catIndex + 1}.${artIndex + 1}`,
          title: article.title,
        })),
      })
    })
  }

  // Determine if this is a single branch/category PDF
  const singleBranchName = data.type === 'skillTree' && data.singleBranch ? data.singleBranch.name : null
  const singleCategoryName = data.type === 'categories' && data.singleCategory ? data.singleCategory.name : null
  const singleName = singleBranchName || singleCategoryName

  const documentTitle = singleName
    ? `Friskvårdskompassen - ${singleName}`
    : audience === 'coach'
      ? 'Friskvårdskompassen - Coach Kunskapsbank'
      : 'Friskvårdskompassen - Kunskapskartan'
  const coverTitle = singleName
    ? singleName.toUpperCase()
    : audience === 'coach'
      ? 'COACH KUNSKAPSBANK'
      : 'KUNSKAPSKARTAN'

  const subjectText = singleName
    ? singleName
    : audience === 'coach'
      ? 'Coach Kunskapsbank'
      : 'Kunskapskartan'
  const subtitleText = singleName
    ? (audience === 'coach' ? 'Coach Kunskapsbank' : 'Kunskapskartan')
    : undefined

  return (
    <Document
      title={documentTitle}
      author="Friskvårdskompassen"
      subject={subjectText}
      keywords="träning, kost, hälsa, livsstil"
    >
      {/* Cover Page */}
      <CoverPage
        title={coverTitle}
        subtitle={subtitleText}
        logoUrl={logoUrl}
      />

      {/* Table of Contents */}
      <TableOfContents chapters={tocChapters} />

      {/* Chapters */}
      {data.type === 'skillTree' ? (
        // Render skill tree branches
        data.branches.map((branch, branchIndex) => {
          const chapterNumber = branchIndex + 1
          let articleCounter = 1

          // Collect all articles in order: subcategory articles first, then loose articles
          const allArticlesWithMeta: { article: Article; subcategoryName?: string; articleNumber: string }[] = []

          // Add subcategory articles
          branch.subcategories.forEach((sub) => {
            sub.articles.forEach((article) => {
              allArticlesWithMeta.push({
                article,
                subcategoryName: sub.name,
                articleNumber: `${chapterNumber}.${articleCounter++}`,
              })
            })
          })

          // Add loose articles
          branch.articles.forEach((article) => {
            allArticlesWithMeta.push({
              article,
              articleNumber: `${chapterNumber}.${articleCounter++}`,
            })
          })

          return (
            <React.Fragment key={branch.id}>
              {/* Chapter Header Page */}
              <ChapterHeader
                chapterNumber={chapterNumber}
                title={branch.name}
              />

              {/* Articles in this chapter */}
              <Page size="A4" style={styles.page} wrap>
                <PageFooter branchName={singleBranchName || undefined} />

                {allArticlesWithMeta.map(({ article, subcategoryName, articleNumber }, index) => (
                  <React.Fragment key={article.id}>
                    {/* Show subcategory header if it's the first article of a subcategory */}
                    {subcategoryName && (index === 0 || allArticlesWithMeta[index - 1]?.subcategoryName !== subcategoryName) && (
                      <View style={{ marginTop: index > 0 ? 15 : 0, marginBottom: 10 }}>
                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: '#FFD700', textTransform: 'uppercase', letterSpacing: 1 }}>
                          {subcategoryName}
                        </Text>
                        <View style={{ height: 1, backgroundColor: '#FFD700', marginTop: 3, opacity: 0.5 }} />
                      </View>
                    )}
                    <ArticlePage
                      title={article.title}
                      content={article.content}
                      categoryName={branch.name}
                      difficulty={article.difficulty || undefined}
                      readingTime={article.estimatedReadingMinutes || undefined}
                      articleNumber={articleNumber}
                    />
                  </React.Fragment>
                ))}
              </Page>
            </React.Fragment>
          )
        })
      ) : (
        // Render categories (for coach articles)
        data.categories.map((category, catIndex) => {
          const chapterNumber = catIndex + 1
          const sortedArticles = [...category.articles].sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0))

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
        })
      )}
    </Document>
  )
}
