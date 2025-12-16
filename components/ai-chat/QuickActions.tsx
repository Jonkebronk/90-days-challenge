'use client';

import { Wand2, Coffee, Clock, Moon, Apple, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const quickActions = [
  {
    label: 'Generera schema',
    prompt: 'Generera ett komplett kostschema för hela dagen baserat på mina makromål. Visa varje måltid med exakta mängder i gram.',
    icon: Wand2,
  },
  {
    label: 'Frukost',
    prompt: 'Ge mig 3 frukostalternativ med cirka 30g protein som tar max 10 minuter att laga.',
    icon: Coffee,
  },
  {
    label: 'Snabb lunch',
    prompt: 'Föreslå luncher som tar under 20 minuter att laga med bra proteininnehåll.',
    icon: Clock,
  },
  {
    label: 'Kvällsmål',
    prompt: 'Ge mig kvällsmål med hög mättnad och bra kaseinprotein för natten.',
    icon: Moon,
  },
  {
    label: 'Mellanmål',
    prompt: 'Ge mig 3 enkla mellanmål med 15-20g protein som inte kräver tillagning.',
    icon: Apple,
  },
  {
    label: 'Mikronutrienter',
    prompt: 'Analysera mitt kostschema och visa hur jag ligger till med järn, kalcium, vitamin D, B12 och zink. Ge förslag på hur jag kan täcka eventuella brister.',
    icon: Search,
  },
];

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="px-4 py-2 border-b flex-shrink-0">
      <div className="flex flex-wrap gap-1.5">
        {quickActions.map((action, i) => (
          <Button
            key={i}
            variant="outline"
            size="sm"
            className="h-7 text-xs gap-1"
            onClick={() => onSelect(action.prompt)}
            disabled={disabled}
          >
            <action.icon className="h-3 w-3" />
            {action.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
