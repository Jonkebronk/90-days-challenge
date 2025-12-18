'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const RECOMMENDED_FOODS: Record<string, string[]> = {
  protein: [
    'Kycklingfilé', 'Kycklinglårfilé', 'Kalkonfilé',
    'Nötfärs (5-10%)', 'Lövbiff', 'Entrecôte',
    'Laxfilé', 'Torsk', 'Sej', 'Räkor',
    'Ägg', 'Äggvita',
    'Cottage cheese', 'Kvarg', 'Skyr',
    'Proteinpulver'
  ],
  carb: [
    'Jasminris', 'Basmatiris', 'Fullkornsris',
    'Pasta', 'Fullkornspasta',
    'Potatis', 'Sötpotatis',
    'Havregryn', 'Müsli',
    'Knäckebröd', 'Fullkornsbröd',
    'Bulgur', 'Couscous', 'Quinoa',
    'Banan', 'Äpple', 'Apelsin'
  ],
  fat: [
    'Olivolja', 'Kokosolja', 'Rapsolja',
    'Avokado',
    'Mandlar', 'Cashewnötter', 'Valnötter', 'Jordnötter',
    'Jordnötssmör', 'Mandelsmör',
    'Chiafrön', 'Linfrön'
  ],
  vegetable: [
    'Broccoli', 'Blomkål', 'Vitkål',
    'Spenat', 'Grönkål', 'Sallad', 'Ruccola',
    'Paprika', 'Tomat', 'Gurka', 'Zucchini',
    'Morötter', 'Rödbetor',
    'Lök', 'Vitlök', 'Purjolök',
    'Champinjoner', 'Sparris'
  ],
  berry: [
    'Blåbär', 'Hallon', 'Jordgubbar',
    'Lingon', 'Björnbär', 'Smultron',
    'Frysta bär (blandning)'
  ],
  sauce: [
    'Soja (light)', 'Teriyaki', 'Sweet chili',
    'Ajvar', 'Pesto', 'Tzatziki',
    'Senap', 'Sambal oelek',
    'Balsamvinäger', 'Citron'
  ]
};

const CATEGORY_CONFIG = {
  protein: { label: 'Proteinkällor', icon: '🥩', color: 'text-rose-700', bg: 'bg-rose-50' },
  carb: { label: 'Kolhydrater', icon: '🌾', color: 'text-amber-700', bg: 'bg-amber-50' },
  fat: { label: 'Fettkällor', icon: '🥑', color: 'text-sky-700', bg: 'bg-sky-50' },
  vegetable: { label: 'Grönsaker', icon: '🥬', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  berry: { label: 'Bär', icon: '🫐', color: 'text-purple-700', bg: 'bg-purple-50' },
  sauce: { label: 'Såser', icon: '🥫', color: 'text-orange-700', bg: 'bg-orange-50' },
};

interface RecommendedFoodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string | null;
}

export function RecommendedFoodsDialog({ open, onOpenChange, category }: RecommendedFoodsDialogProps) {
  if (!category) return null;

  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
  const foods = RECOMMENDED_FOODS[category] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[70vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", config?.color)}>
            <span>{config?.icon}</span>
            Rekommenderade {config?.label?.toLowerCase()}
          </DialogTitle>
        </DialogHeader>
        <div className={cn("flex-1 overflow-y-auto rounded-lg p-3", config?.bg)}>
          <ul className="space-y-1.5">
            {foods.map((food, index) => (
              <li key={index} className="text-sm text-zinc-700 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                {food}
              </li>
            ))}
          </ul>
        </div>
      </DialogContent>
    </Dialog>
  );
}
