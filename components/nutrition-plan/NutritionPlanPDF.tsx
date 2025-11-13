// PDF Template for Nutrition Plans
// @react-pdf/renderer implementation
// Will be implemented in STEG 7

import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

interface NutritionPlanPDFProps {
  plan: any; // Will be properly typed
  phase: 1 | 2 | 3 | 4;
}

export function NutritionPlanPDF({ plan, phase }: NutritionPlanPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Kostschema - Fas {phase}</Text>
        <Text>PDF template will be implemented in STEG 7</Text>
      </Page>
    </Document>
  );
}
