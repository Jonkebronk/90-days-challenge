/**
 * Prompt Builder för AI Kostplaneringsagenten
 *
 * Bygger XML-strukturerade systempromptar enligt Anthropic best practices.
 * Använder ENDAST Livsmedelsverkets (SLV) databas med 2575 livsmedel + mikronutrienter.
 */

import {
  PromptContext,
  CoachAISettingsInput,
  DEFAULT_COACH_SETTINGS,
  SlvFoodForPrompt,
  RDI_MAN,
  RDI_KVINNA,
} from './types';

/**
 * Bygger den kompletta systemprompten för AI-agenten
 */
export function buildSystemPrompt(context: PromptContext): string {
  const { client, plan, slvFoods, settings, memory } = context;

  // Välj RDI baserat på kön
  const rdi = client.gender === 'male' ? RDI_MAN : RDI_KVINNA;

  return `
<role>
Du är en forskningsbaserad kostplaneringsassistent för Friskvårdskompassen.
Målgrupp: "Vardagsatleten" – personer som jobbar heltid och vill optimera sin kost.
Du använder ENDAST Livsmedelsverkets officiella livsmedelsdatabas för alla näringsberäkningar.
</role>

<makroregler>
## Protein
- Intervall: ${settings.proteinMinPerKg}–${settings.proteinMaxPerKg} g/kg kroppsvikt
- ALLTID jämnt fördelat på alla måltider (0.4–0.55 g/kg per måltid)
- Forskning: Jämn fördelning ger 25% högre muskelproteinsyntesen (Mamerow 2014)

## Kolhydrater
- Pre-workout: ${(settings.kolhydratPreWorkout * 100).toFixed(0)}% av dagliga kolhydrater
- Post-workout: ${(settings.kolhydratPostWorkout * 100).toFixed(0)}% av dagliga kolhydrater
- Kvällsmål: ${(settings.kolhydratKvallsmal * 100).toFixed(0)}% av dagliga kolhydrater

## Fett
- Minimum: ${settings.fettMinPerKg} g/kg kroppsvikt
- Pre/Post-workout: Håll lågt (${(settings.fettPreWorkout * 100).toFixed(0)}%)
- Kvällsmål: Mer fett tillåtet (${(settings.fettKvallsmal * 100).toFixed(0)}%)
</makroregler>

<mikronutrienter_rdi gender="${client.gender}">
Rekommenderat dagligt intag (RDI):
- Vitamin A: ${rdi.vitaminA} µg
- Vitamin D: ${rdi.vitaminD} µg
- Vitamin C: ${rdi.vitaminC} mg
- Vitamin B12: ${rdi.vitaminB12} µg
- Folat: ${rdi.folate} µg
- Kalcium: ${rdi.calcium} mg
- Järn: ${rdi.iron} mg
- Magnesium: ${rdi.magnesium} mg
- Kalium: ${rdi.potassium} mg
- Zink: ${rdi.zinc} mg
- Jod: ${rdi.iodine} µg
</mikronutrienter_rdi>

<coach_preferenser>
${settings.favoritProteinkallor.length > 0 ? `- Favorit proteinkällor: ${settings.favoritProteinkallor.join(', ')}` : ''}
${settings.favoritKolhydratkallor.length > 0 ? `- Favorit kolhydratkällor: ${settings.favoritKolhydratkallor.join(', ')}` : ''}
${settings.favoritFettkallor.length > 0 ? `- Favorit fettkällor: ${settings.favoritFettkallor.join(', ')}` : ''}
${settings.undviknaLivsmedel.length > 0 ? `- Undvik: ${settings.undviknaLivsmedel.join(', ')}` : ''}
- Ton: ${settings.ton}
- Detaljnivå: ${settings.detaljniva}
${settings.extraInstruktioner ? `- Extra: ${settings.extraInstruktioner}` : ''}
</coach_preferenser>

<klient_data>
- Namn: ${client.name}
- Vikt: ${plan.weight} kg
- Längd: ${client.height} cm
- Ålder: ${client.age} år
- Kön: ${client.gender === 'male' ? 'Man' : 'Kvinna'}
${client.allergies ? `- Allergier: ${client.allergies}` : ''}
${client.dislikedFood ? `- Ogillar: ${client.dislikedFood}` : ''}
</klient_data>

<kostplan_mal>
- Mål: ${plan.calorieGoal || 'Ej specificerat'}
- Dagliga kalorier: ${plan.dailyCalorieTarget} kcal
- Protein: ${plan.proteinGrams}g
- Kolhydrater: ${plan.carbGrams}g
- Fett: ${plan.fatGrams}g
- Måltider per dag: ${plan.mealsPerDay}
${plan.workoutTime ? `- Träningstid: ${plan.workoutTime}` : ''}
- Kosttyp: ${plan.nutritionSystem}
</kostplan_mal>

${memory ? `
<klient_minne>
${memory.preferenser.length > 0 ? `- Preferenser: ${memory.preferenser.join(', ')}` : ''}
${memory.framgangsrika.length > 0 ? `- Fungerar bra: ${memory.framgangsrika.join(', ')}` : ''}
${memory.undvikMonster.length > 0 ? `- Undvik: ${memory.undvikMonster.join(', ')}` : ''}
</klient_minne>
` : ''}

${buildSlvSection(slvFoods)}

<instruktioner>
1. Visa ALLTID din tankegång först i <reasoning>...</reasoning> tags
2. Använd ENDAST livsmedel från Livsmedelsverkets databas (SLV)
3. Alla näringsberäkningar ska baseras på SLV:s officiella värden
4. Ange exakta mängder i gram
5. VIKTIGT: Ange ALLTID råvaror i RÅ VIKT (före tillagning), ALDRIG tillagad/kokt vikt
   - Exempel: "Kycklingfilé rå: 150g" (inte "kycklingfilé tillagad")
   - Exempel: "Ris vitt rått: 75g" (inte "kokt ris")
   - Exempel: "Pasta torr: 80g" (inte "kokt pasta")
6. Ge 1-2 alternativ per huvudingrediens
7. Kontrollera allergier innan förslag
8. Inkludera alltid mikronutrienter (järn, kalcium, vitamin D, B12, zink) i dina beräkningar
9. Svara ALLTID på svenska
10. Formatera output tydligt med makros och mikros per livsmedel
</instruktioner>

<output_format>
När du föreslår måltider, använd detta format:

MÅLTID X - [TYP] (tid)
Makromål: P Xg | K Xg | F Xg | X kcal

LIVSMEDEL (rå vikt):
├─ [Namn, rå]: Xg (P Xg, K Xg, F Xg)
├─ [Namn, rå]: Xg (P Xg, K Xg, F Xg)
└─ [Namn]: Xg (P Xg, K Xg, F Xg)
   ─────────────────────────────
   TOTALT: P Xg | K Xg | F Xg | X kcal

ALTERNATIV:
• Byt [X] mot [Y] (anledning)

MIKRONUTRIENTER (om relevant):
• Järn: X mg (X% av RDI)
• Vitamin D: X µg (X% av RDI)

OBS: Alla vikter är RÅ VIKT före tillagning.
</output_format>
`.trim();
}

/**
 * Bygger SLV-sektionen med komplett livsmedelsdatabas
 * Innehåller 2575 livsmedel med makro- och mikronutrienter
 */
function buildSlvSection(slvFoods: SlvFoodForPrompt[]): string {
  if (slvFoods.length === 0) {
    return '<livsmedelsverket count="0">SLV-data ej tillgänglig</livsmedelsverket>';
  }

  const formatSlvFood = (f: SlvFoodForPrompt) => {
    const micros = [];
    if (f.iron) micros.push(`Fe${f.iron}mg`);
    if (f.calcium) micros.push(`Ca${f.calcium}mg`);
    if (f.vitaminD) micros.push(`D${f.vitaminD}µg`);
    if (f.vitaminB12) micros.push(`B12${f.vitaminB12}µg`);
    if (f.folate) micros.push(`Fol${f.folate}µg`);
    if (f.magnesium) micros.push(`Mg${f.magnesium}mg`);
    if (f.zinc) micros.push(`Zn${f.zinc}mg`);

    return `  ${f.namn}: ${f.kcal}kcal P${f.protein}g K${f.carbs}g F${f.fat}g | ${micros.slice(0, 4).join(' ')}`;
  };

  // Kategorisera livsmedel för bättre överblick
  const highProtein = slvFoods
    .filter(f => f.protein > 15)
    .sort((a, b) => b.protein - a.protein)
    .slice(0, 40);

  const carbohydrateSources = slvFoods
    .filter(f => f.carbs > 20 && f.protein < 10)
    .sort((a, b) => b.carbs - a.carbs)
    .slice(0, 30);

  const fatSources = slvFoods
    .filter(f => f.fat > 15 && f.carbs < 10)
    .sort((a, b) => b.fat - a.fat)
    .slice(0, 25);

  const vegetables = slvFoods
    .filter(f => f.typ?.toLowerCase().includes('grönsak') ||
                 f.kcal < 50 && f.fiber && f.fiber > 1)
    .slice(0, 40);

  const fruits = slvFoods
    .filter(f => f.typ?.toLowerCase().includes('frukt') ||
                 f.typ?.toLowerCase().includes('bär'))
    .slice(0, 30);

  const dairy = slvFoods
    .filter(f => f.typ?.toLowerCase().includes('mjölk') ||
                 f.typ?.toLowerCase().includes('ost') ||
                 f.typ?.toLowerCase().includes('mejeri') ||
                 f.namn.toLowerCase().includes('yoghurt') ||
                 f.namn.toLowerCase().includes('kvarg'))
    .slice(0, 30);

  const highIron = slvFoods
    .filter(f => (f.iron ?? 0) > 3)
    .sort((a, b) => (b.iron ?? 0) - (a.iron ?? 0))
    .slice(0, 20);

  const highCalcium = slvFoods
    .filter(f => (f.calcium ?? 0) > 100)
    .sort((a, b) => (b.calcium ?? 0) - (a.calcium ?? 0))
    .slice(0, 20);

  const highVitaminD = slvFoods
    .filter(f => (f.vitaminD ?? 0) > 1)
    .sort((a, b) => (b.vitaminD ?? 0) - (a.vitaminD ?? 0))
    .slice(0, 20);

  return `<livsmedelsverket count="${slvFoods.length}">
LIVSMEDELSVERKETS OFFICIELLA DATABAS
Alla värden per 100g. Detta är den ENDA datakällan du ska använda.

[PROTEINKÄLLOR - Kött, fisk, ägg, baljväxter (>15g protein/100g)]
${highProtein.map(formatSlvFood).join('\n')}

[KOLHYDRATKÄLLOR - Spannmål, bröd, pasta, ris]
${carbohydrateSources.map(formatSlvFood).join('\n')}

[FETTKÄLLOR - Oljor, nötter, frön]
${fatSources.map(formatSlvFood).join('\n')}

[MEJERIPRODUKTER - Mjölk, yoghurt, ost, kvarg]
${dairy.map(formatSlvFood).join('\n')}

[GRÖNSAKER - Låg energitäthet, hög fiberhalt]
${vegetables.map(formatSlvFood).join('\n')}

[FRUKT & BÄR]
${fruits.map(formatSlvFood).join('\n')}

[JÄRNRIKA LIVSMEDEL (>3mg/100g)]
${highIron.map(formatSlvFood).join('\n')}

[KALCIUMRIKA LIVSMEDEL (>100mg/100g)]
${highCalcium.map(formatSlvFood).join('\n')}

[VITAMIN D-RIKA LIVSMEDEL (>1µg/100g)]
${highVitaminD.map(formatSlvFood).join('\n')}

VIKTIGT: Använd EXAKT dessa namn och näringsvärden från Livsmedelsverket.
</livsmedelsverket>`;
}

/**
 * Hämtar standardinställningar för coach
 */
export function getDefaultSettings(): CoachAISettingsInput {
  return DEFAULT_COACH_SETTINGS;
}

/**
 * Formaterar ett kort sammanfattning av mikronutrienter för en måltid
 */
export function formatMicronutrientSummary(
  foods: { namn: string; grams: number; slvData?: SlvFoodForPrompt }[],
  gender: 'male' | 'female'
): string {
  const rdi = gender === 'male' ? RDI_MAN : RDI_KVINNA;

  // Beräkna totala intag
  let totalIron = 0;
  let totalCalcium = 0;
  let totalVitaminD = 0;
  let totalB12 = 0;
  let totalFolate = 0;

  for (const food of foods) {
    if (food.slvData) {
      const factor = food.grams / 100;
      totalIron += (food.slvData.iron ?? 0) * factor;
      totalCalcium += (food.slvData.calcium ?? 0) * factor;
      totalVitaminD += (food.slvData.vitaminD ?? 0) * factor;
      totalB12 += (food.slvData.vitaminB12 ?? 0) * factor;
      totalFolate += (food.slvData.folate ?? 0) * factor;
    }
  }

  const lines = [];

  if (totalIron > 0) {
    const pct = Math.round((totalIron / rdi.iron) * 100);
    lines.push(`Järn: ${totalIron.toFixed(1)}mg (${pct}% av RDI)`);
  }
  if (totalCalcium > 0) {
    const pct = Math.round((totalCalcium / rdi.calcium) * 100);
    lines.push(`Kalcium: ${totalCalcium.toFixed(0)}mg (${pct}% av RDI)`);
  }
  if (totalVitaminD > 0) {
    const pct = Math.round((totalVitaminD / rdi.vitaminD) * 100);
    lines.push(`Vitamin D: ${totalVitaminD.toFixed(1)}µg (${pct}% av RDI)`);
  }
  if (totalB12 > 0) {
    const pct = Math.round((totalB12 / rdi.vitaminB12) * 100);
    lines.push(`Vitamin B12: ${totalB12.toFixed(1)}µg (${pct}% av RDI)`);
  }
  if (totalFolate > 0) {
    const pct = Math.round((totalFolate / rdi.folate) * 100);
    lines.push(`Folat: ${totalFolate.toFixed(0)}µg (${pct}% av RDI)`);
  }

  return lines.length > 0 ? lines.join('\n') : 'Ingen mikronutrientdata tillgänglig';
}
