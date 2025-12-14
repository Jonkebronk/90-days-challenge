'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ChevronRight, Calendar, User, Utensils } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import type { ClientNutritionPlan } from '@/lib/types/client-nutrition-plan';

interface PlanWithClient extends ClientNutritionPlan {
  client: {
    id: string;
    name: string | null;
    email: string;
  };
}

export default function NutritionPlansPage() {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanWithClient[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      try {
        const response = await fetch('/api/nutrition-plans');
        if (response.ok) {
          const data = await response.json();
          setPlans(data);
        }
      } catch (error) {
        console.error('Failed to fetch plans:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchPlans();
  }, []);

  const handleCreatePlan = () => {
    router.push('/dashboard/nutrition-plans/create');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'bg-green-100 text-green-700';
      case 'DRAFT':
        return 'bg-yellow-100 text-yellow-700';
      case 'ARCHIVED':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'Aktiv';
      case 'DRAFT':
        return 'Utkast';
      case 'ARCHIVED':
        return 'Arkiverad';
      default:
        return status;
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Kostplaner</h1>
          <p className="text-gray-400">
            Hantera kostplaner för dina klienter
          </p>
        </div>
        <Button
          onClick={handleCreatePlan}
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Skapa kostplan
        </Button>
      </div>

      {/* Plans list */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-500">
          Laddar kostplaner...
        </div>
      ) : plans.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Inga kostplaner ännu
            </h3>
            <p className="text-gray-500 mb-4">
              Skapa din första kostplan för att komma igång
            </p>
            <Button
              onClick={handleCreatePlan}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Skapa kostplan
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() =>
                router.push(`/dashboard/nutrition-plans/${plan.id}`)
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {plan.name || `${plan.client.name}s kostplan`}
                      </div>
                      <div className="text-sm text-gray-500">
                        {plan.client.name || plan.client.email}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDistanceToNow(new Date(plan.createdAt), {
                            addSuffix: true,
                            locale: sv,
                          })}
                        </span>
                        <span>
                          {plan.dailyCalorieTarget} kcal / {plan.mealsPerDay}{' '}
                          måltider
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        plan.status
                      )}`}
                    >
                      {getStatusLabel(plan.status)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
