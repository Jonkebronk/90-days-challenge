import React from 'react'
import { Page, View, Text } from '@react-pdf/renderer'
import { styles } from './styles'

interface ChapterHeaderProps {
  chapterNumber: number
  title: string
  description?: string
}

export function ChapterHeader({ chapterNumber, title, description }: ChapterHeaderProps) {
  return (
    <Page size="A4" style={styles.chapterPage}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Chapter number */}
        <Text style={styles.chapterNumber}>
          KAPITEL {chapterNumber}
        </Text>

        {/* Chapter title */}
        <Text style={styles.chapterTitle}>
          {title.toUpperCase()}
        </Text>

        {/* Decoration line */}
        <View style={styles.chapterLine} />

        {/* Description if provided */}
        {description && (
          <Text style={{
            fontSize: 12,
            color: '#CCCCCC',
            textAlign: 'center',
            marginTop: 20,
            maxWidth: 350,
            lineHeight: 1.5,
          }}>
            {description}
          </Text>
        )}
      </View>
    </Page>
  )
}
