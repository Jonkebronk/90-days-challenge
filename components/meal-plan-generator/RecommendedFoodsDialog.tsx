'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// Categories with subcategories and optional intro text
type CategoryData = {
  intro?: string;
  subcategories: { name: string; items: string[] }[];
};

const RECOMMENDED_FOODS: Record<string, CategoryData> = {
  protein: {
    subcategories: [
      {
        name: 'Fågel',
        items: ['Kycklingfilé (rå)', 'Kalkonfilé (rå)', 'Kycklingfärs (5 %)']
      },
      {
        name: 'Nötkött',
        items: ['Innanlår (rå)', 'Rostbiff (rå)', 'Oxfilé (rå)', 'Rostas (rå)', 'Ryggbiff (rå)', 'Nötfärs (5 %)']
      },
      {
        name: 'Viltkött',
        items: ['Rådjur (rå)', 'Hjort (rå)', 'Älg (rå)']
      },
      {
        name: 'Fisk & Skaldjur',
        items: ['Torsk (rå)', 'Sej (rå)', 'Tonfisk (rå)', 'Räkor (kokta)', 'Krabba (kokta)', 'Pangasius (rå)', 'Tilapia (rå)']
      },
      {
        name: 'Fläsk',
        items: ['Fläskfilé (rå)', 'Kassler (osötad)']
      },
      {
        name: 'Ägg & Mejeri',
        items: ['Äggvita', 'Keso (1 %)', 'Kvarg (1 %)', 'Grekisk yoghurt (0 %)', 'Whey Proteinpulver', 'Kaseinprotein']
      }
    ]
  },
  carb: {
    subcategories: [
      {
        name: 'Ris',
        items: ['Vitt ris (okokt)', 'Fullkornsris (okokt)', 'Rismjöl', 'Riskakor']
      },
      {
        name: 'Pasta',
        items: ['Pasta (okokt)', 'Fullkornspasta (okokt)']
      },
      {
        name: 'Potatis & Rotfrukter',
        items: ['Potatis (rå)', 'Sötpotatis (rå)', 'Blandade rotfrukter (rå)']
      },
      {
        name: 'Gryn',
        items: ['Havregryn', 'Couscous (okokt)', 'Quinoa (okokt)', 'Matvete (okokt)', 'Mannagryn', 'Majsgryn (Polenta)']
      },
      {
        name: 'Bröd',
        items: ['Osötat bröd (typ råg eller surdeg)']
      },
      {
        name: 'Frukt & Sötning',
        items: ['Banan (rå)', 'Äpple (rå)', 'Russin', 'Honung']
      }
    ]
  },
  fat: {
    subcategories: [
      {
        name: 'Oljor',
        items: ['Olivolja', 'Avokadoolja', 'Kokosolja']
      },
      {
        name: 'Nötter',
        items: ['Valnötter', 'Cashewnötter', 'Pekannötter', 'Paranötter', 'Hasselnötter', 'Macadamianötter']
      },
      {
        name: 'Frön',
        items: ['Solrosfrön (skalade)', 'Pumpafrön (skalade)', 'Chiafrön', 'Sesamfrön']
      },
      {
        name: 'Nötsmör',
        items: ['Osötat Jordnötssmör', 'Osötat Mandelsmör']
      },
      {
        name: 'Övrigt',
        items: ['Avokado']
      }
    ]
  },
  vegetable: {
    intro: 'Grönsaker har mycket låg kaloritäthet vilket gör dem svåra att överäta. Blanda fritt upp till 200g per portion vid lunch och middag. Siffrorna anger kcal per 100g.',
    subcategories: [
      {
        name: 'Under 15 kcal',
        items: ['Gurka (11-13)', 'Isbergssallad (10-14)', 'Huvudsallad (14)', 'Selleri (14)', 'Rättika (14)']
      },
      {
        name: '15-20 kcal',
        items: ['Spenat (15)', 'Squash (15)', 'Salladskål (16)', 'Rädisor (16)', 'Zucchini (17)', 'Romansallat (17)', 'Frisésallat (17)', 'Tomatjuice (17)', 'Rabarber (18)', 'Vattenkrasse (18)', 'Tomat (18-21)', 'Körsbärstomater (18)', 'Paprika grön (20)', 'Sparris (20-23)']
      },
      {
        name: '21-25 kcal',
        items: ['Gröna bönor (21-30)', 'Champinjoner (22-31)', 'Paprika gul (23)', 'Vitkål (23)', 'Blomkål (23-25)', 'Ruccola (25)', 'Rödkål (25)', 'Pumpa (25)', 'Aubergine (25)']
      },
      {
        name: '26-30 kcal',
        items: ['Fänkål (26)', 'Broccoli (27)', 'Purjolök (27)', 'Spetskål (27)', 'Savoykål (27)', 'Kålrabbi (27)', 'Gräslök (24-30)', 'Lök (30-40)', 'Paprika röd (31-36)']
      }
    ]
  },
  berry: {
    intro: 'Bär är låga i kalorier och rika på antioxidanter. Perfekt som tillbehör till frukost eller mellanmål. Siffrorna anger kcal per 100g.',
    subcategories: [
      {
        name: 'Under 40 kcal',
        items: ['Jordgubbar frysta (33)', 'Hallon (34-35)', 'Björnbär (35-44)', 'Smultron (30-40)', 'Åkerbär (35-45)', 'Röda vinbär (37-49)', 'Krusbär (38)', 'Hallon frysta (38)']
      },
      {
        name: '40-50 kcal',
        items: ['Jordgubbar (41)', 'Blåbär frysta (43)', 'Björnbär frysta (43-58)', 'Tranbär (41-46)', 'Röda vinbär (49)', 'Stenbär (45)']
      },
      {
        name: '50-60 kcal',
        items: ['Blåbär (50-53)', 'Hjortron (54)', 'Lingon (55-57)', 'Odon (50)', 'Kråkbär (50)', 'Slånbär (50)']
      },
      {
        name: '60-80 kcal',
        items: ['Fläderbär (67)', 'Svarta vinbär (75-77)']
      }
    ]
  },
  sauce: {
    intro: 'Sås till maten är inget måste, det är ett val. För egen del är det inget jag väljer att lägga delar av mitt kaloriintag på dagligen utan det hör till valda enstaka tillfällen. Ska jag käka sås så ser jag gärna till att det inte springer iväg alldeles vilket det lätt gör med såser rika på fett.\n\nÄr du en såsfantast och väljer att inte tumma på den vanan trots att du vill ha kontroll på kosten, kika i hyllorna vad olika såser innehåller. Vissa kalorisnålare varianter är förvånansvärt bra. Jag rekommenderar Slender-såserna och de andra angivna nedan.\n\nDu kan även med fördel spara mellanmålen och göra såser på hela eller en del av kvargen från dina mellanmål. Makron från såsen dras av från övriga måltider för att bibehålla dina dagliga mål. Siffrorna anger kcal per 100g.',
    subcategories: [
      {
        name: 'Under 10 kcal',
        items: ['Slender Chef Barbeque (4)', 'Slender Chef Sweet Chili (6)']
      },
      {
        name: '10-40 kcal',
        items: ['Slender Chef Sriracha Sauce (23)', 'Slender Chef Spicy Garlic (26)', 'Chunky Salsa Hot Santa Maria (34)', 'Taco Sauce Medium Santa Maria (34)', 'Slender Chef Indian Curry (40)']
      },
      {
        name: '40-70 kcal',
        items: ['Ketchup utan tillsatt socker & salt Heinz (40)', 'Ketchup Osötad Felix (47)', 'Rödvinssås Öhmander (60)', 'Ketchup 50% mindre socker och salt Heinz (64)', 'Favoritsås Öhmander (70)']
      },
      {
        name: '70-100 kcal',
        items: ['Ketchup Original Felix (82)', 'Pepparsås Öhmander (90)']
      },
      {
        name: '100-150 kcal',
        items: ['Tzatziki Avokado Fontana (115)', 'Tzatziki ICA (123)', 'Lätt Crème Fraiche Dragon Citron & Vitlök 11% (132)', 'Lätt Crème Fraiche Tex Mex Lime Koriander 11% (135)', 'Lätt Crème Fraiche Paprika Chili 11% Laktosfri Arla (138)', 'Lätt Crème Fraiche Paprika & Chili 13% Arla Köket (140)', 'Lätt Crème Fraiche Tomat & Basilika 11% Arla Köket (140)', 'Lätt Crème Fraiche Sötstark Mango 11% Arla (141)', 'Lätt Crème Fraiche Parmesan & Vitlök 12% Arla Köket (143)', 'Lätt Crème Fraiche Feta & Soltorkad Tomat 12% Arla (150)']
      },
      {
        name: 'Över 150 kcal',
        items: ['Sweet Chili Sås Asia Mindre Socker Santa Maria (178)']
      }
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

  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className={cn("flex items-center gap-2", config?.color)}>
            <span>{config?.icon}</span>
            Rekommenderade {config?.label?.toLowerCase()}
          </DialogTitle>
        </DialogHeader>
        <div className={cn("flex-1 overflow-y-auto rounded-lg p-3", config?.bg)}>
          {/* Intro text if available */}
          {data.intro && (
            <p className="text-sm text-zinc-600 mb-4 whitespace-pre-line leading-relaxed">
              {data.intro}
            </p>
          )}

          {/* Subcategories */}
          <div className="space-y-4">
            {data.subcategories.map((sub, subIndex) => (
              <div key={subIndex}>
                <h3 className={cn("font-semibold text-sm mb-2", config?.color)}>
                  {sub.name}
                </h3>
                <div className={cn("rounded-lg p-2", config?.subBg)}>
                  <div className="text-sm text-zinc-700 leading-relaxed">
                    {sub.items.join(', ')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
