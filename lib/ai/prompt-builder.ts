/**
 * Prompt Builder för AI Kostplaneringsagenten
 *
 * Bygger XML-strukturerade systempromptar enligt Anthropic best practices.
 * Inkluderar:
 * - Din livsmedelsbank (375 produkter)
 * - Receptbanken (314 recept)
 * - Livsmedelsverket SLV (2575 livsmedel + mikronutrienter)
 * - Coach-inställningar
 * - Klientminne
 */

import {
  PromptContext,
  CoachAISettingsInput,
  DEFAULT_COACH_SETTINGS,
  ProductForPrompt,
  RecipeForPrompt,
  SlvFoodForPrompt,
  RDI_MAN,
  RDI_KVINNA,
} from './types';

/**
 * Bygger den kompletta systemprompten för AI-agenten
 */
export function buildSystemPrompt(context: PromptContext): string {
  const { client, plan, products, recipes, slvFoods, settings, memory } = context;

  // Välj RDI baserat på kön
  const rdi = client.gender === 'male' ? RDI_MAN : RDI_KVINNA;

  return `
<role>
Du är en forskningsbaserad kostplaneringsassistent för Friskvårdskompassen.
Målgrupp: "Vardagsatleten" – personer som jobbar heltid och vill optimera sin kost.
Du har tillgång till tre datakällor: coach-produkter, recept och Livsmedelsverkets databas.
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

${buildProductsSection(products)}

${buildRecipesSection(recipes)}

${buildSlvSection(slvFoods)}

<instruktioner>
1. Visa ALLTID din tankegång först i <reasoning>...</reasoning> tags
2. Använd PRIMÄRT produkter från coach-livsmedelsbanken för bästa matchning
3. Använd SLV-livsmedel för att komplettera med näringsrika alternativ och mikronutrienter
4. Ange exakta mängder i gram
5. Ge 1-2 alternativ per huvudingrediens
6. Kontrollera allergier innan förslag
7. Vid mikronutrientfrågor, använd SLV-data för exakta värden
8. Svara ALLTID på svenska
9. Formatera output tydligt med makros per livsmedel
</instruktioner>

<output_format>
När du föreslår måltider, använd detta format:

MÅLTID X - [TYP] (tid)
Makromål: P Xg | K Xg | F Xg | X kcal

LIVSMEDEL:
├─ [Namn]: Xg (P Xg, K Xg, F Xg)
├─ [Namn]: Xg (P Xg, K Xg, F Xg)
└─ [Namn]: Xg (P Xg, K Xg, F Xg)
   ─────────────────────────────
   TOTALT: P Xg | K Xg | F Xg | X kcal

ALTERNATIV:
• Byt [X] mot [Y] (anledning)

MIKRONUTRIENTER (om relevant):
• Järn: X mg (X% av RDI)
• Vitamin D: X µg (X% av RDI)
</output_format>
`.trim();
}

/**
 * Bygger produktsektionen för prompten
 */
function buildProductsSection(products: ProductForPrompt[]): string {
  if (products.length === 0) {
    return '<coach_livsmedelsbank count="0">Inga produkter tillgängliga</coach_livsmedelsbank>';
  }

  // Gruppera efter kategori
  const byCategory = products.reduce((acc, p) => {
    if (!acc[p.category]) acc[p.category] = [];
    acc[p.category].push(p);
    return acc;
  }, {} as Record<string, ProductForPrompt[]>);

  const sections = Object.entries(byCategory).map(([category, items]) => {
    const itemsList = items
      .slice(0, 50) // Begränsa per kategori
      .map(p => `  ${p.name}: ${p.kcal}kcal P${p.protein}g K${p.carbs}g F${p.fat}g`)
      .join('\n');
    return `[${category}]\n${itemsList}`;
  });

  return `<coach_livsmedelsbank count="${products.length}">
Dina egna produkter med makros per 100g:

${sections.join('\n\n')}
</coach_livsmedelsbank>`;
}

/**
 * Bygger receptsektionen för prompten
 */
function buildRecipesSection(recipes: RecipeForPrompt[]): string {
  if (recipes.length === 0) {
    return '<receptbank count="0">Inga recept tillgängliga</receptbank>';
  }

  // Gruppera efter kategori
  const byCategory = recipes.reduce((acc, r) => {
    if (!acc[r.category]) acc[r.category] = [];
    acc[r.category].push(r);
    return acc;
  }, {} as Record<string, RecipeForPrompt[]>);

  const sections = Object.entries(byCategory).map(([category, items]) => {
    const itemsList = items
      .slice(0, 30)
      .map(r => `  ${r.title} (${r.prepTimeMinutes}min): P${r.proteinPerServing}g K${r.carbsPerServing}g F${r.fatPerServing}g`)
      .join('\n');
    return `[${category}]\n${itemsList}`;
  });

  return `<receptbank count="${recipes.length}">
Recept med makros per portion:

${sections.join('\n\n')}
</receptbank>`;
}

/**
 * Bygger SLV-sektionen med mikronutrienter
 * Väljer ut de mest relevanta livsmedlen för kostplanering
 */
function buildSlvSection(slvFoods: SlvFoodForPrompt[]): string {
  if (slvFoods.length === 0) {
    return '<livsmedelsverket count="0">SLV-data ej tillgänglig</livsmedelsverket>';
  }

  // Välj ut topp-livsmedel för varje näringsämne för snabb referens
  const highProtein = slvFoods
    .filter(f => f.protein > 15)
    .sort((a, b) => b.protein - a.protein)
    .slice(0, 20);

  const highIron = slvFoods
    .filter(f => (f.iron ?? 0) > 3)
    .sort((a, b) => (b.iron ?? 0) - (a.iron ?? 0))
    .slice(0, 15);

  const highCalcium = slvFoods
    .filter(f => (f.calcium ?? 0) > 100)
    .sort((a, b) => (b.calcium ?? 0) - (a.calcium ?? 0))
    .slice(0, 15);

  const highVitaminD = slvFoods
    .filter(f => (f.vitaminD ?? 0) > 1)
    .sort((a, b) => (b.vitaminD ?? 0) - (a.vitaminD ?? 0))
    .slice(0, 15);

  const highOmega3Sources = slvFoods
    .filter(f => f.namn.toLowerCase().includes('lax') ||
                 f.namn.toLowerCase().includes('makrill') ||
                 f.namn.toLowerCase().includes('sill') ||
                 f.namn.toLowerCase().includes('sardiner'))
    .slice(0, 10);

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

  return `<livsmedelsverket count="${slvFoods.length}">
Livsmedelsverkets databas med mikronutrienter per 100g.

[PROTEINKÄLLOR (>15g protein)]
${highProtein.map(formatSlvFood).join('\n')}

[JÄRNRIKA (>3mg järn)]
${highIron.map(formatSlvFood).join('\n')}

[KALCIUMRIKA (>100mg)]
${highCalcium.map(formatSlvFood).join('\n')}

[VITAMIN D-RIKA (>1µg)]
${highVitaminD.map(formatSlvFood).join('\n')}

[OMEGA-3 KÄLLOR (fet fisk)]
${highOmega3Sources.map(formatSlvFood).join('\n')}

OBS: För fullständiga näringsdata på specifika livsmedel, fråga och jag kan slå upp det.
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
