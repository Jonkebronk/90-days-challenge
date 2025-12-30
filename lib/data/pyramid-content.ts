export interface PyramidSubItem {
  id: string;
  label: string;
  title: string;
  description: string;
}

export interface PyramidLevel {
  id: string;
  label: string;
  title: string;
  description: string;
  subItems?: PyramidSubItem[];
}

export interface PyramidFoundation {
  label: string;
  title: string;
  description: string;
}

// Träningspyramiden - från toppen (minst påverkan) till botten (störst påverkan)
export const trainingPyramidLevels: PyramidLevel[] = [
  {
    id: 'tempo',
    label: 'Tempo',
    title: 'Tempo',
    description:
      'Hur snabbt eller långsamt du utför varje rep. Kontrollerad teknik är viktigt för säkerhet och muskelkontakt, men att räkna exakta sekunder är sällan nödvändigt. Lyft kontrollerat, sänk kontrollerat – det räcker för de allra flesta.',
  },
  {
    id: 'rest-periods',
    label: 'Viloperioder',
    title: 'Viloperioder',
    description:
      'Tiden du vilar mellan set påverkar hur återhämtad du är inför nästa set. Generellt: längre vila (2-3 min) för tunga styrkelyft, kortare vila (60-90 sek) fungerar för isolationsövningar. Men stressa inte – detta är finjustering, inte avgörande.',
  },
  {
    id: 'exercise-selection',
    label: 'Övningsval',
    title: 'Övningsval',
    description:
      'Vilka övningar du väljer har betydelse, men mindre än många tror. Prioritera övningar som tränar musklerna genom full rörelseomfång, som du kan utföra säkert och som du faktiskt känner i målmuskeln. Marklyft, knäböj och bänkpress är utmärkta – men fungerar de inte för dig finns det alltid alternativ.',
  },
  {
    id: 'progression',
    label: 'Progression',
    title: 'Progression',
    description:
      'Kroppen anpassar sig. För att fortsätta utvecklas måste du gradvis öka belastningen över tid – lite tyngre vikt, ett extra rep, eller ett set till. Utan progression stannar resultaten. Det behöver inte vara varje pass, men över veckor och månader ska kurvan peka uppåt.',
  },
  {
    id: 'volume-intensity',
    label: 'Volym & Intensitet',
    title: 'Volym & Intensitet',
    description:
      'Detta är träningens byggstenar. Volym handlar om hur mycket du tränar (antal set och övningar), intensitet om hur tungt du lyfter eller hur nära utmattning du går. Hit räknas även frekvens – hur ofta du tränar varje muskelgrupp. Dessa tre hänger ihop: tränar du tungt behöver du längre vila, tränar du ofta kan du behöva sänka volymen per pass. Hitta balansen som fungerar för dig.',
  },
  {
    id: 'adherence',
    label: 'Följsamhet',
    title: 'Följsamhet (viktigast)',
    description:
      'Det spelar ingen roll hur perfekt ditt träningsprogram är om du inte kan följa det. Välj en träningsform och ett schema som passar din livsstil, som du faktiskt tycker om och kan hålla i längden. Ett "okej" program som du följer konsekvent slår alltid ett "perfekt" program som du hoppar av efter tre veckor. Fokusera på att njuta av processen – det är nyckeln till långsiktiga resultat.',
  },
];

// Nutritionspyramiden - från toppen (minst påverkan) till botten (störst påverkan)
export const nutritionPyramidLevels: PyramidLevel[] = [
  {
    id: 'supplements',
    label: 'Tillskott',
    title: 'Tillskott',
    description: `Kosttillskott som proteinpulver, kreatin och vitaminer. De kan vara praktiska komplement, men namnet säger allt – de är tillägg, inte grunden. Fokusera på de viktigare nivåerna först – när du har kalorier, makros och måltidsrytm på plats kan tillskott ge en liten extra skjuts. Men de kommer aldrig att kompensera för brister i grunden.

Här är en allmän rekommendation för kosttillskott och produkter som kan vara fördelaktiga att använda som komplettering till ditt kostupplägg. Detta är helt frivilligt och inga måsten.`,
    subItems: [
      {
        id: 'multivitamin',
        label: 'Multivitamin',
        title: 'Multivitamin- och mineraltillskott',
        description: `En billig försäkring för att se till att du får i dig basbehovet av vitaminer och mineraler, framförallt om du inte är så flitig med frukt och grönt i kosten i övrigt.

**Dosering**

Utgå från etiketten på den produkten du väljer.`,
      },
      {
        id: 'd-vitamin',
        label: 'D-Vitamin',
        title: 'D-Vitamin',
        description: `Finns det inte D-vitamin i multivitaminen? Jo. Men ofta i lägre doser än vad vi skandinavier behöver under vinterhalvåret när mängden solljus är kraftigt begränsat. På sommaren då? Jo, solljus funkar, men i studier har man sett att tillskott är effektivare än solljus för att komma till rätta med brist på just D-vitamin.

**Rekommendation**

Livsmedelsverkets rekommendation är tio mikrogram (mcg) eller 400 internationella enheter (IE) per dag. Internationellt är rekommendationen högre. Den europeiska livsmedelssäkerhetsmyndigheten, EFSA, anser det säkert att ta tio gånger mer än Livsmedelsverket rekommenderar.

**Optimal dos för dig?**

Vill du veta vad som är optimal dos för dig? Gör ett blodprov hos Werlabs eller liknande aktör för att se om du först och främst har en brist. Testa en dosering och följ upp med nya test.`,
      },
      {
        id: 'creatine',
        label: 'Kreatin',
        title: 'Kreatin Monohydrat',
        description: `Det här är kungen av tillskott för oss som tränar på gym. Det ger oss både bättre prestationsförmåga och ökad styrka – något som hjälper oss att bygga muskler. Det är det mest effektiva lagliga tillskottet för att få ut mer av tiden i gymmet.

**Vätskeretention**

Det finns dock en faktor som gör att många är skeptiska till att använda det: man binder vätska. Visst, absolut. Det stämmer. Det beror på att kreatinet drar med sig vatten in i muskelcellerna, där det lagras. Därför ska vi också skilja på vätska och vätska. Vätskan du binder upp i musklerna är absolut inte densamma som vätskan du binder upp under huden av att slänga i dig skräpmat med mycket salt.

Vätskan från kreatinet gör att dina muskler sväller i volym och med detta spänner de också ut huden vilket visuellt gör att du ser mer definierad ut. Och är inte större, mer definierade muskler precis vad vi vill ha? Jo. Exakt.

**Viktökning**

Det är fullt normalt med en viktökning motsvarande två-tre procent av din kroppsvikt första månaden. När nivåerna i musklerna är fyllda kommer vikten inte längre att påverkas.

**Dosering**

Fem gram dagligen är en bra dos för majoriteten. Glöm också det här med uppehåll, det behövs inte. Du kan ta kreatin dag ut och dag in för resten av livet.`,
      },
      {
        id: 'omega3',
        label: 'Omega 3',
        title: 'Omega 3',
        description: `Det här är en av de essentiella fettsyror som kroppen inte själv kan tillverka utan behöver få i sig från kosten – eller via tillskott. Det är kopplat till god hjärt- och kärlhälsa och väl värt att köpa om du inte får i dig det i tillräcklig mängd från kosten.

**Dosering**

En daglig dos mellan två till fyra gram rekommenderas för att maximera hälsoeffekterna.`,
      },
      {
        id: 'protein-powder',
        label: 'Proteinpulver',
        title: 'Proteinpulver',
        description: `Ett enkelt sätt att nå ditt proteinmål. En av de billigaste proteinkällorna per gram.

**Typer av proteinpulver**

- **Vasslekoncentrat (Whey Concentrate)** – Det vanligaste och billigaste. Fungerar utmärkt för de flesta. Börja här.
- **Vassleisolat (Whey Isolate)** – Renare, mindre laktosinnehåll. Välj om du får magbesvär av koncentrat.
- **Kasein** – Långsamt upptag (upp till 7 timmar). Bra före sömn eller långa perioder utan mat.`,
      },
      {
        id: 'caffeine',
        label: 'Koffein',
        title: 'Koffein',
        description: `Väldokumenterad effekt på prestanda och trötthet. Kan förbättra styrketräning och ge energi när motivationen är låg.

**Dosering**

Dosering kan se väldigt olika ut utifrån tolerans och storlek men generella rekommendationer är:

- **Mot trötthet:** 1-3 mg per kg kroppsvikt
- **För prestation:** 4-6 mg per kg, 30-60 minuter före träning

**Strategisk användning**

Använd det strategiskt. Om du dricker kaffe hela dagen försvinner effekten. Håll basintaget lågt så har du något att ta till när det verkligen behövs.

Undvik efter kl 14 för att inte störa sömnen då koffein har en halveringstid på 6 timmar.`,
      },
    ],
  },
  {
    id: 'nutrient-timing',
    label: 'Näringstiming',
    title: 'Näringstiming',
    description: `När du äter dina måltider och hur du fördelar maten över dagen. Ska du äta innan eller efter träning? Hur många måltider per dag? Sanningen är att detta spelar relativt liten roll så länge kalorier och makros stämmer. Hitta en måltidsrytm som passar din vardag och gör det enkelt att hålla din plan.`,
    subItems: [
      {
        id: 'meal-frequency',
        label: 'Måltidsfrekvens',
        title: 'Måltidsfrekvens',
        description: `Jag personligen tycker att en måltidsfrekvens med frukost, mindre mellanmål, lunch, mindre mellanmål, middag och kvällsmål (totalt sex måltider) passar mig – det håller blodsockret på en jämn nivå och jag blir aldrig så hungrig att jag får cravings eller tankar på att göra sämre kostval för snabb energi.

**Min rekommendation: 4–6 måltider per dag**

Det håller hungern i schack, energin jämn och gör det lättare att komma upp i protein. Men om du hellre vill äta tre måltider, eller sex, går det också utmärkt. Det viktigaste är att det passar din vardag – det ska fungera i praktiken, inte skapa stress eller krocka med livspusslet.

**Måltidsintervall**

- Ät med cirka 2–4 timmars mellanrum mellan måltider
- Ät 1–2 timmar innan träning
- Ät senast 1–2 timmar efter träning`,
      },
      {
        id: 'individual-adaptation',
        label: 'Anpassa efter dig',
        title: 'Anpassa efter dig',
        description: `Måltidsfrekvens och typ av måltid är väldigt individuellt – vi behöver ta hänsyn till din livssituation och vad som är hållbart för dig.

**Anpassa efter din hunger**

Håll koll på när du är hungrig och planera intaget därefter. Många har inte stor aptit på morgonen men suget tar fart på kvällen.

De personerna kan:

- Äta mindre frukost/lunch, större middag och kvällssnack
- Lägga mer kolhydrater på kvällsmåltiderna
- Ha längre tid mellan morgonmålen, kortare på kvällen`,
      },
      {
        id: 'macro-distribution',
        label: 'Makrofördelning',
        title: 'Makrofördelning',
        description: `**Proteinfördelning över dagen**

Ungefär 0,4–0,55 g protein per kg kroppsvikt per måltid.

**Kolhydrater koncentrerade kring träning**

Kolhydrater höjer insulin och främjar glukosupptag i musklerna och stödjer återhämtning.

- **Före träning:** Kolhydrater fyller på glykogenförråden och ger bränsle för träningen.
- **Efter träning:** Musklerna är extra känsliga för insulin och glukosupptag, vilket gör att kolhydrater effektivt återställer glykogenet och stödjer återhämtningen.

Genom att koncentrera majoriteten av kolhydraterna hit maximerar du deras prestations- och återhämtningsnytta.

**Lågt fettintag kring träning**

Fett och kostfiber bör hållas lågt för att minimera risken för magbesvär under aktiviteten. Fett fördröjer magsäckstömningen och därmed upptaget av både protein och kolhydrater.

- **Före träning:** Du vill ha snabbt tillgänglig energi, inte en långsam matsmältning som kan ge obehag.
- **Efter träning:** Snabb leverans av aminosyror och glukos till musklerna prioriteras – och då är fett i vägen.

Resten av dagen spelar fett däremot en viktig roll för hormonsyntesen, mättnad och absorption av fettlösliga vitaminer.

**Varför kolhydratfria mellanmål?**

Ifall du har mellanmål på måltidsschemat så är det smart att försöka hålla mellanmålen fria från kolhydrater under en viktminskningsfas:

**Stabil energi och mättnad**

Protein och fett ger en jämn blodsockerkurva utan de insulintoppar som kolhydrater skapar. Det håller dig mätt längre och undviker energidippar mellan huvudmålen.

**Koncentrerad kolhydrateffekt**

När du samlar alla kolhydrater till måltiderna närmast träningen maximerar du deras nytta: fulla glykogendepåer inför passet och snabb återfyllnad/starta återhämtningen efteråt.

**Praktiskt upplägg för mellanmål**

En kvarg eller whey proteinpulver och nötter är ett nyttigt mellanmål som är enkelt att ta med sig på jobbet eller om man är på språng – jämfört med ett mellanmål som kräver tillagning eller förberedelse.`,
      },
    ],
  },
  {
    id: 'micronutrients',
    label: 'Mikronutrienter',
    title: 'Mikronutrienter',
    description: `Vitaminer, mineraler och vatten. Dessa syns inte på vågen direkt, men brister påverkar din hälsa, energi och prestation på sikt. Lösningen är enkel: ät varierat, få i dig grönsaker och frukt dagligen, och drick tillräckligt med vatten. Inget magiskt – bara grunderna.`,
    subItems: [
      {
        id: 'vitamins',
        label: 'Vitaminer',
        title: 'Vitaminer',
        description: `**Fettlösliga vitaminer** (lagras i kroppen):

| Vitamin | Funktion | Naturliga källor |
|---------|----------|------------------|
| A-vitamin | Syn, hud, immunförsvar | Lever, ägg, morötter, gröna bladgrönsaker |
| D-vitamin | Skelett, tänder, immunförsvar | Fet fisk, ägg, solljus |
| E-vitamin | Antioxidant, skyddar celler | Nötter, frön, vegetabiliska oljor |
| K-vitamin | Blodkoagulering, benhälsa | Gröna bladgrönsaker, lever, äggula |

**Vattenlösliga vitaminer** (måste intas regelbundet):

| Vitamin | Funktion | Naturliga källor |
|---------|----------|------------------|
| C-vitamin | Immunförsvar, järnupptag, antioxidant | Citrusfrukter, bär, paprika, broccoli |
| B1 (Tiamin) | Energiomsättning | Fläskkött, fullkorn, solrosfrön |
| B2 (Riboflavin) | Nedbrytning av fett, kolhydrater, protein | Kött, ägg, mejeriprodukter, fullkorn |
| B6 | Proteinomsättning, nervfunktion | Kött, fisk, potatis, bananer |
| B12 | Blodbildning, nervsystem | Kött, fisk, ägg, mejeriprodukter |
| Folsyra (B9) | Celldelning, blodbildning | Gröna bladgrönsaker, baljväxter, lever |`,
      },
      {
        id: 'minerals',
        label: 'Mineraler',
        title: 'Mineraler',
        description: `| Mineral | Funktion | Naturliga källor |
|---------|----------|------------------|
| Järn | Syretransport i blodet | Kött, lever, baljväxter, gröna bladgrönsaker |
| Kalcium | Skelett, tänder, muskelfunktion | Mejeriprodukter, grönkål, mandel |
| Magnesium | Muskel- och nervfunktion, energi | Nötter, frön, fullkorn, mörk choklad |
| Zink | Immunförsvar, sårläkning | Kött, skaldjur, nötter, ost |
| Kalium | Blodtryck, muskelfunktion | Banan, potatis, avokado, spenat |
| Selen | Antioxidant, sköldkörtelfunktion | Fisk, nötter (särskilt paranötter), ägg |
| Jod | Sköldkörtelfunktion | Fisk, skaldjur, mejeriprodukter, jodiserat salt |`,
      },
      {
        id: 'practical-guidelines',
        label: 'Praktiska riktlinjer',
        title: 'Praktiska riktlinjer',
        description: `**Fiber:** Sikta på 25-35g per dag för mättnad och tarmhälsa.

**Vatten:** Cirka 30-40 ml per kg kroppsvikt som bas, mer vid träning.

**Ha koll på:** D-vitamin (särskilt på vintern i Sverige), järn (vid menstruation), magnesium och omega-3 vid lågt fiskintag.

**Tips:** "Ät regnbågen" – ju fler färger på tallriken, desto bredare spektrum av mikronäringsämnen.`,
      },
    ],
  },
  {
    id: 'macronutrients',
    label: 'Makronutrienter',
    title: 'Makronutrienter',
    description:
      'Protein, kolhydrater och fett – de tre makronäringsämnena. Medan kalorier styr vikten, påverkar makros vad viktförändringen består av. Tillräckligt med protein skyddar och bygger muskler. Fett behövs för hormoner och hälsa. Kolhydrater ger energi till träningen. Rätt balans gör stor skillnad för resultat och hur du mår.',
    subItems: [
      {
        id: 'protein',
        label: 'Protein',
        title: 'Protein',
        description: `Protein är den viktigaste makronutrienten för dig som vill bygga eller behålla muskler. Det är bokstavligen dina byggstenar.

**Varför protein är så viktigt**

Cellerna i din kropp bryts ner och byggs upp konstant. För att de ska kunna repareras och byggas upp krävs protein.

Protein består av aminosyror, varav nio är essentiella – kroppen kan inte tillverka dem själv utan måste få dem via maten. Till skillnad från kolhydrater och fett har kroppen ingen lagringskapacitet för aminosyror. Det gör dagligt intag avgörande.

**Fördelarna med högproteinintag**

- **Bevarar muskelmassa vid viktnedgång** – Tillräckligt protein skyddar dina muskler från att brytas ner i ett kaloriunderskott
- **Ökar mättnaden** – Du känner dig nöjd längre och risken för överätande minskar
- **Minskar cravings** – Stabilt proteinintag håller blodsockret jämnare
- **Högre kaloriförbränning** – Protein har tre gånger högre termisk effekt än kolhydrater eller fett. Du förbränner 20–30% av proteinets kalorier bara genom att smälta det
- **Bygger muskler** – Utan tillräckligt protein kan kroppen inte bygga ny muskelvävnad

**Hur mycket protein behöver du?**

Rekommendation: 1.6–2,5 gram per kilo kroppsvikt

**Proteinkvalitet**

- Animaliskt protein (kyckling, fisk, ägg, mejeriprodukter) har högre biologiskt värde – det tas upp och används mer effektivt

**Perspektiv**

Protein är inte förhandlingsbart. Får du i dig tillräckligt protein har du löst halva pusslet för en framgångsrik kroppsförändring.`,
      },
      {
        id: 'carbohydrates',
        label: 'Kolhydrater',
        title: 'Kolhydrater',
        description: `Kolhydrater har fått oförtjänt dåligt rykte. Sanningen? De är varken onda eller magiska. De är ett verktyg och rätt använt ger de dig energi, bättre träning och god hälsa.

**Vad är kolhydrater?**

Kolhydrater är ett samlingsnamn för stärkelse, sockerarter och kostfibrer. Hit hör pasta, potatis, ris, bröd, frukt och grönsaker.

När du äter kolhydrater bryts de ner till glukos som används som energi direkt eller lagras som glykogen i musklerna. Glykogen är musklernas bränsle vid träning.

**Varför kolhydrater är viktiga**

- **Träningsprestanda** – Styrketräning kräver glykogen som bränsle
- **Återhämtning** – Kolhydrater efter träning fyller på glykogenlagren
- **Tarmhälsa** – Fibrer matar dina goda tarmbakterier
- **Välmående** – Kolhydrater är goda. Att helt utesluta dem gör kosten svår att hålla

**Fiber**

Fiber är en kolhydrat som kroppen inte kan bryta ner, men som är viktig för mättnad, tarmhälsa och blodsockerreglering.

Rekommendation: 25–35g per dag

Bra fiberkällor: Havregryn, baljväxter, fullkornsprodukter, grönsaker, frukt, nötter och frön.

**Glykemiskt index (GI)**

GI mäter hur snabbt en kolhydrat höjer blodsockret. Men GI övervärderas ofta.

I verkligheten äter vi sällan kolhydrater isolerat. När du kombinerar kolhydrater med protein, fett och fiber sänks GI automatiskt. Fokusera på blandade måltider i stället för att jaga lågt GI.

**Perspektiv**

Kolhydrater är inte fienden. Ät de mängder som passar din plan och sluta stressa över timing och typer.`,
      },
      {
        id: 'fat',
        label: 'Fett',
        title: 'Fett',
        description: `Fett har länge varit kostens syndabock. Idag vet vi bättre. Fett är inte bara ofarligt i rimliga mängder, det är nödvändigt för din hälsa, dina hormoner och dina resultat.

**Varför du behöver fett**

- **Hormonproduktion** – Fett är råmaterialet för könshormoner som testosteron och östrogen
- **Vitaminupptag** – Vitamin A, D, E och K är fettlösliga. Utan fett kan kroppen inte ta upp dem
- **Hjärnfunktion** – Din hjärna består till ~60% av fett. Omega-3 är särskilt viktigt
- **Mättnad** – Fett smakar gott och håller dig nöjd längre

**Typer av fett**

| Typ | Källor | Kommentar |
|-----|--------|-----------|
| Omättat (enkel- & fleromättat) | Olivolja, avokado, nötter, fet fisk | Bör utgöra majoriteten |
| Omega-3 | Lax, makrill, chiafrön, valnötter | De flesta får för lite – prioritera |
| Mättat | Kött, smör, ost, grädde | I måttliga mängder – okej för friska |
| Transfett | Processad mat, friterad mat | Undvik helt |

**Varning**

En handfull nötter (~30g) innehåller cirka 180 kcal. Nötsmör är ännu lättare att överäta. Mät upp om du är i ett kaloriunderskott.`,
      },
    ],
  },
  {
    id: 'energy-balance',
    label: 'Energibalans',
    title: 'Energibalans (viktigast)',
    description:
      'Kalorier in minus kalorier ut avgör om du går upp, ner eller håller vikten. Punkt. Äter du mer än du förbränner går du upp i vikt – oavsett om kalorierna kommer från kyckling eller choklad. Äter du mindre går du ner. Detta är fysikens lagar och den viktigaste faktorn för din kroppskomposition.',
    subItems: [
      {
        id: 'energy-balance-basics',
        label: 'Energibalans',
        title: 'Energibalans',
        description: `Du kanske minns från skolan: energi kan inte förstöras, den kan bara ändra form. Det gäller även din kropp. All mat du äter är energi – och den energin måste ta vägen någonstans.

**Vad är kalorier?**

Kalorier är ett mått på energi, precis som meter mäter längd eller kilo mäter vikt. När vi pratar om mat använder vi kalorier (kcal) för att beskriva hur mycket energi maten ger dig.

Det viktiga är att förstå: kalorier är ett mått på energi, inte en fysisk substans. Det som existerar fysiskt är makronäringsämnen – protein, kolhydrater och fett – och de innehåller olika mängder energi per gram.

**Energibalansens lag**

Din kropp följer samma fysiska lagar som allt annat i universum:

- **Äter du mer energi än du förbränner** → överskottet lagras som kroppsfett
- **Äter du mindre energi än du förbränner** → kroppen tar från fettreserverna
- **Äter du lika mycket som du förbränner** → vikten står still

Det finns inga genvägar. Inga dieter, tillskott eller träningsformer kan ändra denna grundlag. De kan bara påverka hur lätt eller svårt det är att följa den.

**Vad är TDEE?**

TDEE (Total Daily Energy Expenditure) är den totala mängd energi du förbränner varje dag. Det är unikt för dig och beror på:

- Din kroppsstorlek och sammansättning
- Din ålder och kön
- Din aktivitetsnivå
- Din ämnesomsättning

Du kan inte kopiera någon annans kaloriintag och förvänta dig samma resultat. Dina behov är unika – och det här programmet hjälper dig räkna ut dem.

**Kaloriunderskott – nyckeln till fettförlust**

För att förlora fett behöver du skapa ett kaloriunderskott. Det betyder helt enkelt att du äter mindre än du förbränner.

När du gör det tvingas kroppen hämta energi från lagrad energi – ditt kroppsfett. Det är precis så fettförlust fungerar. Inget mer, inget mindre.

Du kan skapa underskott på två sätt:

- Äta mindre
- Röra dig mer

I praktiken fungerar en kombination bäst. Men kom ihåg: det är mycket lättare att låta bli att äta 300 kalorier än att förbränna dem genom träning.

**Metoder vs principer**

Här kommer en avgörande insikt: alla dieter som fungerar gör samma sak – de skapar ett kaloriunderskott. De använder bara olika metoder.

- **Fasta (16:8)** – Begränsar tiden du äter, vilket gör att de flesta äter mindre totalt.
- **LCHF/Keto** – Tar bort kolhydrater, vilket ofta halverar kaloriintaget automatiskt.
- **Paleo** – Undviker processad mat, vilket leder till färre kalorier och mer mättnad.
- **Lågfettkost** – Tar bort fett (9 kcal/g), vilket sänker kalorierna drastiskt.

Ingen av dessa metoder är magisk. De är olika vägar till samma destination: ett kaloriunderskott.

Välj den metod som passar din livsstil och gör det enkelt för dig att hålla underskottet. Det finns inget "bäst" – det finns bara det som fungerar för dig.

**Perspektiv**

Att förstå energibalans befriar dig från diettrender och marknadsföring. Du behöver aldrig mer undra om du "borde" köra keto, fasta eller något annat.

Frågan är alltid densamma: Hjälper den här metoden mig att hålla ett kaloriunderskott på ett hållbart sätt?

Om ja – kör. Om nej – prova något annat.

Principen förändras aldrig. Bara metoderna.`,
      },
      {
        id: 'metabolism',
        label: 'Din ämnesomsättning',
        title: 'Din ämnesomsättning',
        description: `Ämnesomsättningen är mängden energi din kropp förbränner varje dag. Den är helt individuell – och att förstå den är nyckeln till att sluta gissa och börja få resultat.

**Varför din ämnesomsättning är unik**

Det spelar ingen roll hur många kalorier din kompis eller granne äter. Du måste förhålla dig till din egen kropp och din egen ämnesomsättning.

Den påverkas av flera faktorer:

- **Kroppssammansättning** – Mer muskelmassa = högre ämnesomsättning
- **Ålder** – Ämnesomsättningen sjunker ofta med åldern
- **Kön** – Män har generellt högre ämnesomsättning än kvinnor
- **Hormonnivåer** – Påverkar hur kroppen hanterar energi
- **Fysisk aktivitet** – Både träning och vardagsrörelse spelar roll
- **Kost** – Typ av mat påverkar, protein kräver mer energi att bryta ner
- **Sömn** – Dålig sömn kan sänka ämnesomsättningen
- **Stress** – Höga stressnivåer kan påverka fettlagring

**Ämnesomsättningens fyra delar**

Din totala dagliga energiförbrukning (TDEE) består av fyra komponenter:

**1. Basalmetabolism (BMR) – ca 60%**

Den energi kroppen behöver för att överleva: andning, hjärtslag, organfunktion. Även om du låg stilla i sängen hela dagen skulle du förbränna dessa kalorier.

BMR är kopplad till din kroppsmassa, längd, ålder och kön – väger du mer och är längre krävs mer energi för att hålla kroppen igång.

**2. NEAT (vardagsrörelse) – ca 15–30%**

Non-Exercise Activity Thermogenesis. All rörelse utanför planerad träning: gå till kylskåpet, pilla med pennan, ta trapporna, stå upp, gestikulera när du pratar.

NEAT är den mest anpassningsbara delen av din ämnesomsättning – och ofta den mest underskattade. När kroppen känner att energin inte räcker börjar den automatiskt spara: du blinkar mindre, rör dig långsammare, väljer hissen utan att tänka på det.

Det är därför vi spårar steg: för att motverka denna nedreglering.

**3. Träningsaktivitet (EAT) – ca 5–10%**

Den energi du förbränner under planerade träningspass. Överraskande nog är detta en mindre del än de flesta tror – ännu en anledning att inte förlita sig enbart på träning för fettförlust.

**4. Termisk effekt av mat (TEF) – ca 10%**

Energin som krävs för att smälta och tillgodogöra sig maten du äter. Olika makros kräver olika mycket energi:

- **Protein:** 20–30% av kalorierna går åt till nedbrytning
- **Kolhydrater:** 5–10%
- **Fett:** 0–3%

Det är en av anledningarna till att proteinrik kost är överlägsen för fettförlust – du förbränner mer bara av att smälta maten.

**Räkna ut din ämnesomsättning**

Vi använder Mifflin-St Jeor-formeln, som anses vara den mest precisa för de flesta. Den tar hänsyn till din vikt, längd, ålder och kön.

**Steg 1: Räkna ut din basalmetabolism (BMR)**

- **Män:** (10 × vikt i kg) + (6,25 × längd i cm) − (5 × ålder) + 5
- **Kvinnor:** (10 × vikt i kg) + (6,25 × längd i cm) − (5 × ålder) − 161

*Exempel – Man, 80 kg, 180 cm, 35 år:*
(10 × 80) + (6,25 × 180) − (5 × 35) + 5 = 800 + 1125 − 175 + 5 = **1 755 kcal**

*Exempel – Kvinna, 65 kg, 165 cm, 30 år:*
(10 × 65) + (6,25 × 165) − (5 × 30) − 161 = 650 + 1031 − 150 − 161 = **1 370 kcal**

**Steg 2: Multiplicera med din aktivitetsfaktor**

| Faktor | Nivå | Vad det betyder |
|--------|------|-----------------|
| × 1,2 | Stillasittande | Kontorsjobb, ingen träning, <5 000 steg/dag |
| × 1,375 | Lätt aktiv | Stillasittande jobb, träning 1–2 ggr/vecka, 5 000–7 500 steg/dag |
| × 1,55 | Måttligt aktiv | Träning 3–4 ggr/vecka, 7 500–10 000 steg/dag |
| × 1,725 | Mycket aktiv | Träning 5–6 ggr/vecka, fysiskt jobb, 10 000–12 500 steg/dag |
| × 1,9 | Extremt aktiv | Hård träning dagligen + fysiskt jobb, >12 500 steg/dag |

*Samma man (1 755 BMR) med olika aktivitetsnivåer:*

| Nivå | Beräkning | TDEE |
|------|-----------|------|
| Stillasittande | 1 755 × 1,2 | 2 106 kcal/dag |
| Lätt aktiv | 1 755 × 1,375 | 2 413 kcal/dag |
| Måttligt aktiv | 1 755 × 1,55 | 2 720 kcal/dag |
| Mycket aktiv | 1 755 × 1,725 | 3 027 kcal/dag |

**Varning:** Detta är ditt ungefärliga underhållsbehov – det du behöver för att hålla vikten stabil.

För fettförlust skapar vi ett underskott på 500–700 kalorier per dag, vilket ger cirka 0,5–0,7 kg fettförlust per vecka.

*Exempel (mannen ovan, måttligt aktiv):*
- Underhåll: 2 720 kcal
- För ~500g fettförlust/vecka: 2 720 − 550 = **2 170 kcal/dag**
- För ~700g fettförlust/vecka: 2 720 − 770 = **1 950 kcal/dag**

**En utgångspunkt, inte en sanning**

Formeln ger dig en startpunkt. Verkligheten kan se annorlunda ut.

Efter 2–3 veckor utvärderar vi:

- Går vikten ner i rätt takt? → Fortsätt
- Går vikten ner för snabbt? → Öka kalorierna något
- Står vikten still? → Minska kalorierna eller öka aktiviteten

Din ämnesomsättning är inte statisk. Den anpassar sig efter vad du gör. Därför justerar vi längs vägen istället för att fastna i en siffra.

**Perspektiv**

Att förstå din ämnesomsättning ger dig kontroll. Du slutar gissa, slutar jämföra dig med andra och börjar arbeta med din egen kropp.

Du kommer få dina personliga siffror i det här programmet. Jag gör beräkningarna åt dig – du behöver bara följa planen.`,
      },
      {
        id: 'body-fat',
        label: 'Kroppsfett',
        title: 'Kroppsfett',
        description: `Om du läser det här är det troligen för att du vill förändra din kroppssammansättning. Och det är helt okej – du är här av en anledning. Låt mig förklara vad kroppsfett egentligen är och hur du gör dig av med det.

**Vad är kroppsfett?**

Kroppsfett är lagrad energi. Inget mer, inget mindre.

När kroppen får mer energi genom mat och dryck än den använder just då, sparar den överskottet som fett. Det är kroppens naturliga sätt att överleva – en reservtank för sämre tider.

Tänk på det så här: kroppsfett är energi som din kropp har tagit hand om och sparat. Det är inte ett tecken på misslyckande. Det är helt enkelt hur kroppen fungerar när energibalansen över tid har lutat åt ena hållet.

När du förstår mekanismen blir förändring både enklare och mer hållbar.

**Hur blir du av med det?**

Nu när du vet hur fett lagras är det enkelt att förstå hur du blir av med det:

Du behöver använda mer energi än du tillför.

Det kallas för ett kaloriunderskott. När du skapar det tvingas kroppen ta energi från reserverna – ditt lagrade fett.

När kroppen förbränner fett bryts det ner till fettsyror och glycerol som används som energi. Fettet lämnar kroppen genom koldioxid när du andas ut och genom vatten via svett och urin.

Det är precis så enkelt som det låter.

**Myten om att omvandla fett till muskler**

Många tror att man kan "omvandla" fett till muskler. Tyvärr fungerar det inte så.

Fett är lagrad energi. Muskler byggs av protein. Det är två helt olika processer.

Du kan förlora fett och bygga muskler – men det är inte samma sak som att omvandla det ena till det andra. Det är som att säga att du omvandlar pengar till kunskap när du köper en bok. Du gör två separata saker.

**Kan du göra båda samtidigt?**

Ja, men det går mycket långsammare än att göra det i olika faser.

Även under perfekta förhållanden kan tränade personer max bygga 2–3 kg muskler per år. Nybörjare kan bygga mer initialt, men takten avtar snabbt. Jämför det med 0,5 kg fettförlust per vecka – du ser skillnaden?

Mitt råd: Om du har fett att tappa, fokusera på det först. Du kommer se resultat varje vecka och hålla motivationen uppe. När du är nöjd med din fettprocent kan du sedan fokusera på muskelbygge.

**De tre nycklarna för att tappa fett, inte muskler**

När du går ner i vikt vill du förstås tappa fett – inte muskler. Här är vad som krävs:

**1. Ät tillräckligt med protein**
Muskler behöver byggstenar för att bevaras. Sikta på 1,6–2,5 gram protein per kilo kroppsvikt.

**2. Träna tungt**
Styrketräning signalerar till kroppen att musklerna behövs. Utan den signalen har kroppen ingen anledning att behålla dem.

**3. Håll ett rimligt underskott**
Ju större underskott, desto större risk för muskelförlust. 500–700 kalorier under ditt underhåll är en bra balans mellan resultat och bevarande.

**Bonus: Varför styrketräning är överlägset**

Styrketräning är faktiskt effektivare per tidsenhet än promenader för fettförbränning. Det beror på efterförbränning (EPOC) – du fortsätter bränna kalorier i 24–48 timmar efter passet.

Plus att mer muskelmassa ger högre förbränning dygnet runt. Det är en investering som betalar sig.

**Perspektiv**

Kroppsfett är inte fienden. Det är bara energi på fel ställe vid fel tidpunkt.

Du har full kontroll över processen: skapa ett underskott, skydda musklerna med protein och träning, var tålmodig. Fettet kommer försvinna – det har inget val.

Det handlar inte om att straffa kroppen. Det handlar om att förstå hur den fungerar och arbeta med den, inte mot den.`,
      },
    ],
  },
];

// Grund/fundament för nutritionspyramiden
export const nutritionFoundation: PyramidFoundation = {
  label: 'Beteende och Livsstil',
  title: 'Beteende och Livsstil',
  description:
    'Allt börjar här. Dina vanor, din relation till mat, hur du hanterar sociala situationer och stress – det är fundamentet. En kostplan som inte passar ditt liv kommer du inte följa. Bygg hållbara rutiner som fungerar på vardagar, helger, fester och semestrar. Det handlar inte om perfektion utan om konsekvens över tid.',
};
