import React from 'react'
import { View, Text, Image } from '@react-pdf/renderer'
import { styles, colors } from './styles'

interface ArticlePageProps {
  title: string
  content: string
  categoryName?: string
  difficulty?: string
  readingTime?: number
  articleNumber?: string
}

// Parse MDX/Markdown content to PDF elements
function parseContent(content: string): React.ReactNode[] {
  const elements: React.ReactNode[] = []
  const lines = content.split('\n')
  let listItems: string[] = []
  let numberedListItems: string[] = []
  let inBlockquote = false
  let blockquoteLines: string[] = []

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <View key={`list-${elements.length}`} style={{ marginVertical: 8 }}>
          {listItems.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listContent}>{item}</Text>
            </View>
          ))}
        </View>
      )
      listItems = []
    }
  }

  const flushNumberedList = () => {
    if (numberedListItems.length > 0) {
      elements.push(
        <View key={`numlist-${elements.length}`} style={{ marginVertical: 8 }}>
          {numberedListItems.map((item, i) => (
            <View key={i} style={styles.numberedListItem}>
              <Text style={styles.numberedListNumber}>{i + 1}.</Text>
              <Text style={styles.listContent}>{item}</Text>
            </View>
          ))}
        </View>
      )
      numberedListItems = []
    }
  }

  const flushBlockquote = () => {
    if (blockquoteLines.length > 0) {
      elements.push(
        <View key={`quote-${elements.length}`} style={styles.blockquote}>
          <Text style={styles.blockquoteText}>{blockquoteLines.join(' ')}</Text>
        </View>
      )
      blockquoteLines = []
      inBlockquote = false
    }
  }

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]

    // Skip empty lines
    if (!line.trim()) {
      flushList()
      flushNumberedList()
      flushBlockquote()
      continue
    }

    // Skip MDX imports and components
    if (line.startsWith('import ') || line.startsWith('export ') || line.match(/^<[A-Z]/)) {
      continue
    }

    // Headers
    if (line.startsWith('### ')) {
      flushList()
      flushNumberedList()
      flushBlockquote()
      elements.push(
        <Text key={`h3-${i}`} style={styles.h3}>
          {line.replace('### ', '')}
        </Text>
      )
      continue
    }
    if (line.startsWith('## ')) {
      flushList()
      flushNumberedList()
      flushBlockquote()
      elements.push(
        <Text key={`h2-${i}`} style={styles.h2}>
          {line.replace('## ', '')}
        </Text>
      )
      continue
    }
    if (line.startsWith('# ')) {
      flushList()
      flushNumberedList()
      flushBlockquote()
      elements.push(
        <Text key={`h1-${i}`} style={styles.h1}>
          {line.replace('# ', '')}
        </Text>
      )
      continue
    }

    // Blockquote
    if (line.startsWith('> ')) {
      flushList()
      flushNumberedList()
      inBlockquote = true
      blockquoteLines.push(line.replace('> ', ''))
      continue
    }

    // Unordered list
    if (line.match(/^[-*] /)) {
      flushNumberedList()
      flushBlockquote()
      listItems.push(line.replace(/^[-*] /, ''))
      continue
    }

    // Numbered list
    if (line.match(/^\d+\. /)) {
      flushList()
      flushBlockquote()
      numberedListItems.push(line.replace(/^\d+\. /, ''))
      continue
    }

    // Image (just note it, can't always load external images)
    if (line.match(/!\[.*\]\(.*\)/)) {
      flushList()
      flushNumberedList()
      flushBlockquote()
      const match = line.match(/!\[(.*)\]\((.*)\)/)
      if (match) {
        const [, alt, src] = match
        // Try to render image if it's a valid URL
        if (src.startsWith('http')) {
          elements.push(
            <View key={`img-${i}`} style={{ marginVertical: 10 }}>
              <Image src={src} style={styles.image} />
              {alt && <Text style={styles.imageCaption}>{alt}</Text>}
            </View>
          )
        } else {
          elements.push(
            <Text key={`img-note-${i}`} style={{ ...styles.paragraph, fontStyle: 'italic', color: colors.gray }}>
              [Bild: {alt || 'Se webversion'}]
            </Text>
          )
        }
      }
      continue
    }

    // Horizontal rule
    if (line.match(/^[-*_]{3,}$/)) {
      flushList()
      flushNumberedList()
      flushBlockquote()
      elements.push(<View key={`hr-${i}`} style={styles.separator} />)
      continue
    }

    // Regular paragraph
    flushList()
    flushNumberedList()
    flushBlockquote()

    // Process inline formatting
    let processedText = line
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markers (can't nest styles easily)
      .replace(/\*(.*?)\*/g, '$1')     // Remove italic markers
      .replace(/`(.*?)`/g, '$1')       // Remove code markers
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Convert links to just text

    elements.push(
      <Text key={`p-${i}`} style={styles.paragraph}>
        {processedText}
      </Text>
    )
  }

  // Flush any remaining lists
  flushList()
  flushNumberedList()
  flushBlockquote()

  return elements
}

export function ArticlePage({
  title,
  content,
  categoryName,
  difficulty,
  readingTime,
  articleNumber,
}: ArticlePageProps) {
  const difficultyLabels: Record<string, string> = {
    beginner: 'Nybörjare',
    intermediate: 'Medel',
    advanced: 'Avancerad',
  }

  return (
    <View style={{ marginBottom: 30 }} wrap={true}>
      {/* Article title */}
      <Text style={styles.articleTitle}>
        {articleNumber ? `${articleNumber} ` : ''}{title}
      </Text>

      {/* Meta information */}
      <View style={styles.articleMeta}>
        {categoryName && (
          <Text style={styles.articleMetaItem}>
            Kategori: {categoryName}
          </Text>
        )}
        {difficulty && (
          <Text style={styles.articleMetaItem}>
            Nivå: {difficultyLabels[difficulty] || difficulty}
          </Text>
        )}
        {readingTime && (
          <Text style={styles.articleMetaItem}>
            Läsningstid: {readingTime} min
          </Text>
        )}
      </View>

      {/* Article content */}
      <View style={styles.articleContent}>
        {parseContent(content)}
      </View>

      {/* Separator after article */}
      <View style={styles.goldSeparator} />
    </View>
  )
}
