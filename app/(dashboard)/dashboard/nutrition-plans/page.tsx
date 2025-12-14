'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Plus,
  ChevronRight,
  Calendar,
  User,
  Utensils,
  MoreVertical,
  Pencil,
  Trash2,
  Archive,
  CheckCircle,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { sv } from 'date-fns/locale';
import { toast } from 'sonner';
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
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [planToDelete, setPlanToDelete] = useState<PlanWithClient | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchPlans = async () => {
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
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  const handleCreatePlan = () => {
    router.push('/dashboard/nutrition-plans/create');
  };

  const handleDeleteClick = (e: React.MouseEvent, plan: PlanWithClient) => {
    e.stopPropagation();
    setPlanToDelete(plan);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/nutrition-plans/${planToDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Kostplanen har tagits bort');
        setPlans(plans.filter((p) => p.id !== planToDelete.id));
      } else {
        const error = await response.json();
        toast.error(error.error || 'Kunde inte ta bort kostplanen');
      }
    } catch (error) {
      console.error('Error deleting plan:', error);
      toast.error('Något gick fel');
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setPlanToDelete(null);
    }
  };

  const handleStatusChange = async (
    e: React.MouseEvent,
    plan: PlanWithClient,
    newStatus: string
  ) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/nutrition-plans/${plan.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast.success(
          newStatus === 'ACTIVE'
            ? 'Kostplanen är nu aktiv'
            : newStatus === 'ARCHIVED'
            ? 'Kostplanen har arkiverats'
            : 'Status uppdaterad'
        );
        fetchPlans();
      } else {
        toast.error('Kunde inte uppdatera status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Något gick fel');
    }
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
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        plan.status
                      )}`}
                    >
                      {getStatusLabel(plan.status)}
                    </span>

                    {/* Actions dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/nutrition-plans/${plan.id}`);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" />
                          Visa/Redigera
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {plan.status !== 'ACTIVE' && (
                          <DropdownMenuItem
                            onClick={(e) =>
                              handleStatusChange(e, plan, 'ACTIVE')
                            }
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Gör aktiv
                          </DropdownMenuItem>
                        )}

                        {plan.status !== 'ARCHIVED' && (
                          <DropdownMenuItem
                            onClick={(e) =>
                              handleStatusChange(e, plan, 'ARCHIVED')
                            }
                          >
                            <Archive className="w-4 h-4 mr-2" />
                            Arkivera
                          </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={(e) => handleDeleteClick(e, plan)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Ta bort
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ta bort kostplan?</AlertDialogTitle>
            <AlertDialogDescription>
              Är du säker på att du vill ta bort kostplanen för{' '}
              <strong>{planToDelete?.client.name || planToDelete?.client.email}</strong>?
              Detta går inte att ångra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Tar bort...' : 'Ta bort'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
