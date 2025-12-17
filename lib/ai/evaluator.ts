/**
 * Juni AI Evaluator
 *
 * Evaluator-agent som validerar kvaliteten på Juni's svar och förslag.
 * Körs efter varje svar för att:
 * - Validera att kostplaner är korrekta
 * - Kontrollera att makros summeras rätt
 * - Verifiera att allergier respekteras
 * - Bedöma svars relevans och hjälpsamhet
 */

import Anthropic from '@anthropic-ai/sdk';

// =============================================================================
// TYPES
// =============================================================================

export interface EvaluationResult {
  valid: boolean;
  score: number; // 0-100
  issues: EvaluationIssue[];
  suggestions: string[];
  metadata: {
    evaluatedAt: Date;
    evaluationType: string;
    inputLength: number;
    responseLength: number;
  };
}

export interface EvaluationIssue {
  type: 'error' | 'warning' | 'info';
  category: 'macro' | 'allergy' | 'nutrition' | 'format' | 'relevance' | 'safety';
  message: string;
  details?: any;
}

export interface MealPlanEvaluation extends EvaluationResult {
  macroAnalysis: {
    totalProtein: number;
    totalCarbs: number;
    totalFat: number;
    totalKcal: number;
    proteinDeviation: number;
    carbsDeviation: number;
    fatDeviation: number;
    kcalDeviation: number;
  };
  allergyCheck: {
    passed: boolean;
    violations: string[];
  };
  nutritionQuality: {
    proteinDistribution: 'good' | 'uneven' | 'poor';
    mealBalance: 'good' | 'uneven' | 'poor';
    varietyScore: number;
  };
}

// =============================================================================
// EVALUATOR FUNCTIONS
// =============================================================================

/**
 * Evaluera ett kostschema-förslag
 */
export function evaluateMealPlan(
  meals: any[],
  targetMacros: { protein: number; carbs: number; fat: number; kcal: number },
  allergies: string[] = [],
  clientWeight?: number
): MealPlanEvaluation {
  const issues: EvaluationIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Beräkna faktiska makros
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalKcal = 0;
  const mealProteins: number[] = [];
  const usedFoods: string[] = [];
  const allergyViolations: string[] = [];

  for (const meal of meals) {
    const mealProtein = meal.macros?.protein || 0;
    totalProtein += mealProtein;
    totalCarbs += meal.macros?.carbs || 0;
    totalFat += meal.macros?.fat || 0;
    totalKcal += meal.macros?.kcal || 0;
    mealProteins.push(mealProtein);

    // Samla livsmedel för variation
    for (const item of meal.items || []) {
      const foodName = item.food_name?.toLowerCase() || '';
      usedFoods.push(foodName);

      // Kontrollera allergier
      for (const allergy of allergies) {
        if (foodName.includes(allergy.toLowerCase())) {
          allergyViolations.push(`${item.food_name} kan innehålla ${allergy}`);
        }
      }
    }
  }

  // 1. Makro-validering
  const proteinDeviation = Math.abs(totalProtein - targetMacros.protein) / targetMacros.protein * 100;
  const carbsDeviation = Math.abs(totalCarbs - targetMacros.carbs) / targetMacros.carbs * 100;
  const fatDeviation = Math.abs(totalFat - targetMacros.fat) / targetMacros.fat * 100;
  const kcalDeviation = Math.abs(totalKcal - targetMacros.kcal) / targetMacros.kcal * 100;

  if (kcalDeviation > 10) {
    issues.push({
      type: 'warning',
      category: 'macro',
      message: `Kalorier avviker ${kcalDeviation.toFixed(0)}% från målet`,
      details: { actual: totalKcal, target: targetMacros.kcal }
    });
    score -= 10;
    suggestions.push('Justera portionsstorlekarna för att komma närmare kalorimålet');
  }

  if (proteinDeviation > 10) {
    issues.push({
      type: 'warning',
      category: 'macro',
      message: `Protein avviker ${proteinDeviation.toFixed(0)}% från målet`,
      details: { actual: totalProtein, target: targetMacros.protein }
    });
    score -= 10;
    suggestions.push('Öka eller minska proteinkällorna för att matcha målet');
  }

  // 2. Proteinfördelning
  if (mealProteins.length >= 2) {
    const avgProtein = totalProtein / mealProteins.length;
    const variance = mealProteins.reduce((sum, p) => sum + Math.pow(p - avgProtein, 2), 0) / mealProteins.length;
    const stdDev = Math.sqrt(variance);
    const cv = stdDev / avgProtein;

    let proteinDistribution: 'good' | 'uneven' | 'poor' = 'good';
    if (cv > 0.4) {
      proteinDistribution = 'poor';
      issues.push({
        type: 'warning',
        category: 'nutrition',
        message: 'Proteinet är ojämnt fördelat mellan måltiderna'
      });
      score -= 5;
      suggestions.push('Fördela protein jämnare: 20-40g per måltid för optimal syntes');
    } else if (cv > 0.25) {
      proteinDistribution = 'uneven';
    }
  }

  // 3. Allergi-check
  if (allergyViolations.length > 0) {
    issues.push({
      type: 'error',
      category: 'allergy',
      message: `Potentiella allergiöverträdelser hittades`,
      details: allergyViolations
    });
    score -= 30; // Allvarligt problem
  }

  // 4. Variation
  const uniqueFoods = new Set(usedFoods.map(f => f.split(' ')[0])); // Gruppera på första ordet
  const varietyScore = Math.min(100, (uniqueFoods.size / Math.max(meals.length * 2, 1)) * 100);

  if (varietyScore < 50) {
    issues.push({
      type: 'info',
      category: 'nutrition',
      message: 'Låg variation i livsmedelsval'
    });
    suggestions.push('Överväg att variera proteinkällor och kolhydrater mer');
    score -= 5;
  }

  // 5. g/kg-validering om vikt finns
  if (clientWeight) {
    const proteinPerKg = totalProtein / clientWeight;
    if (proteinPerKg < 1.6) {
      issues.push({
        type: 'warning',
        category: 'nutrition',
        message: `Protein under rekommenderat: ${proteinPerKg.toFixed(1)}g/kg (min 1.6g/kg)`
      });
      score -= 10;
    }
    if (proteinPerKg > 2.5) {
      issues.push({
        type: 'info',
        category: 'nutrition',
        message: `Högt protein: ${proteinPerKg.toFixed(1)}g/kg`
      });
    }
  }

  // Sätt score till minimum 0
  score = Math.max(0, score);

  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    score,
    issues,
    suggestions,
    metadata: {
      evaluatedAt: new Date(),
      evaluationType: 'meal_plan',
      inputLength: meals.length,
      responseLength: totalKcal
    },
    macroAnalysis: {
      totalProtein,
      totalCarbs,
      totalFat,
      totalKcal,
      proteinDeviation,
      carbsDeviation,
      fatDeviation,
      kcalDeviation
    },
    allergyCheck: {
      passed: allergyViolations.length === 0,
      violations: allergyViolations
    },
    nutritionQuality: {
      proteinDistribution: 'good',
      mealBalance: meals.length >= 3 ? 'good' : 'uneven',
      varietyScore
    }
  };
}

/**
 * Evaluera ett text-svar från Juni
 */
export async function evaluateResponse(
  userMessage: string,
  juniResponse: string,
  context?: { mode: string; clientName?: string }
): Promise<EvaluationResult> {
  const issues: EvaluationIssue[] = [];
  const suggestions: string[] = [];
  let score = 100;

  // Enkel heuristisk evaluering
  // 1. Längd-check
  if (juniResponse.length < 20) {
    issues.push({
      type: 'warning',
      category: 'format',
      message: 'Svaret är väldigt kort'
    });
    score -= 10;
  }

  if (juniResponse.length > 3000) {
    issues.push({
      type: 'info',
      category: 'format',
      message: 'Svaret är långt - överväg att bryta ned i steg'
    });
  }

  // 2. Relevans-check (enkel)
  const userWords = userMessage.toLowerCase().split(/\s+/);
  const responseWords = juniResponse.toLowerCase().split(/\s+/);
  const relevantWords = userWords.filter(w => w.length > 3 && responseWords.some(rw => rw.includes(w)));
  const relevanceRatio = relevantWords.length / Math.max(userWords.filter(w => w.length > 3).length, 1);

  if (relevanceRatio < 0.2) {
    issues.push({
      type: 'warning',
      category: 'relevance',
      message: 'Svaret kan vara off-topic'
    });
    score -= 15;
  }

  // 3. Svenska-check
  const swedishIndicators = ['och', 'att', 'det', 'som', 'för', 'är', 'med', 'kan', 'till', 'av'];
  const swedishCount = swedishIndicators.filter(w => juniResponse.toLowerCase().includes(w)).length;
  if (swedishCount < 2) {
    issues.push({
      type: 'warning',
      category: 'format',
      message: 'Svaret verkar inte vara på svenska'
    });
    score -= 10;
  }

  // 4. Säkerhets-check
  const dangerousTerms = ['självmord', 'skada', 'anorexi', 'bulimi', 'fasta i'];
  for (const term of dangerousTerms) {
    if (juniResponse.toLowerCase().includes(term)) {
      issues.push({
        type: 'warning',
        category: 'safety',
        message: `Känsligt ämne nämnt: ${term}`
      });
    }
  }

  // 5. Siffror-validering
  const numberPattern = /\d+\s*(g|kg|kcal|gram|kalorier)/gi;
  const numbers = juniResponse.match(numberPattern) || [];
  for (const match of numbers) {
    const value = parseInt(match);
    if (value > 10000) {
      issues.push({
        type: 'warning',
        category: 'nutrition',
        message: `Ovanligt högt värde: ${match}`
      });
      score -= 5;
    }
  }

  return {
    valid: issues.filter(i => i.type === 'error').length === 0,
    score: Math.max(0, score),
    issues,
    suggestions,
    metadata: {
      evaluatedAt: new Date(),
      evaluationType: 'response',
      inputLength: userMessage.length,
      responseLength: juniResponse.length
    }
  };
}

/**
 * Kör full evaluering med LLM (för kritiska beslut)
 */
export async function deepEvaluate(
  userMessage: string,
  juniResponse: string,
  toolCalls: any[],
  context: any
): Promise<EvaluationResult> {
  try {
    const anthropic = new Anthropic();

    const evaluationPrompt = `
Du är en kvalitetskontrollant för en AI-kostplaneringsagent. Analysera följande interaktion:

ANVÄNDARENS MEDDELANDE:
${userMessage}

AGENTENS SVAR:
${juniResponse}

TOOL CALLS:
${JSON.stringify(toolCalls, null, 2)}

KONTEXT:
${JSON.stringify(context, null, 2)}

Bedöm:
1. Är svaret relevant och hjälpsamt? (0-100)
2. Är näringsinformationen korrekt? (0-100)
3. Finns det några säkerhetsproblem? (ja/nej + detaljer)
4. Vad kan förbättras?

Svara i JSON-format:
{
  "relevance_score": number,
  "accuracy_score": number,
  "safety_issues": string[],
  "improvements": string[],
  "overall_score": number
}`;

    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 500,
      messages: [{ role: 'user', content: evaluationPrompt }]
    });

    const textContent = response.content.find(b => b.type === 'text');
    if (textContent) {
      try {
        const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const evaluation = JSON.parse(jsonMatch[0]);

          const issues: EvaluationIssue[] = [];
          const suggestions: string[] = evaluation.improvements || [];

          if (evaluation.relevance_score < 70) {
            issues.push({
              type: 'warning',
              category: 'relevance',
              message: `Låg relevans: ${evaluation.relevance_score}/100`
            });
          }

          if (evaluation.accuracy_score < 70) {
            issues.push({
              type: 'warning',
              category: 'nutrition',
              message: `Låg noggrannhet: ${evaluation.accuracy_score}/100`
            });
          }

          for (const safety of evaluation.safety_issues || []) {
            issues.push({
              type: 'warning',
              category: 'safety',
              message: safety
            });
          }

          return {
            valid: issues.filter(i => i.type === 'error').length === 0,
            score: evaluation.overall_score || 0,
            issues,
            suggestions,
            metadata: {
              evaluatedAt: new Date(),
              evaluationType: 'deep',
              inputLength: userMessage.length,
              responseLength: juniResponse.length
            }
          };
        }
      } catch {
        // JSON parse failed, fall through to basic evaluation
      }
    }
  } catch (error) {
    console.error('Deep evaluation failed:', error);
  }

  // Fallback till basic evaluation
  return evaluateResponse(userMessage, juniResponse, context);
}

/**
 * Skapa evaluerings-sammanfattning
 */
export function summarizeEvaluation(evaluation: EvaluationResult): string {
  const emoji = evaluation.score >= 80 ? '✅' : evaluation.score >= 60 ? '⚠️' : '❌';
  const status = evaluation.score >= 80 ? 'Godkänt' : evaluation.score >= 60 ? 'Varning' : 'Problem';

  let summary = `${emoji} ${status} (${evaluation.score}/100)\n`;

  if (evaluation.issues.length > 0) {
    summary += '\nProblem:\n';
    for (const issue of evaluation.issues) {
      const icon = issue.type === 'error' ? '❌' : issue.type === 'warning' ? '⚠️' : 'ℹ️';
      summary += `${icon} ${issue.message}\n`;
    }
  }

  if (evaluation.suggestions.length > 0) {
    summary += '\nFörslag:\n';
    for (const suggestion of evaluation.suggestions) {
      summary += `• ${suggestion}\n`;
    }
  }

  return summary;
}
