'use client';

import { Wand2, Coffee, Clock, Moon, Apple, Search, Utensils } from 'lucide-react';
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
    primary: true,
  },
  {
    label: 'Frukost',
    prompt: 'Ge mig 3 frukostalternativ med cirka 30g protein som tar max 10 minuter att laga.',
    icon: Coffee,
  },
  {
    label: 'Lunch',
    prompt: 'Föreslå luncher som tar under 20 minuter att laga med bra proteininnehåll.',
    icon: Utensils,
  },
  {
    label: 'Middag',
    prompt: 'Ge mig middagsförslag med balanserade makros och bra mikronutrienter.',
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
    label: 'Mikros',
    prompt: 'Analysera mitt kostschema och visa hur jag ligger till med järn, kalcium, vitamin D, B12 och zink. Ge förslag på hur jag kan täcka eventuella brister.',
    icon: Search,
  },
];

export function QuickActions({ onSelect, disabled }: QuickActionsProps) {
  return (
    <div className="px-4 py-3 border-b border-[#3f3f3f] flex-shrink-0 bg-[#2f2f2f]">
      <div className="flex flex-wrap gap-1.5">
        {quickActions.map((action, i) => (
          <button
            key={i}
            className={`
              h-7 text-[11px] gap-1.5 px-3 rounded-full flex items-center
              transition-colors disabled:opacity-50 disabled:cursor-not-allowed
              ${action.primary
                ? 'bg-[#e07a5f] hover:bg-[#c96a52] text-white'
                : 'bg-[#404040] hover:bg-[#4a4a4a] text-gray-300 border border-[#505050]'
              }
            `}
            onClick={() => onSelect(action.prompt)}
            disabled={disabled}
          >
            <action.icon className="h-3 w-3" />
            {action.label}
          </button>
        ))}
      </div>
    </div>
  );
}
