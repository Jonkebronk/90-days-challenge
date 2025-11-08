'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Brain, Calendar, User, TrendingUp, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { toast } from 'sonner';

interface AIPlan {
  id: string;
  fullName: string;
  email: string;
  createdAt: string;
  aiGeneratedPlan: {
    calories: {
      totalIntake: number;
      deficit: number;
      bmr: number;
      tdee: number;
    };
    macros: {
      protein: number;
      fat: number;
      carbs: number;
    };
    mealDistribution: {
      numberOfMeals: number;
    };
  };
  planApproved: boolean;
}

export default function AIPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<AIPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  async function fetchPlans() {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-plans');

      if (response.ok) {
        const data = await response.json();
        setPlans(data.plans);
        setStats({
          total: data.plans.length,
          approved: data.plans.filter((p: AIPlan) => p.planApproved).length,
          pending: data.plans.filter((p: AIPlan) => !p.planApproved).length,
        });
      }
    } catch (error) {
      console.error('Error fetching AI plans:', error);
      toast.error('Kunde inte ladda AI-planer');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#FFD700] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[rgba(255,255,255,0.8)]">Laddar AI-planer...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mb-6 opacity-30" />
        <div className="flex items-center justify-center gap-3 mb-3">
          <Brain className="w-10 h-10 text-[#FFD700]" />
          <h1 className="font-['Orbitron',sans-serif] text-4xl md:text-5xl font-black tracking-[4px] uppercase bg-gradient-to-br from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
            AI-Planer
          </h1>
        </div>
        <p className="text-[rgba(255,255,255,0.6)] text-sm tracking-[1px]">
          Automatiskt genererade tränings- och nutritionsplaner
        </p>
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#FFD700] to-transparent mt-6 opacity-30" />
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Totalt</CardTitle>
            <Brain className="h-4 w-4 text-[#FFD700]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.total}</div>
            <p className="text-xs text-[rgba(255,255,255,0.5)]">AI-genererade planer</p>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(40,167,69,0.3)] backdrop-blur-[10px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Godkända</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#28a745]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.approved}</div>
            <p className="text-xs text-[rgba(255,255,255,0.5)]">Planer godkända</p>
          </CardContent>
        </Card>

        <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,193,7,0.3)] backdrop-blur-[10px]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-[rgba(255,255,255,0.9)]">Väntande</CardTitle>
            <Calendar className="h-4 w-4 text-[#ffc107]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pending}</div>
            <p className="text-xs text-[rgba(255,255,255,0.5)]">Väntar på granskning</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Button */}
      <div className="flex justify-end">
        <Button
          onClick={() => router.push('/dashboard/ai-plans/create')}
          className="bg-gradient-to-r from-[#FFD700] to-[#FFA500] hover:from-[#FFD700] hover:to-[#FFD700] text-[#0a0a0a] font-bold"
        >
          <Plus className="w-4 h-4 mr-2" />
          Skapa Plan Manuellt
        </Button>
      </div>

      {/* Plans List */}
      <div className="space-y-4">
        {plans.length === 0 ? (
          <Card className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px]">
            <CardContent className="pt-6">
              <div className="text-center py-12">
                <Brain className="w-16 h-16 text-[rgba(255,215,0,0.3)] mx-auto mb-4" />
                <p className="text-[rgba(255,255,255,0.6)] mb-4">Inga AI-planer än</p>
                <Button
                  onClick={() => router.push('/dashboard/ai-plans/create')}
                  variant="outline"
                  className="border-[rgba(255,215,0,0.3)] text-[#FFD700] hover:bg-[rgba(255,215,0,0.1)]"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Skapa din första plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          plans.map((plan) => (
            <Card
              key={plan.id}
              className="bg-[rgba(255,255,255,0.03)] border-2 border-[rgba(255,215,0,0.2)] backdrop-blur-[10px] hover:border-[rgba(255,215,0,0.4)] transition-all cursor-pointer"
              onClick={() => router.push(`/dashboard/leads/${plan.id}/ai-plan`)}
            >
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FFD700] to-[#FFA500] flex items-center justify-center">
                      <Brain className="w-6 h-6 text-[#0a0a0a]" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white">{plan.fullName || 'Okänd'}</h3>
                        <Badge
                          variant={plan.planApproved ? 'default' : 'secondary'}
                          className={plan.planApproved ? 'bg-[#28a745]' : 'bg-[#ffc107] text-[#0a0a0a]'}
                        >
                          {plan.planApproved ? 'Godkänd' : 'Väntande'}
                        </Badge>
                      </div>
                      <p className="text-sm text-[rgba(255,255,255,0.5)]">{plan.email}</p>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-8 mr-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#FFD700]">
                        {plan.aiGeneratedPlan?.calories?.totalIntake || 0}
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)]">kcal/dag</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#FFD700]">
                        {plan.aiGeneratedPlan?.macros?.protein || 0}g
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)]">protein</div>
                    </div>

                    <div className="text-center">
                      <div className="text-2xl font-bold text-[#FFD700]">
                        {plan.aiGeneratedPlan?.mealDistribution?.numberOfMeals || 0}
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)]">måltider</div>
                    </div>

                    <div className="text-center">
                      <div className="text-sm text-[rgba(255,255,255,0.6)]">
                        {new Date(plan.createdAt).toLocaleDateString('sv-SE')}
                      </div>
                      <div className="text-xs text-[rgba(255,255,255,0.5)]">Skapad</div>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-[rgba(255,215,0,0.5)]" />
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
