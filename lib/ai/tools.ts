/**
 * Juni AI Agent - Tool Definitions
 *
 * Dessa tools ger Juni möjlighet att:
 * 1. Söka i livsmedelsdatabaser (SLV + Product)
 * 2. Beräkna makronäringsämnen
 * 3. Validera kostplaner
 * 4. Skapa och spara kostscheman
 * 5. Hantera klientdata och preferenser
 */

import type { Tool } from '@anthropic-ai/sdk/resources/messages';

// =============================================================================
// KOSTPLANERINGS-TOOLS
// =============================================================================

export const JUNI_TOOLS: Tool[] = [
  {
    name: 'search_foods',
    description: `Sök efter livsmedel i Livsmedelsverkets databas (SLV) eller produktbiblioteket.
Returnerar matchande livsmedel med fullständig näringsinformation (kcal, protein, kolhydrater, fett, fiber).
Använd denna för att hitta exakta näringsvärden - gissa ALDRIG näringsinnehåll.

<examples>
<example>
<description>Söka efter proteinkällor</description>
<input>{"query": "kycklingbröst", "category": "protein", "max_results": 5}</input>
<output>{"success": true, "data": {"results": [{"id": "1234", "name": "Kycklingbröstfilé", "per100g": {"kcal": 110, "protein": 23.1, "carbs": 0, "fat": 1.3}}]}}</output>
</example>
<example>
<description>Söka efter kolhydratkällor</description>
<input>{"query": "havregryn"}</input>
<output>{"success": true, "data": {"results": [{"id": "567", "name": "Havregryn", "per100g": {"kcal": 372, "protein": 12.5, "carbs": 59.8, "fat": 7.0}}]}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: "Sökterm, t.ex. 'kycklingbröst', 'havregryn', 'kvarg'"
        },
        category: {
          type: 'string',
          enum: ['protein', 'carbs', 'fat', 'vegetables', 'berries', 'dairy', 'all'],
          description: 'Filtrera på kategori (valfritt, default: all)'
        },
        max_results: {
          type: 'number',
          description: 'Max antal resultat (default: 10, max: 50)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'calculate_macros',
    description: `Beräkna makronäringsämnen för en måltid baserat på livsmedel och gramvikter.
Returnerar totalt protein, kolhydrater, fett och kalorier.
Använd RÅ VIKT (före tillagning) för korrekta beräkningar.

<examples>
<example>
<description>Beräkna makros för en frukost</description>
<input>{"items": [{"food_id": "1234", "food_name": "Havregryn", "grams": 80}, {"food_id": "5678", "food_name": "Mjölk", "grams": 200}, {"food_id": "9012", "food_name": "Banan", "grams": 120}]}</input>
<output>{"success": true, "data": {"totals": {"kcal": 485, "protein": 18.2, "carbs": 78.5, "fat": 9.3}, "items": [...]}}</output>
</example>
<example>
<description>Beräkna makros för en proteinrik måltid</description>
<input>{"items": [{"food_name": "kycklingbröst", "grams": 150}, {"food_name": "jasminris kokt", "grams": 200}, {"food_name": "broccoli", "grams": 100}]}</input>
<output>{"success": true, "data": {"totals": {"kcal": 412, "protein": 42.5, "carbs": 52.0, "fat": 3.2}}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        items: {
          type: 'array',
          description: 'Lista av livsmedel med gramvikter',
          items: {
            type: 'object',
            properties: {
              food_id: {
                type: 'string',
                description: 'SLV-nummer (t.ex. "1234") eller produkt-ID'
              },
              food_name: {
                type: 'string',
                description: 'Namn på livsmedlet (för backup-sökning)'
              },
              grams: {
                type: 'number',
                description: 'Vikt i gram (RÅ vikt före tillagning)'
              }
            },
            required: ['grams']
          }
        }
      },
      required: ['items']
    }
  },
  {
    name: 'validate_meal_plan',
    description: `Validera en kostplan mot makromål och näringsregler.
Kontrollerar:
- Totalt protein (g/kg kroppsvikt)
- Proteinfördelning mellan måltider
- Kaloribalans (±5% av mål)
- Kolhydrat- och fettfördelning
- Allergier och undvikna livsmedel
Returnerar godkänt/ej godkänt samt förslag på förbättringar.

<examples>
<example>
<description>Validera en komplett dagsplan</description>
<input>{"meals": [{"name": "Frukost", "macros": {"kcal": 450, "protein": 25, "carbs": 55, "fat": 12}}, {"name": "Lunch", "macros": {"kcal": 600, "protein": 40, "carbs": 60, "fat": 18}}], "target_macros": {"kcal": 2200, "protein": 150, "carbs": 220, "fat": 70}, "client_weight_kg": 80}</input>
<output>{"success": true, "data": {"valid": false, "issues": ["Endast 2 måltider angivna", "Protein saknas för att nå 150g (nu: 65g)"], "suggestions": ["Lägg till fler måltider", "Öka proteinkällan i befintliga måltider"]}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        meals: {
          type: 'array',
          description: 'Lista av måltider med livsmedel och makros'
        },
        target_macros: {
          type: 'object',
          description: 'Målvärden för dagen',
          properties: {
            protein: { type: 'number', description: 'Protein i gram' },
            carbs: { type: 'number', description: 'Kolhydrater i gram' },
            fat: { type: 'number', description: 'Fett i gram' },
            kcal: { type: 'number', description: 'Totala kalorier' }
          }
        },
        client_weight_kg: {
          type: 'number',
          description: 'Klientens vikt för g/kg-beräkningar'
        },
        allergies: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista av allergier att kontrollera mot'
        }
      },
      required: ['meals', 'target_macros']
    }
  },
  {
    name: 'propose_meal_plan',
    description: `Föreslå en komplett kostplan för GODKÄNNANDE.
VIKTIGT: Denna funktion SPARAR INTE planen - den presenterar förslaget för användaren.
Användaren MÅSTE godkänna innan save_meal_plan anropas.
Inkludera alltid en tydlig sammanfattning av förslaget.

<examples>
<example>
<description>Föreslå ett komplett dagsschema</description>
<input>{
  "meals": [
    {"meal_index": 0, "meal_name": "Frukost", "items": [{"food_name": "Havregryn", "grams": 80, "category": "carb"}, {"food_name": "Kvarg naturell", "grams": 200, "category": "protein"}], "macros": {"kcal": 450, "protein": 30, "carbs": 55, "fat": 8}},
    {"meal_index": 1, "meal_name": "Lunch", "items": [...], "macros": {...}}
  ],
  "summary": "Här är ett förslag på dagsschema med 2200 kcal, 150g protein, 220g kolhydrater och 70g fett. Frukost är proteinrik för att komma igång bra.",
  "total_macros": {"kcal": 2200, "protein": 150, "carbs": 220, "fat": 70}
}</input>
<output>{"success": true, "requires_approval": true, "approval_type": "meal_plan", "summary": "Förslag redo - väntar på godkännande"}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        meals: {
          type: 'array',
          description: 'Kompletta måltider med livsmedel, gramvikter och beräknade makros',
          items: {
            type: 'object',
            properties: {
              meal_index: { type: 'number', description: '0-baserat index (0=frukost)' },
              meal_name: { type: 'string', description: 'Namn på måltiden' },
              items: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    food_id: { type: 'string' },
                    food_name: { type: 'string' },
                    grams: { type: 'number' },
                    category: { type: 'string', enum: ['protein', 'carb', 'fat', 'vegetable', 'berry', 'sauce'] }
                  }
                }
              },
              macros: {
                type: 'object',
                properties: {
                  protein: { type: 'number' },
                  carbs: { type: 'number' },
                  fat: { type: 'number' },
                  kcal: { type: 'number' }
                }
              }
            }
          }
        },
        summary: {
          type: 'string',
          description: 'Tydlig sammanfattning av förslaget för användaren (inkludera totala makros)'
        },
        total_macros: {
          type: 'object',
          description: 'Totala makros för hela dagen',
          properties: {
            protein: { type: 'number' },
            carbs: { type: 'number' },
            fat: { type: 'number' },
            kcal: { type: 'number' }
          }
        }
      },
      required: ['meals', 'summary']
    }
  },
  {
    name: 'save_meal_plan',
    description: `Spara en GODKÄND kostplan till databasen.
VIKTIGT: Använd ENDAST efter att användaren explicit har godkänt förslaget (sagt "OK", "ja", "godkänt", etc).
Anropa ALDRIG denna utan föregående godkännande.

<examples>
<example>
<description>Spara efter användarens godkännande</description>
<input>{"nutrition_plan_id": "plan_abc123", "meals": [{"meal_index": 0, "meal_name": "Frukost", "items": [...]}]}</input>
<output>{"success": true, "data": {"saved": true, "meal_plan_id": "mp_xyz789", "message": "Kostschema sparat!"}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        nutrition_plan_id: {
          type: 'string',
          description: 'ID för kostplanen att uppdatera'
        },
        meals: {
          type: 'array',
          description: 'Måltiderna att spara (samma format som propose_meal_plan)'
        }
      },
      required: ['nutrition_plan_id', 'meals']
    }
  },
  {
    name: 'get_client_info',
    description: `Hämta information om klienten.
Returnerar: vikt, längd, ålder, kön, allergier, matpreferenser, kostmål, makromål.
Använd denna i början av varje session för att förstå klientens behov.

<examples>
<example>
<description>Hämta klientinfo via kostplan-ID</description>
<input>{"nutrition_plan_id": "plan_abc123"}</input>
<output>{"success": true, "data": {"name": "Anna", "weight_kg": 65, "height_cm": 168, "age": 32, "gender": "female", "allergies": ["gluten"], "goal": "lose_weight", "target_macros": {"kcal": 1800, "protein": 130, "carbs": 180, "fat": 60}}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: {
          type: 'string',
          description: 'Klientens ID'
        },
        nutrition_plan_id: {
          type: 'string',
          description: 'Kostplanens ID (alternativt sätt att hämta klientinfo)'
        }
      },
      required: []
    }
  },
  {
    name: 'update_client_memory',
    description: `Spara nya preferenser eller insikter om klienten för framtida sessioner.
Använd denna när användaren nämner vad de gillar, ogillar, eller vad som fungerat bra/dåligt.
Exempel: "Jag gillar inte broccoli" -> preference_type: "dislikes", content: "broccoli"

<examples>
<example>
<description>Spara att klienten gillar något</description>
<input>{"client_id": "user_123", "preference_type": "likes", "content": "kvarg med blåbär"}</input>
<output>{"success": true, "data": {"saved": true, "message": "Preferens sparad"}}</output>
</example>
<example>
<description>Spara att något fungerar bra</description>
<input>{"client_id": "user_123", "preference_type": "works_well", "content": "större frukost, mindre kvällsmat"}</input>
<output>{"success": true, "data": {"saved": true}}</output>
</example>
<example>
<description>Spara mönster att undvika</description>
<input>{"client_id": "user_123", "preference_type": "avoid_pattern", "content": "för mycket kolhydrater på kvällen ger dålig sömn"}</input>
<output>{"success": true, "data": {"saved": true}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: {
          type: 'string',
          description: 'Klientens ID'
        },
        preference_type: {
          type: 'string',
          enum: ['likes', 'dislikes', 'works_well', 'avoid_pattern'],
          description: 'Typ av preferens: gillar, ogillar, fungerar bra, undvik mönster'
        },
        content: {
          type: 'string',
          description: 'Preferensen att spara (t.ex. "broccoli", "stora frukostar", "mjölkprodukter efter träning")'
        }
      },
      required: ['client_id', 'preference_type', 'content']
    }
  },
  {
    name: 'search_recipes',
    description: `Sök efter recept i receptbanken.
Returnerar matchande recept med ingredienser och näringsinformation per portion.
Använd denna för att hitta recept som passar klientens kostschema.

<examples>
<example>
<description>Söka efter högprotein-recept</description>
<input>{"query": "kyckling", "min_protein": 30, "max_results": 5}</input>
<output>{"success": true, "data": {"results": [{"id": "rec_123", "title": "Kycklinggryta med ris", "servings": 4, "per_serving": {"kcal": 450, "protein": 38, "carbs": 40, "fat": 12}, "prep_time": 15, "cook_time": 30}]}}</output>
</example>
<example>
<description>Söka efter vegetariska frukostar</description>
<input>{"query": "frukost", "meal_type": "breakfast", "dietary_tags": ["vegetarian"]}</input>
<output>{"success": true, "data": {"results": [{"id": "rec_456", "title": "Overnight Oats med bär", "per_serving": {"kcal": 380, "protein": 18, "carbs": 52, "fat": 9}}]}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Sökterm, t.ex. "kycklinggryta", "overnight oats", "proteinpannkakor"'
        },
        meal_type: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack', 'dessert', 'all'],
          description: 'Typ av måltid (valfritt, default: all)'
        },
        dietary_tags: {
          type: 'array',
          items: { type: 'string' },
          description: 'Filtrera på kostrestriktioner: vegan, vegetarian, gluten-free, dairy-free, keto, paleo'
        },
        max_calories: {
          type: 'number',
          description: 'Max kalorier per portion (valfritt)'
        },
        min_protein: {
          type: 'number',
          description: 'Minimum protein per portion i gram (valfritt)'
        },
        max_results: {
          type: 'number',
          description: 'Max antal resultat (default: 10, max: 20)'
        }
      },
      required: ['query']
    }
  },
  {
    name: 'suggest_recipes_for_meal',
    description: `Föreslå recept från receptbanken som passar en specifik måltid i kostschemat.
Matchar recept baserat på makromålen för måltiden och klientens preferenser.
Returnerar 3-5 passande receptförslag med näringsinfo.

<examples>
<example>
<description>Hitta receptförslag för en lunchmåltid</description>
<input>{"meal_index": 1, "target_macros": {"kcal": 550, "protein": 40, "carbs": 50, "fat": 18}, "meal_type": "lunch", "exclude_ingredients": ["nötter"]}</input>
<output>{"success": true, "data": {"suggestions": [{"id": "rec_789", "title": "Laxsallad med quinoa", "match_score": 92, "per_serving": {"kcal": 530, "protein": 42, "carbs": 48, "fat": 16}}, {"id": "rec_456", "title": "Kycklingwok", "match_score": 85}]}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        meal_index: {
          type: 'number',
          description: 'Index för måltiden (0=frukost, 1=lunch, etc.)'
        },
        target_macros: {
          type: 'object',
          description: 'Målvärden för måltiden',
          properties: {
            protein: { type: 'number', description: 'Protein i gram' },
            carbs: { type: 'number', description: 'Kolhydrater i gram' },
            fat: { type: 'number', description: 'Fett i gram' },
            kcal: { type: 'number', description: 'Kalorier' }
          }
        },
        meal_type: {
          type: 'string',
          enum: ['breakfast', 'lunch', 'dinner', 'snack'],
          description: 'Typ av måltid för bättre matchning'
        },
        exclude_ingredients: {
          type: 'array',
          items: { type: 'string' },
          description: 'Ingredienser att undvika (allergier, preferenser)'
        }
      },
      required: ['meal_index', 'target_macros']
    }
  },
  {
    name: 'get_recipe_details',
    description: `Hämta fullständig information om ett specifikt recept.
Inkluderar ingredienser med gramvikter, instruktioner, och näringsinfo.
Använd denna när användaren vill se ett helt recept.

<examples>
<example>
<description>Hämta detaljer för ett recept</description>
<input>{"recipe_id": "rec_123"}</input>
<output>{"success": true, "data": {"id": "rec_123", "title": "Kycklinggryta med ris", "description": "En enkel och proteinrik gryta", "servings": 4, "prep_time": 15, "cook_time": 30, "ingredients": [{"name": "Kycklingbröst", "amount_grams": 500, "display_amount": "500", "display_unit": "g"}, {"name": "Jasminris", "amount_grams": 320, "display_amount": "4", "display_unit": "dl"}], "instructions": [{"step": 1, "instruction": "Skär kycklingen i bitar"}, {"step": 2, "instruction": "Stek kycklingen i olivolja"}], "per_serving": {"kcal": 450, "protein": 38, "carbs": 40, "fat": 12}}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        recipe_id: {
          type: 'string',
          description: 'Receptets ID'
        }
      },
      required: ['recipe_id']
    }
  }
];

// =============================================================================
// WIZARD-TOOLS (för att skapa nya kostplaner)
// =============================================================================

export const WIZARD_TOOLS: Tool[] = [
  {
    name: 'calculate_bmr_tdee',
    description: `Beräkna BMR (Basal Metabolic Rate) och TDEE (Total Daily Energy Expenditure).
Använder Mifflin-St Jeor-ekvationen:
- Män: (10 × vikt) + (6.25 × längd) - (5 × ålder) + 5
- Kvinnor: (10 × vikt) + (6.25 × längd) - (5 × ålder) - 161

TDEE = BMR × aktivitetsfaktor

<examples>
<example>
<description>Beräkna för en aktiv man</description>
<input>{"age": 35, "gender": "male", "height_cm": 180, "weight_kg": 82, "activity_level": "moderately_active"}</input>
<output>{"success": true, "data": {"bmr": 1798, "tdee": 2787, "activity_factor": 1.55, "explanation": "BMR 1798 kcal × 1.55 (måttligt aktiv) = 2787 kcal TDEE"}}</output>
</example>
<example>
<description>Beräkna för en kvinna med stillasittande jobb</description>
<input>{"age": 28, "gender": "female", "height_cm": 165, "weight_kg": 62, "activity_level": "lightly_active"}</input>
<output>{"success": true, "data": {"bmr": 1392, "tdee": 1914, "activity_factor": 1.375}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        age: {
          type: 'number',
          description: 'Ålder i år'
        },
        gender: {
          type: 'string',
          enum: ['male', 'female'],
          description: 'Biologiskt kön för BMR-beräkning'
        },
        height_cm: {
          type: 'number',
          description: 'Längd i centimeter'
        },
        weight_kg: {
          type: 'number',
          description: 'Vikt i kilogram'
        },
        activity_level: {
          type: 'string',
          enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active'],
          description: `Aktivitetsnivå:
- sedentary: Stillasittande (faktor 1.2)
- lightly_active: Lätt aktiv, 1-3 träningar/vecka (faktor 1.375)
- moderately_active: Måttligt aktiv, 3-5 träningar/vecka (faktor 1.55)
- very_active: Mycket aktiv, 6-7 träningar/vecka (faktor 1.725)
- extremely_active: Extremt aktiv, fysiskt jobb + träning (faktor 1.9)`
        }
      },
      required: ['age', 'gender', 'height_cm', 'weight_kg', 'activity_level']
    }
  },
  {
    name: 'calculate_macro_targets',
    description: `Beräkna dagliga makromål baserat på TDEE och mål.

Riktlinjer:
- Viktminskning: -300 till -500 kcal deficit, protein 2.0-2.2 g/kg
- Muskelbyggande: +200 till +300 kcal överskott, protein 1.8-2.0 g/kg
- Underhåll/Hälsa: TDEE, protein 1.6-1.8 g/kg

Fördelning:
- Protein: 25-35% av kalorier
- Fett: 25-35% av kalorier (min 0.7 g/kg)
- Kolhydrater: Resterande kalorier

<examples>
<example>
<description>Beräkna makromål för viktminskning</description>
<input>{"tdee": 2400, "goal": "lose_weight", "intensity": "moderate", "weight_kg": 80}</input>
<output>{"success": true, "data": {"daily_calories": 2000, "deficit": 400, "protein_grams": 160, "carb_grams": 200, "fat_grams": 56, "protein_per_kg": 2.0, "explanation": "TDEE 2400 - 400 deficit = 2000 kcal. Protein 2.0g/kg för att bevara muskelmassa."}}</output>
</example>
<example>
<description>Beräkna makromål för muskelbyggande</description>
<input>{"tdee": 2600, "goal": "build_muscle", "weight_kg": 75}</input>
<output>{"success": true, "data": {"daily_calories": 2850, "surplus": 250, "protein_grams": 142, "carb_grams": 356, "fat_grams": 79, "protein_per_kg": 1.9}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        tdee: {
          type: 'number',
          description: 'TDEE i kcal (från calculate_bmr_tdee)'
        },
        goal: {
          type: 'string',
          enum: ['lose_weight', 'build_muscle', 'maintain', 'health'],
          description: 'Primärt mål'
        },
        intensity: {
          type: 'string',
          enum: ['conservative', 'moderate', 'aggressive'],
          description: 'Intensitet: conservative (-300kcal), moderate (-400kcal), aggressive (-500kcal)'
        },
        weight_kg: {
          type: 'number',
          description: 'Vikt i kg för g/kg-beräkningar'
        }
      },
      required: ['tdee', 'goal', 'weight_kg']
    }
  },
  {
    name: 'create_nutrition_plan',
    description: `Skapa en ny kostplan i databasen.
VIKTIGT: Kräver användarens GODKÄNNANDE innan planen skapas.
Visa alltid en sammanfattning och vänta på bekräftelse.

<examples>
<example>
<description>Skapa en kostplan för viktminskning</description>
<input>{
  "client_id": "user_123",
  "name": "Viktminskning Q1 2025",
  "daily_calories": 2000,
  "protein_grams": 160,
  "carb_grams": 200,
  "fat_grams": 56,
  "meals_per_day": 4,
  "workout_time": "morning",
  "weight_kg": 80,
  "height_cm": 178,
  "age": 35,
  "gender": "male",
  "allergies": ["gluten"],
  "dietary_preferences": "none",
  "calorie_goal": "moderate"
}</input>
<output>{"success": true, "requires_approval": true, "approval_type": "nutrition_plan", "summary": "Kostplan redo att skapas: 2000 kcal/dag, 160g protein, 200g kolh, 56g fett. Väntar på godkännande."}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: {
          type: 'string',
          description: 'Klientens ID'
        },
        name: {
          type: 'string',
          description: 'Namn på kostplanen (t.ex. "Viktminskning Q1 2025")'
        },
        daily_calories: {
          type: 'number',
          description: 'Dagligt kaloriintag'
        },
        protein_grams: {
          type: 'number',
          description: 'Dagligt proteinmål i gram'
        },
        carb_grams: {
          type: 'number',
          description: 'Dagligt kolhydratmål i gram'
        },
        fat_grams: {
          type: 'number',
          description: 'Dagligt fettmål i gram'
        },
        meals_per_day: {
          type: 'number',
          description: 'Antal måltider per dag (3-6)'
        },
        workout_time: {
          type: 'string',
          enum: ['morning', 'lunch', 'afternoon', 'evening'],
          description: 'Träningstid för optimal kolhydratfördelning'
        },
        weight_kg: {
          type: 'number',
          description: 'Klientens vikt'
        },
        height_cm: {
          type: 'number',
          description: 'Klientens längd'
        },
        age: {
          type: 'number',
          description: 'Klientens ålder'
        },
        gender: {
          type: 'string',
          enum: ['male', 'female']
        },
        allergies: {
          type: 'array',
          items: { type: 'string' },
          description: 'Lista av allergier'
        },
        dietary_preferences: {
          type: 'string',
          enum: ['none', 'vegetarian', 'vegan', 'pescatarian', 'keto', 'paleo'],
          description: 'Kostpreferens'
        },
        calorie_goal: {
          type: 'string',
          enum: ['maintenance', 'surplus', 'conservative', 'moderate', 'aggressive'],
          description: 'Typ av kalorimål'
        }
      },
      required: ['client_id', 'daily_calories', 'protein_grams', 'carb_grams', 'fat_grams', 'weight_kg']
    }
  }
];

// =============================================================================
// HISTORY & UNDO TOOLS
// =============================================================================

export const HISTORY_TOOLS: Tool[] = [
  {
    name: 'get_meal_plan_history',
    description: `Hämta historik för en kostplan - alla tidigare versioner.
Använd denna när användaren vill se vad som ändrats eller återgå till en tidigare version.

<examples>
<example>
<description>Visa historik för en kostplan</description>
<input>{"nutrition_plan_id": "plan_abc123"}</input>
<output>{"success": true, "data": {"versions": [{"version": 3, "created_at": "2025-01-15T10:30:00", "summary": "Bytte lax mot kyckling i lunch"}, {"version": 2, "created_at": "2025-01-14T14:20:00", "summary": "Lade till mellanmål"}]}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        nutrition_plan_id: {
          type: 'string',
          description: 'Kostplanens ID'
        },
        limit: {
          type: 'number',
          description: 'Max antal versioner att visa (default: 10)'
        }
      },
      required: ['nutrition_plan_id']
    }
  },
  {
    name: 'undo_meal_plan_change',
    description: `Ångra senaste ändringen i kostschemat och återgå till föregående version.
VIKTIGT: Kräver användarens bekräftelse.

<examples>
<example>
<description>Ångra senaste ändringen</description>
<input>{"nutrition_plan_id": "plan_abc123"}</input>
<output>{"success": true, "requires_approval": true, "summary": "Vill du ångra senaste ändringen? Det kommer återställa schemat till version 2 (innan 'Bytte lax mot kyckling')."}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        nutrition_plan_id: {
          type: 'string',
          description: 'Kostplanens ID'
        },
        version: {
          type: 'number',
          description: 'Specifik version att återgå till (valfritt, default: föregående)'
        }
      },
      required: ['nutrition_plan_id']
    }
  },
  {
    name: 'scale_recipe_portion',
    description: `Skala ett recepts portionsstorlek för att matcha specifika makromål.
Beräknar nya gramvikter för alla ingredienser.

<examples>
<example>
<description>Skala recept för att matcha proteinmål</description>
<input>{"recipe_id": "rec_123", "target_macros": {"protein": 40}}</input>
<output>{"success": true, "data": {"original_per_serving": {"protein": 32, "kcal": 450}, "scaled": {"portions": 1.25, "protein": 40, "kcal": 563}, "scaled_ingredients": [{"name": "Kycklingbröst", "original_grams": 150, "scaled_grams": 188}]}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        recipe_id: {
          type: 'string',
          description: 'Receptets ID'
        },
        target_macros: {
          type: 'object',
          description: 'Målvärden att skala mot (ange minst ett)',
          properties: {
            protein: { type: 'number', description: 'Målprotein i gram' },
            carbs: { type: 'number', description: 'Målkolhydrater i gram' },
            fat: { type: 'number', description: 'Målfett i gram' },
            kcal: { type: 'number', description: 'Målkalorier' }
          }
        },
        scale_by: {
          type: 'string',
          enum: ['protein', 'carbs', 'fat', 'kcal'],
          description: 'Vilken makro att prioritera för skalning (default: protein)'
        }
      },
      required: ['recipe_id', 'target_macros']
    }
  },
  {
    name: 'learn_from_success',
    description: `Registrera att ett kostschema eller recept fungerade bra för klienten.
Detta sparas i klientens minne och används för framtida förslag.

<examples>
<example>
<description>Markera att ett schema fungerade bra</description>
<input>{"client_id": "user_123", "success_type": "meal_plan", "reference_id": "mp_789", "notes": "Hög energi hela dagen, ingen hunger"}</input>
<output>{"success": true, "data": {"saved": true, "message": "Sparat! Detta schema kommer användas som referens för framtida förslag."}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        client_id: {
          type: 'string',
          description: 'Klientens ID'
        },
        success_type: {
          type: 'string',
          enum: ['meal_plan', 'recipe', 'food_combination', 'meal_timing'],
          description: 'Typ av framgång'
        },
        reference_id: {
          type: 'string',
          description: 'ID för schemat/receptet som fungerade'
        },
        notes: {
          type: 'string',
          description: 'Anteckningar om varför det fungerade'
        }
      },
      required: ['client_id', 'success_type']
    }
  },
  {
    name: 'generate_weekly_plan',
    description: `Generera en veckoplan med variation mellan dagarna.
Säkerställer att samma recept inte upprepas för ofta.

<examples>
<example>
<description>Generera veckoplan med fokus på variation</description>
<input>{"nutrition_plan_id": "plan_abc123", "days": 7, "variation_level": "high"}</input>
<output>{"success": true, "requires_approval": true, "data": {"weekly_plan": [{"day": "Måndag", "meals": [...]}, {"day": "Tisdag", "meals": [...]}], "unique_recipes": 28, "protein_sources_used": 7}}</output>
</example>
</examples>`,
    input_schema: {
      type: 'object' as const,
      properties: {
        nutrition_plan_id: {
          type: 'string',
          description: 'Kostplanens ID'
        },
        days: {
          type: 'number',
          description: 'Antal dagar att planera (default: 7)'
        },
        variation_level: {
          type: 'string',
          enum: ['low', 'medium', 'high'],
          description: 'Hur mycket variation (low = samma grundrecept, high = olika varje dag)'
        },
        include_recipes: {
          type: 'boolean',
          description: 'Inkludera recept från receptbanken (default: true)'
        }
      },
      required: ['nutrition_plan_id']
    }
  }
];

// =============================================================================
// ALLA TOOLS KOMBINERADE
// =============================================================================

export const ALL_TOOLS: Tool[] = [...JUNI_TOOLS, ...WIZARD_TOOLS, ...HISTORY_TOOLS];

// Type för tool-namn
export type JuniToolName =
  | 'search_foods'
  | 'calculate_macros'
  | 'validate_meal_plan'
  | 'propose_meal_plan'
  | 'save_meal_plan'
  | 'get_client_info'
  | 'update_client_memory'
  | 'search_recipes'
  | 'suggest_recipes_for_meal'
  | 'get_recipe_details'
  | 'calculate_bmr_tdee'
  | 'calculate_macro_targets'
  | 'create_nutrition_plan'
  | 'get_meal_plan_history'
  | 'undo_meal_plan_change'
  | 'scale_recipe_portion'
  | 'learn_from_success'
  | 'generate_weekly_plan';

// Type för tool result
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  requires_approval?: boolean;
  approval_type?: 'meal_plan' | 'nutrition_plan';
  summary?: string;
}
