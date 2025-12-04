import React from 'react'
import { View, Text } from '@react-pdf/renderer'
import { styles, colors } from './styles'

interface ArticlePageProps {
  title: string
  content: string
  categoryName?: string
  difficulty?: string
  readingTime?: number
  articleNumber?: string
}

// Clean and convert MDX/Markdown content to plain text with proper formatting
function cleanContent(content: string): string {
  let cleaned = content

  // Remove MDX imports and exports
  cleaned = cleaned.replace(/^import\s+.*$/gm, '')
  cleaned = cleaned.replace(/^export\s+.*$/gm, '')

  // Remove JSX/MDX components (anything like <Component ... /> or <Component>...</Component>)
  cleaned = cleaned.replace(/<[A-Z][a-zA-Z]*[^>]*\/>/g, '')
  cleaned = cleaned.replace(/<[A-Z][a-zA-Z]*[^>]*>[\s\S]*?<\/[A-Z][a-zA-Z]*>/g, '')
  cleaned = cleaned.replace(/<[A-Z][a-zA-Z]*[^>]*>/g, '')
  cleaned = cleaned.replace(/<\/[A-Z][a-zA-Z]*>/g, '')

  // Remove HTML comments
  cleaned = cleaned.replace(/<!--[\s\S]*?-->/g, '')

  // Remove code blocks (``` ... ```)
  cleaned = cleaned.replace(/```[\s\S]*?```/g, '[Kodblock - se webversion]')

  // Remove inline code backticks but keep content
  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')

  // Convert bold **text** to just text (uppercase for emphasis)
  cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, '$1')

  // Convert italic *text* or _text_ to just text
  cleaned = cleaned.replace(/\*([^*]+)\*/g, '$1')
  cleaned = cleaned.replace(/_([^_]+)_/g, '$1')

  // Convert links [text](url) to just text
  cleaned = cleaned.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')

  // Convert images ![alt](url) to [Bild: alt]
  cleaned = cleaned.replace(/!\[([^\]]*)\]\([^)]+\)/g, (_, alt) => alt ? `[Bild: ${alt}]` : '')

  // Remove any remaining HTML tags
  cleaned = cleaned.replace(/<[^>]+>/g, '')

  // Clean up extra whitespace and newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')
  cleaned = cleaned.trim()

  return cleaned
}

// Parse cleaned content into structured elements
function parseContent(content: string): React.ReactNode[] {
  const cleaned = cleanContent(content)
  const elements: React.ReactNode[] = []
  const lines = cleaned.split('\n')

  let currentParagraph: string[] = []
  let listItems: string[] = []
  let numberedListItems: string[] = []
  let blockquoteLines: string[] = []

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      const text = currentParagraph.join(' ').trim()
      if (text) {
        elements.push(
          <Text key={`p-${elements.length}`} style={styles.paragraph}>
            {text}
          </Text>
        )
      }
      currentParagraph = []
    }
  }

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <View key={`list-${elements.length}`} style={{ marginVertical: 8 }}>
          {listItems.map((item, i) => (
            <View key={i} style={styles.listItem}>
              <Text style={styles.listBullet}>•</Text>
              <Text style={styles.listContent}>{item.trim()}</Text>
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
              <Text style={styles.listContent}>{item.trim()}</Text>
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
          <Text style={styles.blockquoteText}>{blockquoteLines.join(' ').trim()}</Text>
        </View>
      )
      blockquoteLines = []
    }
  }

  const flushAll = () => {
    flushParagraph()
    flushList()
    flushNumberedList()
    flushBlockquote()
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmedLine = line.trim()

    // Empty line - flush current paragraph
    if (!trimmedLine) {
      flushAll()
      continue
    }

    // Headers (# ## ###)
    const h1Match = trimmedLine.match(/^#\s+(.+)$/)
    const h2Match = trimmedLine.match(/^##\s+(.+)$/)
    const h3Match = trimmedLine.match(/^###\s+(.+)$/)
    const h4Match = trimmedLine.match(/^####\s+(.+)$/)

    if (h4Match || h3Match) {
      flushAll()
      elements.push(
        <Text key={`h3-${i}`} style={styles.h3}>
          {(h4Match || h3Match)![1]}
        </Text>
      )
      continue
    }

    if (h2Match) {
      flushAll()
      elements.push(
        <Text key={`h2-${i}`} style={styles.h2}>
          {h2Match[1]}
        </Text>
      )
      continue
    }

    if (h1Match) {
      flushAll()
      elements.push(
        <Text key={`h1-${i}`} style={styles.h1}>
          {h1Match[1]}
        </Text>
      )
      continue
    }

    // Blockquote
    if (trimmedLine.startsWith('> ')) {
      flushParagraph()
      flushList()
      flushNumberedList()
      blockquoteLines.push(trimmedLine.substring(2))
      continue
    } else if (blockquoteLines.length > 0) {
      flushBlockquote()
    }

    // Unordered list (- or *)
    const ulMatch = trimmedLine.match(/^[-*]\s+(.+)$/)
    if (ulMatch) {
      flushParagraph()
      flushNumberedList()
      flushBlockquote()
      listItems.push(ulMatch[1])
      continue
    } else if (listItems.length > 0 && !trimmedLine.match(/^[-*]\s/)) {
      flushList()
    }

    // Numbered list
    const olMatch = trimmedLine.match(/^\d+[.)]\s+(.+)$/)
    if (olMatch) {
      flushParagraph()
      flushList()
      flushBlockquote()
      numberedListItems.push(olMatch[1])
      continue
    } else if (numberedListItems.length > 0 && !trimmedLine.match(/^\d+[.)]\s/)) {
      flushNumberedList()
    }

    // Horizontal rule
    if (trimmedLine.match(/^[-*_]{3,}$/)) {
      flushAll()
      elements.push(<View key={`hr-${i}`} style={styles.separator} />)
      continue
    }

    // Regular text - add to current paragraph
    currentParagraph.push(trimmedLine)
  }

  // Flush any remaining content
  flushAll()

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
