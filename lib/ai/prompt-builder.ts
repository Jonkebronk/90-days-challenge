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
11. När användaren skickar en BILD av ett kostschema:
    - Läs av alla måltider och livsmedel från bilden
    - Identifiera gramvikter för varje livsmedel
    - Matcha livsmedel mot SLV-databasen
    - Generera output i standardformatet (MÅLTID X med livsmedel och makros)
    - Behåll strukturen från originalbilden
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
 * Bygger SLV-sektionen med råvaror från Livsmedelsverket
 * Kategoriserar efter makronäringsämne (protein, kolhydrat, fett)
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

    return `  ${f.namn}: ${f.kcal}kcal P${f.protein}g K${f.carbs}g F${f.fat}g${micros.length > 0 ? ' | ' + micros.join(' ') : ''}`;
  };

  // PROTEINKÄLLOR: Kött, fisk, fågel, skaldjur (högt protein, lågt fett)
  // Kvarg klassas som protein pga hög proteinhalt
  const proteinSources = slvFoods
    .filter(f => {
      const name = f.namn.toLowerCase();
      const typ = (f.typ || '').toLowerCase();
      // Kött, fisk, fågel, skaldjur
      if (typ.includes('kött') || typ.includes('fisk') || typ.includes('fågel') ||
          typ.includes('skaldjur') || name.includes('kvarg')) {
        return f.protein > 10;
      }
      // Baljväxter (linser, bönor)
      if (typ.includes('baljväxt')) {
        return f.protein > 5;
      }
      return false;
    })
    .sort((a, b) => b.protein - a.protein)
    .slice(0, 50);

  // KOLHYDRATKÄLLOR: Spannmål, bröd, pasta, ris, frukt, bär, potatis
  // Havregryn, ris, pasta, banan, bär = kolhydrater
  const carbSources = slvFoods
    .filter(f => {
      const name = f.namn.toLowerCase();
      const typ = (f.typ || '').toLowerCase();
      // Spannmål, gryn, mjöl, bröd
      if (typ.includes('gryn') || typ.includes('mjöl') || typ.includes('bröd') ||
          typ.includes('pasta') || typ.includes('ris') || typ.includes('potatis') ||
          typ.includes('flingor')) {
        return f.carbs > 15;
      }
      // Frukt och bär
      if (typ.includes('frukt') || typ.includes('bär')) {
        return f.carbs > 5;
      }
      // Specifika kolhydratkällor
      if (name.includes('havre') || name.includes('ris') || name.includes('pasta') ||
          name.includes('banan') || name.includes('potatis') || name.includes('bröd')) {
        return f.carbs > 10;
      }
      return false;
    })
    .sort((a, b) => b.carbs - a.carbs)
    .slice(0, 50);

  // FETTKÄLLOR: Nötter, frön, oljor, ägg, ost, avokado
  // Ägg klassas som fett pga hög fetthalt relativt
  const fatSources = slvFoods
    .filter(f => {
      const name = f.namn.toLowerCase();
      const typ = (f.typ || '').toLowerCase();
      // Nötter, frön, oljor
      if (typ.includes('nöt') || typ.includes('frö') || typ.includes('olja') ||
          typ.includes('smör') || typ.includes('fett')) {
        return f.fat > 10;
      }
      // Ägg (fettkälla)
      if (name.includes('ägg') && !name.includes('lägg')) {
        return true;
      }
      // Ost (fettkälla)
      if (typ.includes('ost') && f.fat > 15) {
        return true;
      }
      // Avokado
      if (name.includes('avokado')) {
        return true;
      }
      return false;
    })
    .sort((a, b) => b.fat - a.fat)
    .slice(0, 40);

  // GRÖNSAKER: Låg energitäthet
  const vegetables = slvFoods
    .filter(f => {
      const typ = (f.typ || '').toLowerCase();
      return typ.includes('grönsak') || typ.includes('rotfrukt') || typ.includes('svamp');
    })
    .slice(0, 50);

  // MEJERI: Mjölk, yoghurt (inte ost - det är fettkälla)
  const dairy = slvFoods
    .filter(f => {
      const typ = (f.typ || '').toLowerCase();
      const name = f.namn.toLowerCase();
      return (typ.includes('mjölk') || typ.includes('yoghurt') || typ.includes('fil') ||
              name.includes('yoghurt') || name.includes('mjölk')) && f.fat < 10;
    })
    .slice(0, 20);

  return `<livsmedelsverket count="${slvFoods.length}">
LIVSMEDELSVERKETS OFFICIELLA DATABAS - ENDAST RÅVAROR
Alla värden per 100g. Använd EXAKT dessa namn och näringsvärden.

KATEGORISERING FÖR KOSTSCHEMA:
- PROTEINKÄLLOR: Kött, fisk, fågel, skaldjur, kvarg, baljväxter
- KOLHYDRATKÄLLOR: Havregryn, ris, pasta, bröd, potatis, frukt, bär
- FETTKÄLLOR: Ägg, nötter, frön, oljor, ost, avokado

[PROTEINKÄLLOR]
${proteinSources.map(formatSlvFood).join('\n')}

[KOLHYDRATKÄLLOR - Spannmål, frukt, bär, potatis]
${carbSources.map(formatSlvFood).join('\n')}

[FETTKÄLLOR - Ägg, nötter, oljor, ost]
${fatSources.map(formatSlvFood).join('\n')}

[GRÖNSAKER]
${vegetables.map(formatSlvFood).join('\n')}

[MEJERI - Mjölk, yoghurt]
${dairy.map(formatSlvFood).join('\n')}
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
