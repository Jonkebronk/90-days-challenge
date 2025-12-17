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
Använd denna för att hitta exakta näringsvärden - gissa ALDRIG näringsinnehåll.`,
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
Använd RÅ VIKT (före tillagning) för korrekta beräkningar.`,
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
Returnerar godkänt/ej godkänt samt förslag på förbättringar.`,
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
Inkludera alltid en tydlig sammanfattning av förslaget.`,
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
Anropa ALDRIG denna utan föregående godkännande.`,
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
Använd denna i början av varje session för att förstå klientens behov.`,
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
Exempel: "Jag gillar inte broccoli" -> preference_type: "dislikes", content: "broccoli"`,
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
Använd denna för att hitta recept som passar klientens kostschema.`,
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
Returnerar 3-5 passande receptförslag med näringsinfo.`,
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
Använd denna när användaren vill se ett helt recept.`,
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

TDEE = BMR × aktivitetsfaktor`,
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
- Kolhydrater: Resterande kalorier`,
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
Visa alltid en sammanfattning och vänta på bekräftelse.`,
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
// ALLA TOOLS KOMBINERADE
// =============================================================================

export const ALL_TOOLS: Tool[] = [...JUNI_TOOLS, ...WIZARD_TOOLS];

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
  | 'create_nutrition_plan';

// Type för tool result
export interface ToolResult {
  success: boolean;
  data?: any;
  error?: string;
  requires_approval?: boolean;
  approval_type?: 'meal_plan' | 'nutrition_plan';
  summary?: string;
}
