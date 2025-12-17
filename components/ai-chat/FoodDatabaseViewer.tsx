'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Database, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

// Kategorier med livsmedel som AI:n har tillgång till
const FOOD_DATABASE = {
  protein: {
    label: 'Proteinkällor',
    icon: '🥩',
    color: 'rose',
    subcategories: {
      'Fågel': ['Kycklingbröst', 'Kycklingfilé', 'Kalkonfilé', 'Ankbröst', 'Kyckling ben'],
      'Nötkött': ['Nötfärs', 'Entrecote', 'Ryggbiff', 'Oxfilé', 'Högrev'],
      'Fläsk': ['Fläskfilé', 'Fläskkotlett', 'Bacon', 'Skinka'],
      'Vilt': ['Älgfärs', 'Hjortfilé', 'Vildsvin', 'Ren'],
      'Fisk': ['Lax', 'Torsk', 'Sej', 'Rödspätta', 'Makrill', 'Tonfisk', 'Öring', 'Abborre'],
      'Skaldjur': ['Räkor', 'Kräftor', 'Musslor', 'Bläckfisk'],
      'Mejeri': ['Kvarg naturell fett 0,2%', 'Keso', 'Cottage cheese'],
      'Baljväxter': ['Röda linser', 'Gröna linser', 'Kikärtor', 'Svarta bönor', 'Vita bönor', 'Kidneybönor'],
    }
  },
  carbs: {
    label: 'Kolhydratkällor',
    icon: '🌾',
    color: 'amber',
    subcategories: {
      'Ris': ['Jasminris', 'Basmatiris', 'Vitt ris långkornigt', 'Fullkornsris/Råris', 'Sushiris', 'Vildris', 'Snabbris'],
      'Pasta': ['Pasta kokt', 'Fullkornspasta', 'Äggnudlar', 'Glasnudlar', 'Risnudlar'],
      'Gryn': ['Havregryn fullkorn', 'Couscous', 'Quinoa', 'Bulgur', 'Matvete', 'Hirs', 'Korngryn', 'Majsgryn/Polenta', 'Mannagryn'],
      'Potatis': ['Potatis kokt', 'Sötpotatis', 'Mandelpotatis'],
      'Rotfrukter': ['Morot', 'Palsternacka', 'Rotselleri', 'Kålrot', 'Rödbetor'],
      'Frukt': ['Banan', 'Äpple', 'Apelsin', 'Päron', 'Mango', 'Ananas', 'Vindruvor'],
      'Bröd': ['Mjukt bröd', 'Knäckebröd', 'Riskakor'],
      'Övrigt': ['Honung', 'Russin', 'Dadlar', 'Rismjöl'],
    }
  },
  fat: {
    label: 'Fettkällor',
    icon: '🥑',
    color: 'sky',
    subcategories: {
      'Ägg': ['Ägg kokt', 'Ägg stekt', 'Ägg rått'],
      'Ost': ['Cheddar', 'Gouda', 'Edamer', 'Gruyère', 'Parmesan', 'Mozzarella', 'Fetaost'],
      'Oljor': ['Olivolja', 'Rapsolja', 'Kokosolja', 'Sesamolja', 'Linfröolja', 'Avokadoolja'],
      'Nötsmör': ['Jordnötssmör', 'Mandelsmör', 'Tahini'],
      'Nötter': ['Mandlar', 'Valnötter', 'Cashewnötter', 'Hasselnötter', 'Paranötter', 'Pekannötter', 'Macadamianötter', 'Pistaschnötter'],
      'Frön': ['Solrosfrön', 'Pumpafrön', 'Chiafrön', 'Sesamfrön', 'Linfrön', 'Hampafrön'],
      'Övrigt': ['Avokado', 'Kokosflingor'],
    }
  },
  berries: {
    label: 'Bär',
    icon: '🫐',
    color: 'purple',
    subcategories: {
      'Bär': ['Blåbär', 'Hallon', 'Jordgubbar', 'Björnbär', 'Lingon', 'Vinbär', 'Krusbär'],
    }
  },
  vegetables: {
    label: 'Grönsaker',
    icon: '🥬',
    color: 'emerald',
    subcategories: {
      'Bladgrönsaker': ['Spenat', 'Sallad', 'Ruccola', 'Grönkål', 'Mangold'],
      'Grönsaker': ['Broccoli', 'Blomkål', 'Gurka', 'Tomat', 'Paprika', 'Zucchini', 'Aubergine', 'Sparris'],
      'Lök': ['Gul lök', 'Rödlök', 'Vitlök', 'Purjolök', 'Salladslök'],
      'Svamp': ['Champinjoner', 'Portabello', 'Shiitake', 'Kantareller'],
    }
  },
  dairy: {
    label: 'Mejeri',
    icon: '🥛',
    color: 'slate',
    subcategories: {
      'Mjölk': ['Mjölk 3%', 'Mjölk 1,5%', 'Mjölk 0,5%', 'Havremjölk', 'Mandeldryck'],
      'Yoghurt': ['Yoghurt naturell', 'Grekisk yoghurt', 'Turkisk yoghurt', 'Fil'],
    }
  }
};

// Dark mode colors to match AI chat theme
const colorClasses: Record<string, { bg: string; border: string; text: string; headerBg: string }> = {
  rose: { bg: 'bg-rose-950/30', border: 'border-rose-800/50', text: 'text-rose-300', headerBg: 'bg-rose-900/40' },
  amber: { bg: 'bg-amber-950/30', border: 'border-amber-800/50', text: 'text-amber-300', headerBg: 'bg-amber-900/40' },
  sky: { bg: 'bg-sky-950/30', border: 'border-sky-800/50', text: 'text-sky-300', headerBg: 'bg-sky-900/40' },
  purple: { bg: 'bg-purple-950/30', border: 'border-purple-800/50', text: 'text-purple-300', headerBg: 'bg-purple-900/40' },
  emerald: { bg: 'bg-emerald-950/30', border: 'border-emerald-800/50', text: 'text-emerald-300', headerBg: 'bg-emerald-900/40' },
  slate: { bg: 'bg-slate-800/30', border: 'border-slate-700/50', text: 'text-slate-300', headerBg: 'bg-slate-700/40' },
};

export function FoodDatabaseViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleCategory = (key: string) => {
    setExpandedCategories(prev =>
      prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]
    );
  };

  // Filter foods based on search
  const filterFoods = (subcategories: Record<string, string[]>) => {
    if (!searchTerm) return subcategories;

    const filtered: Record<string, string[]> = {};
    for (const [subcat, foods] of Object.entries(subcategories)) {
      const matchingFoods = foods.filter(f =>
        f.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matchingFoods.length > 0) {
        filtered[subcat] = matchingFoods;
      }
    }
    return filtered;
  };

  const hasSearchResults = (subcategories: Record<string, string[]>) => {
    if (!searchTerm) return true;
    return Object.keys(filterFoods(subcategories)).length > 0;
  };

  return (
    <div className="border-b border-[#3f3f3f] bg-[#2a2a2a]">
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-[#333] transition-colors"
      >
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Database className="h-4 w-4" />
          <span>Visa tillgängliga livsmedel</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-500" />
        )}
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              placeholder="Sök livsmedel..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm bg-[#404040] border border-[#505050] rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#e07a5f]/50"
            />
          </div>

          {/* Categories */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {Object.entries(FOOD_DATABASE).map(([key, category]) => {
              if (!hasSearchResults(category.subcategories)) return null;

              const colors = colorClasses[category.color];
              const isExpanded = expandedCategories.includes(key);
              const filteredSubs = filterFoods(category.subcategories);

              return (
                <div key={key} className={cn("rounded-lg border", colors.border)}>
                  <button
                    onClick={() => toggleCategory(key)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-t-lg",
                      colors.headerBg
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span>{category.icon}</span>
                      <span className={cn("font-medium text-sm", colors.text)}>
                        {category.label}
                      </span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className={cn("h-4 w-4", colors.text)} />
                    ) : (
                      <ChevronDown className={cn("h-4 w-4", colors.text)} />
                    )}
                  </button>

                  {isExpanded && (
                    <div className={cn("p-2 space-y-2", colors.bg)}>
                      {Object.entries(filteredSubs).map(([subcat, foods]) => (
                        <div key={subcat}>
                          <div className="text-xs font-semibold text-gray-500 mb-1">
                            {subcat}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {foods.map(food => (
                              <span
                                key={food}
                                className="text-xs px-2 py-0.5 bg-[#404040] rounded-full border border-[#505050] text-gray-300"
                              >
                                {food}
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <p className="text-xs text-gray-500 text-center">
            AI:n använder Livsmedelsverkets officiella näringsvärden
          </p>
        </div>
      )}
    </div>
  );
}
