export interface PyramidLevel {
  id: string;
  label: string;
  title: string;
  description: string;
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

Här är en allmän rekommendation för kosttillskott och produkter som kan vara fördelaktiga att använda som komplettering till ditt kostupplägg. Detta är helt frivilligt och inga måsten.

**1. Multivitamin- och mineraltillskott**

En billig försäkring för att se till att du får i dig basbehovet av vitaminer och mineraler, framförallt om du inte är så flitig med frukt och grönt i kosten i övrigt. Gällande dosering, utgå från etiketten på den produkten du väljer.

**2. D-Vitamin**

Finns det inte D-vitamin i multivitaminen? Jo. Men ofta i lägre doser än vad vi skandinavier behöver under vinterhalvåret när mängden solljus är kraftigt begränsat. På sommaren då? Jo, solljus funkar, men i studier har man sett att tillskott är effektivare än solljus för att komma till rätta med brist på just D-vitamin.

Livsmedelsverkets rekommendation är tio mikrogram (mcg) eller 400 internationella enheter (IE) per dag. Internationellt är rekommendationen högre. Den europeiska livsmedelssäkerhetsmyndigheten, EFSA, anser det säkert att ta tio gånger mer än Livsmedelsverket rekommenderar.

Vill du veta vad som är optimal dos för dig? Gör ett blodprov hos Werlabs eller liknande aktör för att se om du först och främst har en brist. Testa en dosering och följ upp med nya test.

**3. Kreatin Monohydrat**

Det här är kungen av tillskott för oss som tränar på gym. Det ger oss både bättre prestationsförmåga och ökad styrka – något som hjälper oss att bygga muskler. Det är det mest effektiva lagliga tillskottet för att få ut mer av tiden i gymmet.

Det finns dock en faktor som gör att många är skeptiska till att använda det: man binder vätska. Visst, absolut. Det stämmer. Det beror på att kreatinet drar med sig vatten in i muskelcellerna, där det lagras. Därför ska vi också skilja på vätska och vätska. Vätskan du binder upp i musklerna är absolut inte densamma som vätskan du binder upp under huden av att slänga i dig skräpmat med mycket salt.

Vätskan från kreatinet gör att dina muskler sväller i volym och med detta spänner de också ut huden vilket visuellt gör att du ser mer definierad ut. Och är inte större, mer definierade muskler precis vad vi vill ha? Jo. Exakt.

Det är fullt normalt med en viktökning motsvarande två-tre procent av din kroppsvikt första månaden. När nivåerna i musklerna är fyllda kommer vikten inte längre att påverkas.

Fem gram dagligen är en bra dos för majoriteten. Glöm också det här med uppehåll, det behövs inte. Du kan ta kreatin dag ut och dag in för resten av livet.

**4. Omega 3**

Det här är en av de essentiella fettsyror som kroppen inte själv kan tillverka utan behöver få i sig från kosten – eller via tillskott. Det är kopplat till god hjärt- och kärlhälsa och väl värt att köpa om du inte får i dig det i tillräcklig mängd från kosten.

En daglig dos mellan två till fyra gram rekommenderas för att maximera hälsoeffekterna.

**5. Proteinpulver**

Ett enkelt sätt att nå ditt proteinmål. En av de billigaste proteinkällorna per gram. Det finns tre vanligt förekommande typer:

- Vasslekoncentrat (Whey Concentrate) – Det vanligaste och billigaste. Fungerar utmärkt för de flesta. Börja här.
- Vassleisolat (Whey Isolate) – Renare, mindre laktosinnehåll. Välj om du får magbesvär av koncentrat.
- Kasein – Långsamt upptag (upp till 7 timmar). Bra före sömn eller långa perioder utan mat.

**6. Koffein**

Väldokumenterad effekt på prestanda och trötthet. Kan förbättra styrketräning och ge energi när motivationen är låg.

Dosering kan se väldigt olika ut utifrån tolerans och storlek men generella rekommendationer är:

- Mot trötthet: 1-3 mg per kg kroppsvikt
- För prestation: 4-6 mg per kg, 30-60 minuter före träning

Använd det strategiskt. Om du dricker kaffe hela dagen försvinner effekten. Håll basintaget lågt så har du något att ta till när det verkligen behövs.

Undvik efter kl 14 för att inte störa sömnen då koffein har en halveringstid på 6 timmar.`,
  },
  {
    id: 'nutrient-timing',
    label: 'Näringstiming',
    title: 'Näringstiming',
    description: `När du äter dina måltider och hur du fördelar maten över dagen. Ska du äta innan eller efter träning? Hur många måltider per dag? Sanningen är att detta spelar relativt liten roll så länge kalorier och makros stämmer. Hitta en måltidsrytm som passar din vardag och gör det enkelt att hålla din plan.

**Måltidsfrekvens**

Jag personligen tycker att en måltidsfrekvens med frukost, mindre mellanmål, lunch, mindre mellanmål, middag och kvällsmål (totalt sex måltider) passar mig – det håller blodsockret på en jämn nivå och jag blir aldrig så hungrig att jag får cravings eller tankar på att göra sämre kostval för snabb energi.

**Min rekommendation: 4–6 måltider per dag**

Det håller hungern i schack, energin jämn och gör det lättare att komma upp i protein. Men om du hellre vill äta tre måltider, eller sex, går det också utmärkt. Det viktigaste är att det passar din vardag – det ska fungera i praktiken, inte skapa stress eller krocka med livspusslet.

**Måltidsintervall**

- Ät med cirka 2–4 timmars mellanrum mellan måltider
- Ät 1–2 timmar innan träning
- Ät senast 1–2 timmar efter träning

**Individuella hänsyn**

Måltidsfrekvens och typ av måltid är väldigt individuellt – vi behöver ta hänsyn till din livssituation och vad som är hållbart för dig.

**Exempel:** En kvarg och nötter är ett nyttigt mellanmål som är enkelt att ta med sig på jobbet eller om man är på språng – jämfört med ett mellanmål som kräver tillagning eller förberedelse.

**Anpassa efter din hunger**

Håll koll på när du är hungrig och planera intaget därefter. Många har inte stor aptit på morgonen men suget tar fart på kvällen.

De personerna kan:

- Äta mindre frukost/lunch, större middag och kvällssnack
- Lägga mer kolhydrater på kvällsmåltiderna
- Ha längre tid mellan morgonmålen, kortare på kvällen

**Fördelning av makros**

**Proteinfördelning över dagen**

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

Resten av dagen spelar fett däremot en viktig roll för hormonsyntesen, mättnad och absorption av fettlösliga vitaminer.`,
  },
  {
    id: 'micronutrients',
    label: 'Mikronutrienter',
    title: 'Mikronutrienter',
    description:
      'Vitaminer, mineraler och vatten. Dessa syns inte på vågen direkt, men brister påverkar din hälsa, energi och prestation på sikt. Lösningen är enkel: ät varierat, få i dig grönsaker och frukt dagligen, och drick tillräckligt med vatten. Inget magiskt – bara grunderna.',
  },
  {
    id: 'macronutrients',
    label: 'Makronutrienter',
    title: 'Makronutrienter',
    description:
      'Protein, kolhydrater och fett – de tre makronäringsämnena. Medan kalorier styr vikten, påverkar makros vad viktförändringen består av. Tillräckligt med protein skyddar och bygger muskler. Fett behövs för hormoner och hälsa. Kolhydrater ger energi till träningen. Rätt balans gör stor skillnad för resultat och hur du mår.',
  },
  {
    id: 'energy-balance',
    label: 'Energibalans',
    title: 'Energibalans (viktigast)',
    description:
      'Kalorier in minus kalorier ut avgör om du går upp, ner eller håller vikten. Punkt. Äter du mer än du förbränner går du upp i vikt – oavsett om kalorierna kommer från kyckling eller choklad. Äter du mindre går du ner. Detta är fysikens lagar och den viktigaste faktorn för din kroppskomposition.',
  },
];

// Grund/fundament för nutritionspyramiden
export const nutritionFoundation: PyramidFoundation = {
  label: 'Beteende och Livsstil',
  title: 'Beteende och Livsstil',
  description:
    'Allt börjar här. Dina vanor, din relation till mat, hur du hanterar sociala situationer och stress – det är fundamentet. En kostplan som inte passar ditt liv kommer du inte följa. Bygg hållbara rutiner som fungerar på vardagar, helger, fester och semestrar. Det handlar inte om perfektion utan om konsekvens över tid.',
};
