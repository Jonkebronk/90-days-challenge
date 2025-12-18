'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Categories with subcategories
type CategoryData = {
  subcategories: { name: string; items: string[] }[];
} | {
  items: string[];
};

const RECOMMENDED_FOODS: Record<string, CategoryData> = {
  protein: {
    subcategories: [
      {
        name: 'Fågel',
        items: ['Kycklingfilé', 'Kycklinglårfilé', 'Kalkonfilé', 'Kyckling (hel)', 'Ankbröst']
      },
      {
        name: 'Nötkött',
        items: ['Nötfärs (5-10%)', 'Lövbiff', 'Entrecôte', 'Ryggbiff', 'Högrev', 'Rostbiff']
      },
      {
        name: 'Viltkött',
        items: ['Älgfärs', 'Hjortfilé', 'Vildsvinsfärs', 'Renfilé']
      },
      {
        name: 'Fisk & Skaldjur',
        items: ['Laxfilé', 'Torsk', 'Sej', 'Tilapia', 'Räkor', 'Musslor', 'Tonfisk']
      },
      {
        name: 'Fläsk',
        items: ['Fläskfilé', 'Fläskytterfilé', 'Bacon (mager)', 'Kassler', 'Skinka']
      },
      {
        name: 'Ägg & Mejeri',
        items: ['Ägg', 'Äggvita', 'Cottage cheese', 'Kvarg', 'Skyr', 'Proteinpulver']
      }
    ]
  },
  carb: {
    items: [
      'Jasminris', 'Basmatiris', 'Fullkornsris',
      'Pasta', 'Fullkornspasta',
      'Potatis', 'Sötpotatis',
      'Havregryn', 'Müsli',
      'Knäckebröd', 'Fullkornsbröd',
      'Bulgur', 'Couscous', 'Quinoa',
      'Banan', 'Äpple', 'Apelsin'
    ]
  },
  fat: {
    items: [
      'Olivolja', 'Kokosolja', 'Rapsolja',
      'Avokado',
      'Mandlar', 'Cashewnötter', 'Valnötter', 'Jordnötter',
      'Jordnötssmör', 'Mandelsmör',
      'Chiafrön', 'Linfrön'
    ]
  },
  vegetable: {
    items: [
      'Broccoli', 'Blomkål', 'Vitkål',
      'Spenat', 'Grönkål', 'Sallad', 'Ruccola',
      'Paprika', 'Tomat', 'Gurka', 'Zucchini',
      'Morötter', 'Rödbetor',
      'Lök', 'Vitlök', 'Purjolök',
      'Champinjoner', 'Sparris'
    ]
  },
  berry: {
    items: [
      'Blåbär', 'Hallon', 'Jordgubbar',
      'Lingon', 'Björnbär', 'Smultron',
      'Frysta bär (blandning)'
    ]
  },
  sauce: {
    items: [
      'Soja (light)', 'Teriyaki', 'Sweet chili',
      'Ajvar', 'Pesto', 'Tzatziki',
      'Senap', 'Sambal oelek',
      'Balsamvinäger', 'Citron'
    ]
  }
};

const CATEGORY_CONFIG = {
  protein: { label: 'Proteinkällor', icon: '🥩', color: 'text-rose-700', bg: 'bg-rose-50', subBg: 'bg-rose-100/50' },
  carb: { label: 'Kolhydrater', icon: '🌾', color: 'text-amber-700', bg: 'bg-amber-50', subBg: 'bg-amber-100/50' },
  fat: { label: 'Fettkällor', icon: '🥑', color: 'text-sky-700', bg: 'bg-sky-50', subBg: 'bg-sky-100/50' },
  vegetable: { label: 'Grönsaker', icon: '🥬', color: 'text-emerald-700', bg: 'bg-emerald-50', subBg: 'bg-emerald-100/50' },
  berry: { label: 'Bär', icon: '🫐', color: 'text-purple-700', bg: 'bg-purple-50', subBg: 'bg-purple-100/50' },
  sauce: { label: 'Såser', icon: '🥫', color: 'text-orange-700', bg: 'bg-orange-50', subBg: 'bg-orange-100/50' },
};

interface RecommendedFoodsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string | null;
}

export function RecommendedFoodsDialog({ open, onOpenChange, category }: RecommendedFoodsDialogProps) {
  if (!category) return null;

  const config = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG];
  const data = RECOMMENDED_FOODS[category];

  const hasSubcategories = data && 'subcategories' in data;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", config?.color)}>
            <span>{config?.icon}</span>
            Rekommenderade {config?.label?.toLowerCase()}
          </DialogTitle>
        </DialogHeader>
        <div className={cn("flex-1 overflow-y-auto rounded-lg p-3", config?.bg)}>
          {hasSubcategories ? (
            <div className="space-y-4">
              {data.subcategories.map((sub, subIndex) => (
                <div key={subIndex}>
                  <h3 className={cn("font-semibold text-sm mb-2", config?.color)}>
                    {sub.name}
                  </h3>
                  <div className={cn("rounded-lg p-2", config?.subBg)}>
                    <ul className="space-y-1">
                      {sub.items.map((food, index) => (
                        <li key={index} className="text-sm text-zinc-700 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <ul className="space-y-1.5">
              {('items' in data ? data.items : []).map((food, index) => (
                <li key={index} className="text-sm text-zinc-700 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40" />
                  {food}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
