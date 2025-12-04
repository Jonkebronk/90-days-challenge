import React from 'react'
import { Page, View, Text, Image } from '@react-pdf/renderer'
import { styles, colors } from './styles'

interface CoverPageProps {
  title?: string
  subtitle?: string
  date?: string
  logoUrl?: string
}

export function CoverPage({
  title = 'KUNSKAPSKARTAN',
  subtitle,
  date,
  logoUrl,
}: CoverPageProps) {
  const formattedDate = date || new Date().toLocaleDateString('sv-SE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        {/* Logo - original aspect ratio is ~1.9:1 (3172x1666) */}
        {logoUrl && (
          <Image
            src={logoUrl}
            style={{
              width: 250,
              height: 131,
              marginBottom: 40,
              objectFit: 'contain',
            }}
          />
        )}

        {/* Top decoration */}
        <View style={styles.coverLine} />

        {/* Main title */}
        <Text style={styles.coverTitle}>{title}</Text>

        {/* Subtitle - only show if provided */}
        {subtitle && <Text style={styles.coverSubtitle}>{subtitle}</Text>}

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
