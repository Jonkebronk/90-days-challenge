import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const faqs = [
  // Kost & Näring
  {
    question: 'Hur många kalorier ska jag äta per dag?',
    answer: 'Ditt kaloriintag baseras på din målsättning och aktivitetsnivå. Titta på din kostplan under "Matlogg" för dina personliga rekommendationer. Som tumregel: underskott för viktminskning, överskott för muskelbyggande.',
    category: 'kost',
    forRole: 'both',
    sortOrder: 1
  },
  {
    question: 'Vad ska jag äta före träning?',
    answer: 'Ät en lätt måltid 1-2 timmar före träning med kolhydrater och protein. Exempel: havregrynsgröt med frukt, eller smörgås med ägg. Undvik tunga, feta måltider direkt innan.',
    category: 'kost',
    forRole: 'both',
    sortOrder: 2
  },
  {
    question: 'Vad ska jag äta efter träning?',
    answer: 'Inom 1-2 timmar efter träning, ät en måltid med både protein (20-40g) och kolhydrater för optimal återhämtning. Exempel: kyckling med ris, eller proteinshake med frukt.',
    category: 'kost',
    forRole: 'both',
    sortOrder: 3
  },
  {
    question: 'Hur räknar jag makros?',
    answer: 'Använd matloggen för att enkelt spåra dina makros. Scanna streckkoder eller sök på livsmedel för att logga. Appen beräknar automatiskt protein, kolhydrater och fett.',
    category: 'kost',
    forRole: 'client',
    sortOrder: 4
  },
  // Träning
  {
    question: 'Hur ofta ska jag träna?',
    answer: 'Följ ditt träningsprogram! Generellt rekommenderas 3-5 pass per vecka beroende på mål och nivå. Lika viktigt är återhämtning - kroppen bygger muskel under vila.',
    category: 'traning',
    forRole: 'both',
    sortOrder: 1
  },
  {
    question: 'Vad gör jag om jag missar ett pass?',
    answer: 'Oroa dig inte! Hoppa inte över passet - flytta det till nästa lediga dag om möjligt. Om du missar flera pass, fortsätt bara schemat från där du är. Kommunicera gärna via meddelanden om du behöver anpassa.',
    category: 'traning',
    forRole: 'client',
    sortOrder: 2
  },
  {
    question: 'Hur vet jag om jag lyfter rätt vikt?',
    answer: 'Rätt vikt = utmanande men kontrollerbar. Du ska kunna utföra alla reps med god teknik, men de sista 2-3 repsen ska kännas tuffa. Om det är för lätt, öka gradvis med 2.5-5kg.',
    category: 'traning',
    forRole: 'client',
    sortOrder: 3
  },
  // Check-in
  {
    question: 'När ska jag göra check-in?',
    answer: 'Gör din veckovisa check-in varje söndag! Väg dig på morgonen efter toalettbesök, före frukost. Ta progressbilder i samma ljus och position varje gång för bäst jämförelse.',
    category: 'check-in',
    forRole: 'client',
    sortOrder: 1
  },
  {
    question: 'Varför går inte vikten ner trots att jag följer planen?',
    answer: 'Vikten kan stagnera av flera anledningar: vattenretention, muskelökning, mens, stress eller sömn. Titta på trenden över 2-3 veckor istället för dag till dag. Mätningar och bilder visar ofta framsteg när vågen står still!',
    category: 'check-in',
    forRole: 'both',
    sortOrder: 2
  },
  // Allmänt
  {
    question: 'Hur kontaktar jag min coach?',
    answer: 'Använd meddelandefunktionen här! Jag svarar vanligtvis inom 24 timmar. För brådskande frågor, ange det i meddelandet.',
    category: 'allmant',
    forRole: 'client',
    sortOrder: 1
  },
  {
    question: 'Kan jag ändra min kostplan?',
    answer: 'Absolut! Skicka ett meddelande så anpassar vi planen efter dina behov. Berätta vad som fungerar/inte fungerar, matpreferenser eller allergier.',
    category: 'allmant',
    forRole: 'client',
    sortOrder: 2
  }
]

async function main() {
  console.log('Seeding messenger FAQs...')

  for (const faq of faqs) {
    await prisma.messengerFAQ.upsert({
      where: {
        id: `faq-${faq.category}-${faq.sortOrder}`
      },
      update: faq,
      create: {
        id: `faq-${faq.category}-${faq.sortOrder}`,
        ...faq
      }
    })
    console.log(`✓ ${faq.question.substring(0, 40)}...`)
  }

  console.log(`\n✅ Seeded ${faqs.length} FAQs successfully!`)
}

main()
  .catch((e) => {
    console.error('Error seeding FAQs:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
