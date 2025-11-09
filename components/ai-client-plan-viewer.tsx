'use client';

/**
 * AI-Generated Client Plan Viewer
 * Visar automatiskt genererade tränings- och nutritionsplaner
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  TrendingDown,
  Utensils,
  Calendar,
  Download,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface CalorieData {
  bmr: number;
  tdee: number;
  deficit: number;
  baseline: number;
  totalIntake: number;
}

interface MacroData {
  protein: number;
  fat: number;
  carbs: number;
  proteinCalories: number;
  fatCalories: number;
  carbCalories: number;
}

interface Meal {
  mealNumber: number;
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

interface MealDistribution {
  numberOfMeals: number;
  caloriesPerMeal: number;
  meals: Meal[];
}

interface ActivityData {
  dailySteps: number;
  extraCalories: number;
}

interface Recommendations {
  trainingPlan?: string;
  nutritionAdvice?: string;
  lifestyleAdjustments?: string;
  progressExpectations?: string;
}

interface ClientPlan {
  calories: CalorieData;
  macros: MacroData;
  mealDistribution: MealDistribution;
  activity: ActivityData;
  recommendations: Recommendations;
  aiRecommendations?: string;
}

interface Props {
  leadId?: string;
  plan?: ClientPlan;
  clientName?: string;
  onApprove?: () => void;
  onEdit?: () => void;
}

export function AIClientPlanViewer({
  leadId,
  plan: initialPlan,
  clientName = 'Klient',
  onApprove,
  onEdit
}: Props) {
  const [plan, setPlan] = useState<ClientPlan | null>(initialPlan || null);
  const [loading, setLoading] = useState(!initialPlan && !!leadId);
  const [error, setError] = useState<string | null>(null);

  // Hämta plan om endast leadId är givet
  useEffect(() => {
    if (leadId && !initialPlan) {
      fetchPlan(leadId);
    }
  }, [leadId, initialPlan]);

  async function fetchPlan(id: string) {
    try {
      setLoading(true);
      const response = await fetch(`/api/ai-coach/process-application?leadId=${id}`);

      if (!response.ok) {
        throw new Error('Kunde inte hämta plan');
      }

      const data = await response.json();
      setPlan(data.lead.plan);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ett fel uppstod');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FFD700]"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-red-400">
            <AlertCircle className="h-5 w-5" />
            <p className="text-white">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
        <CardContent className="pt-6">
          <p className="text-[rgba(255,255,255,0.6)]">Ingen plan tillgänglig</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6 bg-transparent">
      {/* Header med klientnamn och actions */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">AI-Genererad Plan</h2>
          <p className="text-[rgba(255,255,255,0.6)]">För {clientName}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {onEdit && (
            <Button
              onClick={onEdit}
              className="bg-transparent border-2 border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
            >
              Redigera Plan
            </Button>
          )}
          {onApprove && (
            <Button
              onClick={onApprove}
              className="bg-gradient-to-r from-[#28a745] to-[#20c997] hover:from-[#28a745] hover:to-[#28a745] text-white font-bold"
            >
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Godkänn & Skicka
            </Button>
          )}
          <Button
            onClick={() => window.print()}
            className="bg-transparent border-2 border-[rgba(255,215,0,0.3)] text-[rgba(255,255,255,0.8)] hover:bg-[rgba(255,215,0,0.1)] hover:text-[#FFD700]"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-[rgba(255,255,255,0.05)] border border-[rgba(255,215,0,0.2)]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.6)]">Översikt</TabsTrigger>
          <TabsTrigger value="calories" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.6)]">Kalorier</TabsTrigger>
          <TabsTrigger value="meals" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.6)]">Måltider</TabsTrigger>
          <TabsTrigger value="recommendations" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#FFD700] data-[state=active]:to-[#FFA500] data-[state=active]:text-[#0a0a0a] text-[rgba(255,255,255,0.6)]">Rekommendationer</TabsTrigger>
        </TabsList>

        {/* ÖVERSIKT TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Totalt Intag</CardTitle>
                <Utensils className="h-4 w-4 text-[#FFD700]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{plan.calories.totalIntake}</div>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">kcal/dag</p>
              </CardContent>
            </Card>

            <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Protein</CardTitle>
                <Activity className="h-4 w-4 text-[#FFD700]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{plan.macros.protein}g</div>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">
                  {plan.macros.proteinCalories} kcal
                </p>
              </CardContent>
            </Card>

            <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Underskott</CardTitle>
                <TrendingDown className="h-4 w-4 text-[#FFD700]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {plan.calories.deficit > 0 ? '-' : '+'}
                  {Math.abs(plan.calories.deficit)}
                </div>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">kcal/dag</p>
              </CardContent>
            </Card>

            <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Måltider</CardTitle>
                <Calendar className="h-4 w-4 text-[#FFD700]" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">
                  {plan.mealDistribution.numberOfMeals}
                </div>
                <p className="text-xs text-[rgba(255,255,255,0.5)]">per dag</p>
              </CardContent>
            </Card>
          </div>

          {/* Makro översikt */}
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-white">Makrofördelning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="font-medium text-white">Protein</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{plan.macros.protein}g</p>
                    <p className="text-sm text-[rgba(255,255,255,0.5)]">
                      {plan.macros.proteinCalories} kcal
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="font-medium text-white">Fett</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{plan.macros.fat}g</p>
                    <p className="text-sm text-[rgba(255,255,255,0.5)]">
                      {plan.macros.fatCalories} kcal
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="font-medium text-white">Kolhydrater</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-white">{plan.macros.carbs}g</p>
                    <p className="text-sm text-[rgba(255,255,255,0.5)]">
                      {plan.macros.carbCalories} kcal
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* KALORIER TAB */}
        <TabsContent value="calories" className="space-y-4">
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-white">Kaloriuppdelning</CardTitle>
              <CardDescription className="text-[rgba(255,255,255,0.6)]">
                Detaljerad översikt över energibehov och kaloriintag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-[rgba(255,215,0,0.2)]">
                  <span className="font-medium text-white">BMR (Basmetabolism)</span>
                  <Badge className="bg-[rgba(255,215,0,0.2)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]">{plan.calories.bmr} kcal</Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-[rgba(255,215,0,0.2)]">
                  <span className="font-medium text-white">TDEE (Total förbrukning)</span>
                  <Badge className="bg-[rgba(255,215,0,0.2)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]">{plan.calories.tdee} kcal</Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-[rgba(255,215,0,0.2)]">
                  <span className="font-medium text-white">
                    {plan.calories.deficit > 0 ? 'Underskott' : 'Överskott'}
                  </span>
                  <Badge className={plan.calories.deficit > 0 ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-green-500/20 text-green-400 border border-green-500/30"}>
                    {plan.calories.deficit > 0 ? '-' : '+'}
                    {Math.abs(plan.calories.deficit)} kcal
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-[rgba(255,215,0,0.2)]">
                  <span className="font-medium text-white">Basintag</span>
                  <Badge className="bg-[rgba(255,215,0,0.2)] text-[#FFD700] border border-[rgba(255,215,0,0.3)]">{plan.calories.baseline} kcal</Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b border-[rgba(255,215,0,0.2)]">
                  <span className="font-medium text-white">Extra från steg</span>
                  <Badge className="bg-[rgba(0,123,255,0.2)] text-[#007bff] border border-[rgba(0,123,255,0.3)]">+{plan.activity.extraCalories} kcal</Badge>
                </div>

                <div className="flex justify-between items-center py-3 border-t-2 border-[#FFD700] mt-2">
                  <span className="text-lg font-bold text-white">Totalt Intag</span>
                  <Badge className="text-lg px-4 py-1 bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-[#0a0a0a]">
                    {plan.calories.totalIntake} kcal
                  </Badge>
                </div>
              </div>

              <div className="bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.2)] p-4 rounded-lg mt-4">
                <p className="text-sm text-[rgba(255,255,255,0.8)]">
                  <strong className="text-[#FFD700]">Aktivitet:</strong> {plan.activity.dailySteps.toLocaleString()} steg/dag
                  ger extra {plan.activity.extraCalories} kcal
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MÅLTIDER TAB */}
        <TabsContent value="meals" className="space-y-4">
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
            <CardHeader>
              <CardTitle className="text-white">Måltidsfördelning</CardTitle>
              <CardDescription className="text-[rgba(255,255,255,0.6)]">
                Fördelning av kalorier och makron över {plan.mealDistribution.numberOfMeals} måltider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.mealDistribution.meals.map((meal) => (
                  <Card key={meal.mealNumber} className="bg-[rgba(255,215,0,0.05)] border border-[rgba(255,215,0,0.2)]">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg text-white">
                        Måltid {meal.mealNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-[rgba(255,255,255,0.6)]">Kalorier</span>
                        <span className="font-bold text-white">{meal.calories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[rgba(255,255,255,0.6)]">Protein</span>
                        <span className="font-medium text-white">{meal.protein}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[rgba(255,255,255,0.6)]">Fett</span>
                        <span className="font-medium text-white">{meal.fat}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-[rgba(255,255,255,0.6)]">Kolhydrater</span>
                        <span className="font-medium text-white">{meal.carbs}g</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* REKOMMENDATIONER TAB */}
        <TabsContent value="recommendations" className="space-y-4">
          {plan.aiRecommendations ? (
            <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <span className="text-2xl">🤖</span>
                  AI-Genererade Rekommendationer
                </CardTitle>
                <CardDescription className="text-[rgba(255,255,255,0.6)]">
                  Personliga råd baserade på klientens profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none prose-invert whitespace-pre-wrap text-[rgba(255,255,255,0.9)]">
                  {plan.aiRecommendations}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {plan.recommendations.trainingPlan && (
                <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
                  <CardHeader>
                    <CardTitle className="text-white">Träningsplan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[rgba(255,255,255,0.8)]">{plan.recommendations.trainingPlan}</p>
                  </CardContent>
                </Card>
              )}

              {plan.recommendations.nutritionAdvice && (
                <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
                  <CardHeader>
                    <CardTitle className="text-white">Nutritionsråd</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[rgba(255,255,255,0.8)]">{plan.recommendations.nutritionAdvice}</p>
                  </CardContent>
                </Card>
              )}

              {plan.recommendations.lifestyleAdjustments && (
                <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
                  <CardHeader>
                    <CardTitle className="text-white">Livsstilsjusteringar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[rgba(255,255,255,0.8)]">{plan.recommendations.lifestyleAdjustments}</p>
                  </CardContent>
                </Card>
              )}

              {plan.recommendations.progressExpectations && (
                <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
                  <CardHeader>
                    <CardTitle className="text-white">Förväntade Resultat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-[rgba(255,255,255,0.8)]">{plan.recommendations.progressExpectations}</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
