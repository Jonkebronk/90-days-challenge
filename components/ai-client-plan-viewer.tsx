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
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-muted-foreground">Ingen plan tillgänglig</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header med klientnamn och actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI-Genererad Plan</h2>
          <p className="text-muted-foreground">För {clientName}</p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              Redigera Plan
            </Button>
          )}
          {onApprove && (
            <Button onClick={onApprove}>
              <CheckCircle2 className="mr-2 h-4 w-4" />
              Godkänn & Skicka
            </Button>
          )}
          <Button variant="outline" onClick={() => window.print()}>
            <Download className="mr-2 h-4 w-4" />
            Exportera
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Översikt</TabsTrigger>
          <TabsTrigger value="calories">Kalorier</TabsTrigger>
          <TabsTrigger value="meals">Måltider</TabsTrigger>
          <TabsTrigger value="recommendations">Rekommendationer</TabsTrigger>
        </TabsList>

        {/* ÖVERSIKT TAB */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Totalt Intag</CardTitle>
                <Utensils className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plan.calories.totalIntake}</div>
                <p className="text-xs text-muted-foreground">kcal/dag</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Protein</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{plan.macros.protein}g</div>
                <p className="text-xs text-muted-foreground">
                  {plan.macros.proteinCalories} kcal
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Underskott</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {plan.calories.deficit > 0 ? '-' : '+'}
                  {Math.abs(plan.calories.deficit)}
                </div>
                <p className="text-xs text-muted-foreground">kcal/dag</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Måltider</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {plan.mealDistribution.numberOfMeals}
                </div>
                <p className="text-xs text-muted-foreground">per dag</p>
              </CardContent>
            </Card>
          </div>

          {/* Makro översikt */}
          <Card>
            <CardHeader>
              <CardTitle>Makrofördelning</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="font-medium">Protein</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{plan.macros.protein}g</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.macros.proteinCalories} kcal
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="font-medium">Fett</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{plan.macros.fat}g</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.macros.fatCalories} kcal
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="font-medium">Kolhydrater</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{plan.macros.carbs}g</p>
                    <p className="text-sm text-muted-foreground">
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
          <Card>
            <CardHeader>
              <CardTitle>Kaloriuppdelning</CardTitle>
              <CardDescription>
                Detaljerad översikt över energibehov och kaloriintag
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">BMR (Basmetabolism)</span>
                  <Badge variant="outline">{plan.calories.bmr} kcal</Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">TDEE (Total förbrukning)</span>
                  <Badge variant="outline">{plan.calories.tdee} kcal</Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">
                    {plan.calories.deficit > 0 ? 'Underskott' : 'Överskott'}
                  </span>
                  <Badge variant={plan.calories.deficit > 0 ? "destructive" : "default"}>
                    {plan.calories.deficit > 0 ? '-' : '+'}
                    {Math.abs(plan.calories.deficit)} kcal
                  </Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Basintag</span>
                  <Badge variant="outline">{plan.calories.baseline} kcal</Badge>
                </div>

                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Extra från steg</span>
                  <Badge variant="secondary">+{plan.activity.extraCalories} kcal</Badge>
                </div>

                <div className="flex justify-between items-center py-3 border-t-2 border-primary mt-2">
                  <span className="text-lg font-bold">Totalt Intag</span>
                  <Badge className="text-lg px-4 py-1">
                    {plan.calories.totalIntake} kcal
                  </Badge>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg mt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Aktivitet:</strong> {plan.activity.dailySteps.toLocaleString()} steg/dag
                  ger extra {plan.activity.extraCalories} kcal
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MÅLTIDER TAB */}
        <TabsContent value="meals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Måltidsfördelning</CardTitle>
              <CardDescription>
                Fördelning av kalorier och makron över {plan.mealDistribution.numberOfMeals} måltider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {plan.mealDistribution.meals.map((meal) => (
                  <Card key={meal.mealNumber} className="bg-muted/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">
                        Måltid {meal.mealNumber}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Kalorier</span>
                        <span className="font-bold">{meal.calories} kcal</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Protein</span>
                        <span className="font-medium">{meal.protein}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fett</span>
                        <span className="font-medium">{meal.fat}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Kolhydrater</span>
                        <span className="font-medium">{meal.carbs}g</span>
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
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <span className="text-2xl">🤖</span>
                  AI-Genererade Rekommendationer
                </CardTitle>
                <CardDescription>
                  Personliga råd baserade på klientens profil
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
                  {plan.aiRecommendations}
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {plan.recommendations.trainingPlan && (
                <Card>
                  <CardHeader>
                    <CardTitle>Träningsplan</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{plan.recommendations.trainingPlan}</p>
                  </CardContent>
                </Card>
              )}

              {plan.recommendations.nutritionAdvice && (
                <Card>
                  <CardHeader>
                    <CardTitle>Nutritionsråd</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{plan.recommendations.nutritionAdvice}</p>
                  </CardContent>
                </Card>
              )}

              {plan.recommendations.lifestyleAdjustments && (
                <Card>
                  <CardHeader>
                    <CardTitle>Livsstilsjusteringar</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{plan.recommendations.lifestyleAdjustments}</p>
                  </CardContent>
                </Card>
              )}

              {plan.recommendations.progressExpectations && (
                <Card>
                  <CardHeader>
                    <CardTitle>Förväntade Resultat</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{plan.recommendations.progressExpectations}</p>
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
