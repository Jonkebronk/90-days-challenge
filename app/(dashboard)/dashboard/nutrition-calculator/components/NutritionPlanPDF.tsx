import React from 'react';
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
} from '@react-pdf/renderer';
import { Phase1Data, Phase2Data, Phase3Data, Phase4Data } from '@/lib/types/nutrition';

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 10,
    backgroundColor: '#ffffff',
  },
  header: {
    marginBottom: 30,
    borderBottom: 3,
    borderBottomColor: '#FFD700',
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 12,
    color: '#666',
  },
  clientInfo: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  clientName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  phaseSection: {
    marginBottom: 25,
    borderLeft: 4,
    borderLeftColor: '#FFD700',
    paddingLeft: 15,
  },
  phaseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 10,
  },
  phaseDescription: {
    fontSize: 10,
    color: '#666',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  macroGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#fffef0',
    borderRadius: 5,
  },
  macroItem: {
    flex: 1,
  },
  macroLabel: {
    fontSize: 9,
    color: '#666',
    marginBottom: 3,
  },
  macroValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  activitySection: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f0f9ff',
    borderRadius: 5,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  activityLabel: {
    fontSize: 10,
    color: '#666',
  },
  activityValue: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  mealSection: {
    marginTop: 15,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
  },
  mealTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#1a1a1a',
  },
  mealItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottom: 1,
    borderBottomColor: '#e0e0e0',
  },
  mealItemName: {
    fontSize: 9,
    color: '#333',
    flex: 2,
  },
  mealItemMacros: {
    fontSize: 8,
    color: '#666',
    flex: 1,
    textAlign: 'right',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#999',
    fontSize: 8,
    borderTop: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 10,
  },
  pageNumber: {
    position: 'absolute',
    bottom: 20,
    right: 40,
    fontSize: 8,
    color: '#999',
  },
});

interface NutritionPlanPDFProps {
  clientName: string;
  phase1Data: Phase1Data;
  phase2Data?: Phase2Data | null;
  phase3Data?: Phase3Data | null;
  phase4Data?: Phase4Data | null;
  createdAt?: Date;
}

export const NutritionPlanPDF: React.FC<NutritionPlanPDFProps> = ({
  clientName,
  phase1Data,
  phase2Data,
  phase3Data,
  phase4Data,
  createdAt,
}) => {
  const formatDate = (date?: Date) => {
    if (!date) return new Date().toLocaleDateString('sv-SE');
    return new Date(date).toLocaleDateString('sv-SE');
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString('sv-SE');
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>4-FAS KOSTSCHEMA</Text>
          <Text style={styles.subtitle}>Personlig nutritionsplan</Text>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>Klient: {clientName}</Text>
          <Text style={{ fontSize: 9, color: '#666' }}>
            Skapad: {formatDate(createdAt)}
          </Text>
        </View>

        {/* Phase 1 */}
        <View style={styles.phaseSection}>
          <Text style={styles.phaseTitle}>Fas 1: Basberäkningar</Text>
          <Text style={styles.phaseDescription}>
            Utgångsläge med grundkalori, stegmål och eventuellt underskott
          </Text>

          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Kalorier</Text>
              <Text style={styles.macroValue}>{phase1Data.calories} kcal</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Protein</Text>
              <Text style={styles.macroValue}>{phase1Data.protein}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Fett</Text>
              <Text style={styles.macroValue}>{phase1Data.fat}g</Text>
            </View>
            <View style={styles.macroItem}>
              <Text style={styles.macroLabel}>Kolhydrater</Text>
              <Text style={styles.macroValue}>{phase1Data.carbs}g</Text>
            </View>
          </View>

          <View style={styles.activitySection}>
            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>Vikt:</Text>
              <Text style={styles.activityValue}>{phase1Data.weight} kg</Text>
            </View>
            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>Aktivitetsnivå:</Text>
              <Text style={styles.activityValue}>{phase1Data.activity}</Text>
            </View>
            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>Kalorisk underskott:</Text>
              <Text style={styles.activityValue}>{phase1Data.weightLoss} kcal</Text>
            </View>
            <View style={styles.activityRow}>
              <Text style={styles.activityLabel}>Dagliga steg:</Text>
              <Text style={styles.activityValue}>{formatNumber(phase1Data.steps)}</Text>
            </View>
          </View>

          {/* Meal Schema for Phase 1 */}
          {phase1Data.schema && (
            <View style={styles.mealSection}>
              <Text style={styles.mealTitle}>Kostschema</Text>
              {phase1Data.schema.meals.map((meal, idx) => (
                <View key={idx} style={{ marginBottom: 8 }}>
                  <Text style={{ fontSize: 10, fontWeight: 'bold', marginBottom: 4 }}>
                    {meal.name}
                  </Text>
                  {meal.items.map((item, itemIdx) => (
                    <View key={itemIdx} style={styles.mealItem}>
                      <Text style={styles.mealItemName}>
                        {item.name} ({item.amount}g)
                      </Text>
                      <Text style={styles.mealItemMacros}>
                        P: {item.protein}g F: {item.fett}g K: {item.kolhydrater}g
                      </Text>
                    </View>
                  ))}
                </View>
              ))}
            </View>
          )}
        </View>

        <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
      </Page>

      {/* Phase 2 */}
      {phase2Data && (
        <Page size="A4" style={styles.page}>
          <View style={styles.phaseSection}>
            <Text style={styles.phaseTitle}>Fas 2: Ramp Up 1</Text>
            <Text style={styles.phaseDescription}>
              +25% steg från Fas 1 och 10 min intervallcardio efter styrketräning
            </Text>

            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Kalorier</Text>
                <Text style={styles.macroValue}>{phase2Data.calories} kcal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{phase2Data.protein}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fett</Text>
                <Text style={styles.macroValue}>{phase2Data.fat}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Kolhydrater</Text>
                <Text style={styles.macroValue}>{phase2Data.carbs}g</Text>
              </View>
            </View>

            <View style={styles.activitySection}>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Vikt:</Text>
                <Text style={styles.activityValue}>{phase2Data.weight} kg</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Dagliga steg:</Text>
                <Text style={styles.activityValue}>{formatNumber(phase2Data.steps)}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Cardio:</Text>
                <Text style={styles.activityValue}>{phase2Data.cardioMinutes} min</Text>
              </View>
              <View style={{ marginTop: 5 }}>
                <Text style={{ fontSize: 9, color: '#666', fontStyle: 'italic' }}>
                  {phase2Data.cardioDescription}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      )}

      {/* Phase 3 */}
      {phase3Data && (
        <Page size="A4" style={styles.page}>
          <View style={styles.phaseSection}>
            <Text style={styles.phaseTitle}>Fas 3: Ramp Up 2</Text>
            <Text style={styles.phaseDescription}>
              +25% mer steg från Fas 2 och 20 min cardio (12 intervaller + 8 min steady state)
            </Text>

            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Kalorier</Text>
                <Text style={styles.macroValue}>{phase3Data.calories} kcal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{phase3Data.protein}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fett</Text>
                <Text style={styles.macroValue}>{phase3Data.fat}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Kolhydrater</Text>
                <Text style={styles.macroValue}>{phase3Data.carbs}g</Text>
              </View>
            </View>

            <View style={styles.activitySection}>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Vikt:</Text>
                <Text style={styles.activityValue}>{phase3Data.weight} kg</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Dagliga steg:</Text>
                <Text style={styles.activityValue}>{formatNumber(phase3Data.steps)}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Cardio:</Text>
                <Text style={styles.activityValue}>{phase3Data.cardioMinutes} min</Text>
              </View>
              <View style={{ marginTop: 5 }}>
                <Text style={{ fontSize: 9, color: '#666', fontStyle: 'italic' }}>
                  {phase3Data.cardioDescription}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      )}

      {/* Phase 4 */}
      {phase4Data && (
        <Page size="A4" style={styles.page}>
          <View style={styles.phaseSection}>
            <Text style={styles.phaseTitle}>Fas 4: Din Nya Vardag (Underhåll)</Text>
            <Text style={styles.phaseDescription}>
              Hållbart långsiktigt underhåll - inga viktminskningskalorier
            </Text>

            <View style={styles.macroGrid}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Kalorier</Text>
                <Text style={styles.macroValue}>{phase4Data.calories} kcal</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Protein</Text>
                <Text style={styles.macroValue}>{phase4Data.protein}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Fett</Text>
                <Text style={styles.macroValue}>{phase4Data.fat}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>Kolhydrater</Text>
                <Text style={styles.macroValue}>{phase4Data.carbs}g</Text>
              </View>
            </View>

            <View style={styles.activitySection}>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Målvikt:</Text>
                <Text style={styles.activityValue}>{phase4Data.weight} kg</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Dagliga steg:</Text>
                <Text style={styles.activityValue}>{formatNumber(phase4Data.steps)}</Text>
              </View>
              <View style={styles.activityRow}>
                <Text style={styles.activityLabel}>Cardio alternativ:</Text>
                <Text style={styles.activityValue}>
                  Alternativ {phase4Data.cardioOption}
                  {phase4Data.cardioMinutes ? ` (${phase4Data.cardioMinutes} min)` : ''}
                </Text>
              </View>
              <View style={{ marginTop: 5 }}>
                <Text style={{ fontSize: 9, color: '#666', fontStyle: 'italic' }}>
                  {phase4Data.cardioDescription}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.footer}>
            <Text>Genererad av 4-Fas Kostschema Kalkylator</Text>
            <Text>Denna plan är personlig och ska följas under coachens vägledning</Text>
          </View>

          <Text style={styles.pageNumber} render={({ pageNumber }) => `${pageNumber}`} fixed />
        </Page>
      )}
    </Document>
  );
};
