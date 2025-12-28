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
    description:
      'Kosttillskott som proteinpulver, kreatin och vitaminer. De kan vara praktiska komplement, men namnet säger allt – de är tillägg, inte grunden. Inget tillskott kompenserar för dålig kost eller bristande träning. Få ordning på de andra nivåerna först. Sedan kan rätt tillskott ge några extra procent.',
  },
  {
    id: 'nutrient-timing',
    label: 'Näringstiming',
    title: 'Näringstiming',
    description:
      'När du äter dina måltider och hur du fördelar maten över dagen. Ska du äta innan eller efter träning? Hur många måltider per dag? Sanningen är att detta spelar relativt liten roll så länge kalorier och makros stämmer. Hitta en måltidsrytm som passar din vardag och gör det enkelt att hålla din plan.',
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
