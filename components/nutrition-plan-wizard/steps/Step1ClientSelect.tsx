'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Search, User, Check } from 'lucide-react';
import { useNutritionPlanWizardStore } from '@/lib/stores/nutrition-plan-wizard-store';
import { WizardNavigation } from '../WizardNavigation';
import type { ClientOption } from '@/lib/types/client-nutrition-plan';
import { cn } from '@/lib/utils';

export function Step1ClientSelect() {
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const { clientId, setClientData, nextStep } = useNutritionPlanWizardStore();

  useEffect(() => {
    async function fetchClients() {
      try {
        const response = await fetch('/api/clients');
        if (response.ok) {
          const data = await response.json();
          // API returns { clients: [...], coach: null }
          setClients(data.clients || []);
        }
      } catch (error) {
        console.error('Failed to fetch clients:', error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchClients();
  }, []);

  const filteredClients = clients.filter((client) => {
    const searchLower = search.toLowerCase();
    return (
      client.name?.toLowerCase().includes(searchLower) ||
      client.email.toLowerCase().includes(searchLower)
    );
  });

  const handleSelectClient = (client: ClientOption) => {
    setClientData({
      id: client.id,
      name: client.name || client.email,
      email: client.email,
      age: client.age,
      height: client.height,
      currentWeight: client.currentWeight,
      gender: client.gender,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-bold text-gray-900">Välj klient</h2>
        <p className="text-sm text-gray-600 mt-1">
          Välj vilken klient du vill skapa en kostplan för
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input
          placeholder="Sök klienter..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="text-sm text-gray-500">
        Visar {filteredClients.length} klienter
      </div>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {isLoading ? (
          <div className="text-center py-8 text-gray-500">
            Laddar klienter...
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            Inga klienter hittades
          </div>
        ) : (
          filteredClients.map((client) => (
            <Card
              key={client.id}
              onClick={() => handleSelectClient(client)}
              className={cn(
                'p-4 cursor-pointer transition-all hover:shadow-md',
                clientId === client.id
                  ? 'border-2 border-amber-500 bg-amber-50'
                  : 'border border-gray-200 hover:border-amber-300'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center text-white font-medium',
                    clientId === client.id ? 'bg-amber-500' : 'bg-gray-400'
                  )}
                >
                  {client.name ? (
                    client.name.charAt(0).toUpperCase()
                  ) : (
                    <User className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 truncate">
                    {client.name || 'Namnlös'}
                  </div>
                  <div className="text-sm text-gray-500 truncate">
                    {client.email}
                  </div>
                </div>
                {clientId === client.id && (
                  <Check className="w-5 h-5 text-amber-500 flex-shrink-0" />
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <WizardNavigation
        onNext={nextStep}
        showBack={false}
        isNextDisabled={!clientId}
      />
    </div>
  );
}
