'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { ChevronDown, BookOpen, Info, Lightbulb, Carrot } from 'lucide-react'
import { MDXPreview } from '@/components/mdx-preview'

// Food category data (inline from RecommendedFoodsDialog)
type CategoryData = {
  intro?: string
  subcategories: { name: string; items: string[] }[]
}

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
        items: ['Fläder (67)', 'Svarta vinbär (75-77)']
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
  },
  spice: {
    intro: 'Kryddor kan lyfta smaken på din mat utan att tillföra kalorier. Här är några tips för hur du använder kryddor på bästa sätt.',
    subcategories: [
      {
        name: 'Tips',
        items: ['Använd helst färska kryddor', 'Salta med sunt förnuft', 'Undvik blandkryddor (tex grillkrydda, citronpeppar)', 'Använd rena kryddor som cayenne, chili, curry etc.']
      }
    ]
  },
  cooking_fat: {
    intro: 'Använd gärna matlagningspray istället för olja då det lätt kan bli för mycket och därmed extra kalorier. Pam Original Cooking Spray och Slender Chef Cooking Spray är exempel på dessa.\n\nOm du inte tycker det är något för dig så stek i olivolja, rapsolja eller kokosolja (smakfri variant).',
    subcategories: [
      {
        name: 'Matlagningsspray (rekommenderas)',
        items: ['Pam Original Cooking Spray', 'Slender Chef Cooking Spray']
      },
      {
        name: 'Oljor för stekning',
        items: ['Olivolja', 'Rapsolja', 'Kokosolja (smakfri variant)']
      }
    ]
  }
}

const CATEGORY_CONFIG = {
  protein: { label: 'Protein', shortLabel: 'Prot', icon: '🥩', color: 'text-rose-700', bg: 'bg-rose-50', subBg: 'bg-rose-100/50', hoverBg: 'hover:bg-rose-50' },
  carb: { label: 'Kolhydrater', shortLabel: 'Kolh', icon: '🌾', color: 'text-amber-700', bg: 'bg-amber-50', subBg: 'bg-amber-100/50', hoverBg: 'hover:bg-amber-50' },
  fat: { label: 'Fett', shortLabel: 'Fett', icon: '🥑', color: 'text-sky-700', bg: 'bg-sky-50', subBg: 'bg-sky-100/50', hoverBg: 'hover:bg-sky-50' },
  vegetable: { label: 'Grönsaker', shortLabel: 'Grön', icon: '🥬', color: 'text-emerald-700', bg: 'bg-emerald-50', subBg: 'bg-emerald-100/50', hoverBg: 'hover:bg-emerald-50' },
  berry: { label: 'Bär', shortLabel: 'Bär', icon: '🫐', color: 'text-purple-700', bg: 'bg-purple-50', subBg: 'bg-purple-100/50', hoverBg: 'hover:bg-purple-50' },
  sauce: { label: 'Såser', shortLabel: 'Sås', icon: '🥫', color: 'text-orange-700', bg: 'bg-orange-50', subBg: 'bg-orange-100/50', hoverBg: 'hover:bg-orange-50' },
  spice: { label: 'Kryddor', shortLabel: 'Kryd', icon: '🧂', color: 'text-yellow-700', bg: 'bg-yellow-50', subBg: 'bg-yellow-100/50', hoverBg: 'hover:bg-yellow-50' },
  cooking_fat: { label: 'Matlagningsfett', shortLabel: 'Olja', icon: '🫒', color: 'text-lime-700', bg: 'bg-lime-50', subBg: 'bg-lime-100/50', hoverBg: 'hover:bg-lime-50' },
}

interface GuidePanelProps {
  mealPlanDescriptionContent: string
  nutritionTipsContent: string
}

type SelectedItem =
  | { type: 'intro' }
  | { type: 'tips' }
  | { type: 'howto' }
  | { type: 'food'; category: keyof typeof CATEGORY_CONFIG }

export function GuidePanel({ mealPlanDescriptionContent, nutritionTipsContent }: GuidePanelProps) {
  const [expandedGroup, setExpandedGroup] = useState<'learn' | 'food' | null>('learn')
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null)

  const toggleGroup = (group: 'learn' | 'food') => {
    setExpandedGroup(prev => prev === group ? null : group)
  }

  const renderFoodContent = (category: keyof typeof CATEGORY_CONFIG) => {
    const config = CATEGORY_CONFIG[category]
    const data = RECOMMENDED_FOODS[category]
    if (!data) return null

    return (
      <div className={cn("rounded-lg p-4", config.bg)}>
        <h3 className={cn("font-semibold text-lg mb-3 flex items-center gap-2", config.color)}>
          <span>{config.icon}</span>
          Rekommenderade {config.label.toLowerCase()}
        </h3>

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
              <h4 className={cn("font-semibold text-sm mb-2", config.color)}>
                {sub.name}
              </h4>
              <div className={cn("rounded-lg p-2", config.subBg)}>
                <ul className="text-sm text-zinc-700 space-y-0.5">
                  {sub.items.map((item, itemIndex) => (
                    <li key={itemIndex} className="flex items-start gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-40 mt-1.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderHowToContent = () => (
    <div className="space-y-6 text-gray-700">
      <p>
        Din kostplan kan anpassas helt efter dina egna preferenser. Det viktigaste är att du matchar makros korrekt och att dina matbyten håller samma kvalitet och näringsvärde.
      </p>
      <p>
        Du kan variera maten dagligen, men se till att kvaliteten bibehålls. Prioritera hela, oprocessade livsmedel och tänk på mikronäringsämnena (vitaminer och mineraler) du får från maten – inte bara makronäringsämnena (protein, kolhydrater och fett).
      </p>

      <div>
        <h2 className="text-amber-600 text-lg font-semibold mb-2">Hur du väljer livsmedel</h2>
        <p className="mb-3">
          Trycker du på källorna, t.ex. proteinkälla för varje måltid, så får du upp en lista på rekommenderade livsmedel. Sen matchar du det mot livsmedlet du handlar.
        </p>
        <div className="bg-gray-100 p-4 rounded-lg space-y-2">
          <p><strong className="text-gray-900">Nötkött 5 %</strong> = ICAS Nötfärs 5 %</p>
          <p><strong className="text-gray-900">Kvarg 0,2 %</strong> = Kvarg Mild Persika Passion Laktosfri 0,2% 1000g Arla</p>
        </div>
      </div>

      <div>
        <h2 className="text-amber-600 text-lg font-semibold mb-2">De tre grundpelarna</h2>
        <ul className="list-disc list-inside space-y-1">
          <li><strong className="text-gray-900">Dina kalorier</strong> styr din vikt.</li>
          <li><strong className="text-gray-900">Dina makros</strong> styr din kroppssammansättning.</li>
          <li><strong className="text-gray-900">Kvaliteten på din mat</strong> styr hur du mår.</li>
        </ul>
      </div>

      <div>
        <h2 className="text-amber-600 text-lg font-semibold mb-2">Antal måltider</h2>
        <p className="mb-3">
          När du väljer hur många måltider per dag du vill äta är min rekommendation att sikta på fyra till fem. Det håller hungern i schack, energin jämn och gör det lättare att komma upp i protein.
        </p>
        <p className="mb-3">
          Men om du hellre vill äta tre måltider, eller sex, går det också utmärkt. Det viktigaste är att det passar din vardag. Det ska fungera i praktiken, inte skapa stress, frustration eller krocka med livspusslet.
        </p>
        <p>
          Oavsett hur många måltider du väljer är principen enkel: du tar din totala mängd protein, kolhydrater och fett och delar upp det på antalet måltider du vill äta. Det är gynnsamt att ha något högre kolhydrater i måltiden före och efter träning för prestation och återhämtning.
        </p>
      </div>

      <div>
        <h2 className="text-amber-600 text-lg font-semibold mb-2">Anpassa efter din hunger</h2>
        <p className="mb-3">
          Försök hålla koll på när du är hungrig och planera ditt intag efter de tiderna. Många har till exempel inte så stor aptit på morgonen, men suget efter mat tar fart på kvällen.
        </p>
        <p className="mb-2">De personerna kan ha nytta av att justera intaget på något av följande sätt:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Äta en mindre frukost och lunch, sedan en större middag och kvällssnack.</li>
          <li>Äta mestadels protein och grönsaker (lågt kaloriinnehåll men stöttar muskler) på förmiddagen och eftermiddagen, och lägga mer kolhydrater på middagen och kvällsmålen.</li>
          <li>Ha längre tid mellan de tidigare målen och kortare tid mellan de senare.</li>
        </ul>
      </div>

      <div>
        <h2 className="text-amber-600 text-lg font-semibold mb-2">Hundraårsregeln</h2>
        <p className="mb-3">
          Välj livsmedel som fanns för hundra år sedan. Det innebär att du prioriterar råvaror som kött, fisk, potatis, ägg, grönsaker, frukt och mejeriprodukter, och undviker moderna ultraprocessade produkter.
        </p>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm">
            <strong className="text-amber-600">Förtydligande om gråzoner:</strong> Hundraårsregeln är en vägledning, inte en absolut lag. Vissa livsmedel är mer bearbetade men fyller en praktisk funktion och har sin plats i en bra kosthållning.
          </p>
        </div>
      </div>
    </div>
  )

  const renderContent = () => {
    if (!selectedItem) {
      return (
        <div className="flex items-center justify-center h-full text-gray-400">
          <p>Välj ett alternativ i menyn</p>
        </div>
      )
    }

    switch (selectedItem.type) {
      case 'intro':
        return mealPlanDescriptionContent ? (
          <MDXPreview content={mealPlanDescriptionContent} />
        ) : (
          <p className="text-gray-400">Laddar innehåll...</p>
        )
      case 'tips':
        return nutritionTipsContent ? (
          <MDXPreview content={nutritionTipsContent} />
        ) : (
          <p className="text-gray-400">Laddar råd...</p>
        )
      case 'howto':
        return renderHowToContent()
      case 'food':
        return renderFoodContent(selectedItem.category)
      default:
        return null
    }
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="flex flex-col md:flex-row">
        {/* Sidebar - horizontal on mobile, vertical on desktop */}
        <div className="md:w-56 border-b md:border-b-0 md:border-r border-gray-200 p-3 shrink-0">
          {/* Mobile: Horizontal button group */}
          <div className="flex md:flex-col gap-2">
            {/* Lar dig mer grupp */}
            <div className="flex-1 md:flex-none">
              <button
                onClick={() => toggleGroup('learn')}
                className="w-full flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold shadow-sm hover:from-blue-700 hover:to-blue-600 transition-all text-sm md:text-base"
              >
                <span className="flex items-center gap-1.5 md:gap-2">
                  <BookOpen className="w-4 h-4" />
                  <span className="hidden sm:inline">Lär dig mer</span>
                  <span className="sm:hidden">Lärande</span>
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", expandedGroup === 'learn' && "rotate-180")} />
              </button>
            </div>

            {/* Livsmedel grupp */}
            <div className="flex-1 md:flex-none">
              <button
                onClick={() => toggleGroup('food')}
                className="w-full flex items-center justify-between p-2 md:p-2.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold shadow-sm hover:from-emerald-700 hover:to-emerald-600 transition-all text-sm md:text-base"
              >
                <span className="flex items-center gap-1.5 md:gap-2">
                  <Carrot className="w-4 h-4" />
                  Livsmedel
                </span>
                <ChevronDown className={cn("w-4 h-4 transition-transform", expandedGroup === 'food' && "rotate-180")} />
              </button>
            </div>
          </div>

          {/* Expanded sub-items */}
          {expandedGroup === 'learn' && (
            <div className="mt-2 md:ml-2 grid grid-cols-3 md:grid-cols-1 gap-1">
              <button
                onClick={() => setSelectedItem({ type: 'intro' })}
                className={cn(
                  "text-left px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1.5 md:gap-2",
                  selectedItem?.type === 'intro'
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Info className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                <span className="truncate">Intro</span>
              </button>
              <button
                onClick={() => setSelectedItem({ type: 'tips' })}
                className={cn(
                  "text-left px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1.5 md:gap-2",
                  selectedItem?.type === 'tips'
                    ? "bg-amber-100 text-amber-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Lightbulb className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                <span className="truncate">Råd</span>
              </button>
              <button
                onClick={() => setSelectedItem({ type: 'howto' })}
                className={cn(
                  "text-left px-2 md:px-3 py-2 rounded-lg text-xs md:text-sm transition-colors flex items-center gap-1.5 md:gap-2",
                  selectedItem?.type === 'howto'
                    ? "bg-emerald-100 text-emerald-700 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <BookOpen className="w-3 h-3 md:w-3.5 md:h-3.5 shrink-0" />
                <span className="truncate">Guide</span>
              </button>
            </div>
          )}

          {expandedGroup === 'food' && (
            <div className="mt-2 md:ml-2 grid grid-cols-4 md:grid-cols-1 gap-1">
              {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((key) => {
                const config = CATEGORY_CONFIG[key]
                const isSelected = selectedItem?.type === 'food' && selectedItem.category === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedItem({ type: 'food', category: key })}
                    className={cn(
                      "text-left px-1.5 md:px-3 py-1.5 md:py-2 rounded-lg text-[10px] md:text-sm transition-colors flex flex-col md:flex-row items-center gap-0.5 md:gap-2",
                      isSelected
                        ? cn(config.bg, config.color, "font-medium")
                        : cn("text-gray-600", config.hoverBg)
                    )}
                  >
                    <span className="shrink-0">{config.icon}</span>
                    <span className="md:hidden truncate">{config.shortLabel}</span>
                    <span className="hidden md:inline truncate">{config.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Content Panel */}
        <div className={cn(
          "flex-1 p-3 md:p-4 overflow-y-auto",
          selectedItem ? "min-h-[250px] max-h-[400px] md:min-h-[300px] md:max-h-[500px]" : "min-h-[100px]"
        )}>
          {renderContent()}
        </div>
      </div>
    </div>
  )
}
