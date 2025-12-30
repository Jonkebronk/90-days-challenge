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
    intro: 'Sås till maten är inget måste, det är ett val. För egen del är det inget jag väljer att lägga delar av mitt kaloriintag på dagligen utan det hör till valda enstaka tillfällen. Ska jag käka sås så ser jag gärna till att det inte springer iväg alldeles vilket det lätt gör med såser rika på fett.\n\nÄr du en såsfantast och väljer att inte tumma på den vanan trots att du vill ha kontroll på kosten, kika i hyllorna vad olika såser innehåller. Vissa kalorisnålare varianter är förvånansvärt bra. Jag rekommenderar Slender-såserna och de andra angivna nedan.\n\nDu kan även med fördel spara mellanmålen och göra såser på hela eller en del av kvargen från dina mellanmål.',
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
  cooking_fat: { label: 'Matlagningsfett', shortLabel: 'Olja', icon: '🛢️', color: 'text-lime-700', bg: 'bg-lime-50', subBg: 'bg-lime-100/50', hoverBg: 'hover:bg-lime-50' },
}

interface GuidePanelProps {
  mealPlanDescriptionContent?: string
  nutritionTipsContent?: string
}

export function GuidePanel({ }: GuidePanelProps) {
  const [guideExpanded, setGuideExpanded] = useState(false)
  const [foodExpanded, setFoodExpanded] = useState(false)
  const [selectedGuide, setSelectedGuide] = useState<'flexible' | 'howto' | 'practical' | 'faq' | null>(null)
  const [selectedFood, setSelectedFood] = useState<keyof typeof CATEGORY_CONFIG | null>(null)

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

  // Content for each guide section
  const guideContent = {
    flexible: `**Flexibel kosthållning**

Jag har byggt den här kostmodulen för att låta dig anpassa din kost utifrån ditt liv. Vi har alla olika preferenser, scheman och behov av variation – och din kostplan ska fungera för dig, inte tvärtom.

**Varför flexibilitet fungerar**

Rigida dieter misslyckas oftare än flexibla. Forskning visar att personer med ett flexibelt förhållningssätt till mat har:

- Lägre kroppsvikt över tid
- Färre episoder av överätande
- Bättre relation till mat
- Högre sannolikhet att behålla resultaten

Anledningen är enkel: en plan du faktiskt kan följa slår alltid en "perfekt" plan du ger upp efter tre veckor.

**Grundprincipen**

Din kostplan kan anpassas helt efter dina egna preferenser. Det viktigaste är att du matchar makros korrekt och att dina matbyten håller samma kvalitet och näringsvärde.

Du kan variera maten dagligen, men se till att kvaliteten bibehålls. Prioritera hela, oprocessade livsmedel och tänk på mikronäringsämnena (vitaminer och mineraler) du får från maten – inte bara makronäringsämnena (protein, kolhydrater och fett).

**De tre grundpelarna**

- **Dina kalorier** styr din vikt
- **Dina makros** styr din kroppssammansättning
- **Kvaliteten på din mat** styr hur du mår

**Hundraårsregeln**

Välj livsmedel som fanns för hundra år sedan. Det innebär att du prioriterar råvaror som kött, fisk, potatis, ägg, grönsaker, frukt och mejeriprodukter – och undviker moderna ultraprocessade produkter.

*Förtydligande om gråzoner:* Hundraårsregeln är en vägledning, inte en absolut lag. Vissa livsmedel är mer bearbetade men fyller en praktisk funktion och har sin plats i en bra kosthållning. Proteinpulver, kvarg och fullkornspasta är exempel på detta.

**Hur du väljer livsmedel**

Trycker du på källorna (t.ex. proteinkälla) för varje måltid får du upp en lista på rekommenderade livsmedel. Sen matchar du det mot livsmedlet du handlar.

*Exempel:*
- Nötkött 5% = ICAs Nötfärs 5%
- Kvarg 0,2% = Arla Kvarg Mild Persika Passion Laktosfri 0,2% 1000g

**Vad du kan byta ut**

- **Proteinkällor:** Kyckling kan bytas mot fisk, ägg, kvarg, bönor eller annat med liknande proteininnehåll.
- **Kolhydratkällor:** Ris kan bytas mot potatis, pasta, bulgur, quinoa eller bröd – så länge mängden kolhydrater matchar.
- **Fettkällor:** Olivolja kan bytas mot avokado, nötter eller annan fettkälla med samma kalorimängd.
- **Grönsaker:** Byt fritt mellan grönsaker. Mer variation betyder mer variation i näringsämnen.

**Vad du bör tänka på**

- **Matcha makros** – Om du byter ut något, se till att protein, kolhydrater och fett blir ungefär samma
- **Behåll kvaliteten** – Byt inte bort fullkornspasta mot godis bara för att kolhydraterna matchar
- **Tänk på mättnad** – Vissa livsmedel mättar mer än andra. 400 kcal från havregryn håller dig mätt längre än 400 kcal från juice

**Variation är bra**

Större variation i maten betyder mer variation i näringsämnen – och det är positivt.

Att äta samma saker varje dag kan fungera kortsiktigt, men i längden:
- Ökar risken för näringsbrister
- Blir tråkigt och ökar risken att ge upp
- Gör det svårare att äta socialt

Jag uppmuntrar dig att variera. Testa nya livsmedel, prova recept från receptbanken, och gör kostplanen till din egen.

**Receptbanken**

Om du blir uttråkad eller vill ha inspiration – kolla i receptbanken. Alla recept kan redigeras och anpassas så de passar in i din kostplan.

Du kan också skapa egna måltider och spara dem för framtida bruk.`,

    howto: `**Så använder du kostplanen**

**Översikt**

Din kostplan är uppdelad i måltider: Frukost, Lunch, Mellanmål, Middag och Kvällsmål. Varje måltid visar sina makros (kalorier, protein, kolhydrater och fett) så du alltid har koll på helheten.

**Antal måltider**

Du kan själv justera hur många måltider du vill äta per dag. Standardupplägget är fem måltider (Frukost, Lunch, Mellanmål, Middag, Kvällsmål), men det går att anpassa efter vad som fungerar för dig.

Vissa föredrar tre större måltider, andra vill ha sex mindre. Det spelar ingen roll för resultatet – så länge du träffar dina totala kalorier och makros över dagen.

Välj det upplägg som passar din vardag och gör det lättare att hålla planen.

**Steg för steg**

**1. Välj måltid**
Klicka på den måltid du vill redigera för att expandera den.

**2. Lägg till livsmedel**
Klicka på "+ Lägg till" vid den kategori du vill fylla i:
- Proteinkällor (röd) – Kyckling, fisk, ägg, kvarg etc.
- Kolhydrater (gul) – Ris, potatis, havregryn etc.
- Fettkällor (grön) – Olivolja, nötter, avokado etc.

**3. Välj från listan**
Du får upp en lista med rekommenderade livsmedel. Välj det som matchar vad du har hemma eller ska handla.

*Exempel:*
- "Kycklingfilé (rå)" i listan = Kycklingfilé du köper i butiken
- "Kvarg (1%)" i listan = Arla Kvarg eller liknande

**4. Justera mängden**
Ändra gramvikten så det passar dina makros. Systemet räknar om automatiskt.

*Kom ihåg: Alla vikter är råvikter – du väger maten innan tillagning.*

**5. Lägg till grönsaker och bär**
Under "Tillbehör" kan du lägga till grönsaker och bär. Dessa är mer fria – ät de sorter du gillar och i den mängd som passar.

**6. Använd receptförslag**
Under varje måltid finns receptförslag som passar dina makros. Klicka på ett recept för att se ingredienser och instruktioner. Alla recept kan anpassas.

**Hittar du inte ett livsmedel?**

Om du inte hittar det du söker i listan kan du skicka en förfrågan till mig. Klicka på "Förfrågan om livsmedel" och fyll i:
- Livsmedelsnamn (t.ex. "Kvarg vanilj")
- Märke (t.ex. "Lindahls")
- Kategori (valfritt)
- Bild på framsidan och innehållsförteckning (valfritt men hjälper)

Jag granskar förfrågan och lägger till livsmedlet i databasen om det passar in.

**Tips för smidigare vardag**

- **Spara favoriter** – Hittar du kombinationer som funkar, spara dem för snabbare planering
- **Meal prep** – Förbered flera måltider samtidigt och portionera upp
- **Byt fritt inom kategori** – Trött på kyckling? Byt till fisk eller kvarg så länge makros matchar
- **Grönsaker är fria** – Fyll på med grönsaker för mättnad utan att stressa över exakta mängder

**Om något inte stämmer**

Ibland matchar inte livsmedlet i butiken exakt med listan. Då gör du så här:
1. Kolla näringsvärdet på förpackningen
2. Jämför protein, kolhydrater och fett per 100g
3. Om det är ungefär samma – kör på
4. Om det skiljer mycket – justera mängden eller välj annat

*Exempel: Listan säger "Kvarg 1%" men du hittar bara 0,2%. Ingen fara – skillnaden är minimal. Använd den du hittar.*

**Vanliga misstag att undvika**

- **Glömma att väga rått** – Tillagad vikt ≠ råvikt. 100g rått ris blir ca 250g kokt
- **Skippa grönsaker** – De ger volym, mättnad och mikronäringsämnen
- **Stressa över perfektion** – Inom ±5g spelar ingen roll. Sikta på "tillräckligt bra"`,

    practical: `**Praktiska riktlinjer**

**Råvikter**

Alla vikter i kostplanen är råvikter – det vill säga matens vikt innan tillagning.

Du väger kycklingen upptinad men rå, potatisen oskalad och rå, riset okokt. Grönsaker och bär kan vägas frysta.

*Viktigt: "Råvikt" betyder inte att maten ska ätas rå. Det är bara vikten innan tillagning.*

**Matlagning**

Använd gärna matlagningsspray istället för olja – det är lätt att hälla för mycket och därmed få i sig extra kalorier utan att tänka på det.

*Exempel på matlagningssprays:*
- Pam Original Cooking Spray
- Slender Chef Cooking Spray

Om spray inte är något för dig, stek i olivolja eller kokosolja (smakfri variant). Mät upp mängden så du vet vad du får i dig.

**Kryddor**

- Använd helst färska kryddor
- Salta med sunt förnuft
- Undvik blandkryddor (grillkrydda, citronpeppar etc.) – de innehåller ofta socker och tillsatser
- Använd rena kryddor som cayenne, chili, curry, paprika, vitlök, oregano

**Grönsaker**

Ät grönsaker du gillar. Exempel:
- Isbergssallad, spenat, ruccola
- Broccoli, blomkål, zucchini
- Gurka, tomat, paprika
- Morötter, sparris, haricots verts

*Tips: Frysta och hackade grönsaker är smidigt, billigt och lika näringsrikt som färska.*

**Såser**

Vill du ha sås till en måltid? Kolla i receptbankens såsavsnitt eller välj en lågkalorisås. Undvik färdiga såser med mycket socker och fett.

**Drycker**

- **Vatten** – Förstahandsvalet, alltid
- **Kaffe och te** – Utan socker, gärna utan mjölk
- **Kalorifria läskedrycker och energidrycker** – Går bra, men vatten är bättre`,

    faq: `**Vanliga frågor**

**Hur ska jag väga maten?**

Du väger all mat rå – upptinad kyckling, rå potatis, okokt ris. Grönsaker och bär kan vägas frysta.

**Ska riset ätas okokt?**

Nej, riset ska självklart kokas. "Råvikt" betyder bara att du väger det innan tillagning.

**Jag kissar väldigt mycket. Är det normalt?**

Helt normalt de första 10 dagarna. Du går ner i vätska, särskilt om du minskat kolhydraterna, och det ska ut någonstans. Inget att oroa sig över.

**Vad är magert nötkött?**

Nötkött med max 5% fetthalt.

---

**Det viktigaste**

Din kostplan ska fungera i praktiken. Den ska inte skapa stress, frustration eller krocka med livspusslet.

*Perfekt är fienden till bra.* En plan som är 80% rätt och som du faktiskt följer slår en plan som är 100% rätt på pappret men som du ger upp efter en vecka.

Har du frågor om byten eller anpassningar? Det är bara att skriva.`
  }

  const renderGuideContent = () => {
    if (!selectedGuide) return null
    return <MDXPreview content={guideContent[selectedGuide]} />
  }

  return (
    <div className="space-y-3">
      {/* Kostguide Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setGuideExpanded(!guideExpanded)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-700 hover:to-blue-600 transition-all"
        >
          <span className="flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Kostguide
          </span>
          <ChevronDown className={cn("w-5 h-5 transition-transform", guideExpanded && "rotate-180")} />
        </button>

        {guideExpanded && (
          <div className="p-3">
            {/* Guide buttons */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-3">
              <button
                onClick={() => setSelectedGuide(selectedGuide === 'flexible' ? null : 'flexible')}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                  selectedGuide === 'flexible'
                    ? "bg-blue-100 text-blue-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Info className="w-4 h-4 shrink-0" />
                <span className="truncate">Flexibel kost</span>
              </button>
              <button
                onClick={() => setSelectedGuide(selectedGuide === 'howto' ? null : 'howto')}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                  selectedGuide === 'howto'
                    ? "bg-emerald-100 text-emerald-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span className="truncate">Så använder du</span>
              </button>
              <button
                onClick={() => setSelectedGuide(selectedGuide === 'practical' ? null : 'practical')}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                  selectedGuide === 'practical'
                    ? "bg-amber-100 text-amber-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Lightbulb className="w-4 h-4 shrink-0" />
                <span className="truncate">Praktiska tips</span>
              </button>
              <button
                onClick={() => setSelectedGuide(selectedGuide === 'faq' ? null : 'faq')}
                className={cn(
                  "px-3 py-2 rounded-lg text-sm transition-colors flex items-center gap-2",
                  selectedGuide === 'faq'
                    ? "bg-purple-100 text-purple-700 font-medium"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                <Info className="w-4 h-4 shrink-0" />
                <span className="truncate">Vanliga frågor</span>
              </button>
            </div>

            {/* Guide content */}
            {selectedGuide && (
              <div className="border-t border-gray-200 pt-3 max-h-[400px] overflow-y-auto">
                {renderGuideContent()}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Livsmedel Section */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => setFoodExpanded(!foodExpanded)}
          className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold hover:from-emerald-700 hover:to-emerald-600 transition-all"
        >
          <span className="flex items-center gap-2">
            <Carrot className="w-5 h-5" />
            Livsmedel
          </span>
          <ChevronDown className={cn("w-5 h-5 transition-transform", foodExpanded && "rotate-180")} />
        </button>

        {foodExpanded && (
          <div className="p-3">
            {/* Food category buttons */}
            <div className="grid grid-cols-4 md:grid-cols-8 gap-1 mb-3">
              {(Object.keys(CATEGORY_CONFIG) as Array<keyof typeof CATEGORY_CONFIG>).map((key) => {
                const config = CATEGORY_CONFIG[key]
                const isSelected = selectedFood === key
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedFood(isSelected ? null : key)}
                    className={cn(
                      "px-2 py-2 rounded-lg text-xs transition-colors flex flex-col items-center gap-1",
                      isSelected
                        ? cn(config.bg, config.color, "font-medium")
                        : cn("bg-gray-100 text-gray-600", config.hoverBg)
                    )}
                  >
                    <span className="text-base">{config.icon}</span>
                    <span className="truncate">{config.shortLabel}</span>
                  </button>
                )
              })}
            </div>

            {/* Food content */}
            {selectedFood && (
              <div className="border-t border-gray-200 pt-3 max-h-[400px] overflow-y-auto">
                {renderFoodContent(selectedFood)}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
