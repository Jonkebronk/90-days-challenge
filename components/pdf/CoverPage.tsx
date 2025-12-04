import React from 'react'
import { Page, View, Text } from '@react-pdf/renderer'
import { styles, colors } from './styles'

interface CoverPageProps {
  title?: string
  subtitle?: string
  date?: string
}

export function CoverPage({
  title = '90-DAGARS UTMANINGEN',
  subtitle = 'Kunskapsbank',
  date,
}: CoverPageProps) {
  const formattedDate = date || new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Top decoration */}
        <View style={styles.coverLine} />

        {/* Main title */}
        <Text style={styles.coverTitle}>{title}</Text>

        {/* Subtitle */}
        <Text style={styles.coverSubtitle}>{subtitle}</Text>

        {/* Bottom decoration */}
        <View style={styles.coverLine} />

        {/* Description */}
        <Text style={{
          fontSize: 12,
          color: colors.lightGray,
          textAlign: 'center',
          marginTop: 40,
          maxWidth: 300,
          lineHeight: 1.6,
        }}>
          Din kompletta guide till träning, kost och livsstilsförändringar
        </Text>
      </View>

      {/* Date at bottom */}
      <Text style={styles.coverDate}>
        Genererad: {formattedDate}
      </Text>
    </Page>
  )
}
