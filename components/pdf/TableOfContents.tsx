import React from 'react'
import { Page, View, Text } from '@react-pdf/renderer'
import { styles, colors } from './styles'

interface TocArticle {
  number: string
  title: string
}

interface TocSubcategory {
  name: string
  articles: TocArticle[]
}

interface TocChapter {
  number: number
  title: string
  subcategories?: TocSubcategory[]
  articles: TocArticle[]
}

interface TableOfContentsProps {
  chapters: TocChapter[]
}

export function TableOfContents({ chapters }: TableOfContentsProps) {
  return (
    <Page size="A4" style={styles.tocPage}>
      {/* Title */}
      <Text style={styles.tocTitle}>INNEHÅLLSFÖRTECKNING</Text>

      {/* Chapters and articles */}
      <View style={{ marginTop: 20 }}>
        {chapters.map((chapter) => (
          <View key={chapter.number} style={{ marginBottom: 12 }}>
            {/* Chapter title */}
            <View style={{ ...styles.tocItem, borderBottomWidth: 0 }}>
              <Text style={styles.tocChapterTitle}>
                {chapter.number}. {chapter.title}
              </Text>
            </View>

            {/* Subcategories with their articles */}
            {chapter.subcategories && chapter.subcategories.map((subcategory, subIndex) => (
              <View key={subIndex} style={{ marginLeft: 10, marginTop: 4 }}>
                {/* Subcategory name */}
                <Text style={{
                  fontSize: 10,
                  fontWeight: 'bold',
                  color: colors.gold,
                  marginBottom: 2,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}>
                  {subcategory.name}
                </Text>

                {/* Articles in subcategory */}
                {subcategory.articles.map((article) => (
                  <View key={article.number} style={{ ...styles.tocItem, borderBottomWidth: 0, paddingVertical: 2, paddingLeft: 10 }}>
                    <Text style={styles.tocArticleTitle}>
                      {article.number} {article.title}
                    </Text>
                  </View>
                ))}
              </View>
            ))}

            {/* Loose articles (not in subcategory) */}
            {chapter.articles.length > 0 && (
              <View style={{ marginLeft: 10, marginTop: chapter.subcategories && chapter.subcategories.length > 0 ? 6 : 0 }}>
                {chapter.articles.map((article) => (
                  <View key={article.number} style={{ ...styles.tocItem, borderBottomWidth: 0, paddingVertical: 2 }}>
                    <Text style={styles.tocArticleTitle}>
                      {article.number} {article.title}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </View>
    </Page>
  )
}
