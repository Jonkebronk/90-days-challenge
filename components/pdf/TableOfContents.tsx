import React from 'react'
import { Page, View, Text } from '@react-pdf/renderer'
import { styles } from './styles'

interface TocChapter {
  number: number
  title: string
  articles: {
    number: string
    title: string
  }[]
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
          <View key={chapter.number} style={{ marginBottom: 15 }}>
            {/* Chapter title */}
            <View style={styles.tocItem}>
              <Text style={styles.tocChapterTitle}>
                {chapter.number}. {chapter.title}
              </Text>
            </View>

            {/* Articles in chapter */}
            {chapter.articles.map((article) => (
              <View key={article.number} style={{ ...styles.tocItem, borderBottomWidth: 0 }}>
                <Text style={styles.tocArticleTitle}>
                  {article.number} {article.title}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </View>
    </Page>
  )
}
