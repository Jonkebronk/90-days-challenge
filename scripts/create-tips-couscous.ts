import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍚 Creating Couscous cooking tips...\n')

  // Find Tips på tillagning category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'tips-pa-tillagning' }
  })

  if (!category) {
    throw new Error('Tips på tillagning category not found')
  }

  console.log('\n📝 Creating tips...')

  // Create the recipe/tip
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Couscous - Tips på hur man kokar, tillagar',
      description: 'Omfattande guide om hur man kokar couscous perfekt. Lär dig rätt proportioner, kryddor, och tekniker för lätt och fluffig couscous.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=800',
      caloriesPerServing: 0,
      proteinPerServing: 0,
      carbsPerServing: 0,
      fatPerServing: 0,
      published: true,
      publishedAt: new Date(),

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Mät upp rätt proportioner av couscous och vatten - Starta din couscous-tillagning med att mäta upp rätt proportioner av couscous och vatten. En bra tumregel är att använda en del couscous till en och en halv del vatten. Exakt mätning garanterar att du får rätt konsistens på din couscous, vilket bidrar till att göra den lätt och fluffig.',
          },
          {
            stepNumber: 2,
            instruction: 'Felaktiga proportioner kan leda till överkokat eller klumpig couscous. Därför är det viktigt att alltid ha ett öga på förhållandet mellan couscous och vatten för att säkerställa kvalitetsresultat varje gång.',
          },
          {
            stepNumber: 3,
            instruction: 'Koka upp vattnet och tillsätt buljong eller kryddor för smak - För att få din couscous lätt och smakfull är det viktigt att koka upp vattnet ordentligt och tillsätta buljong eller kryddor för extra smak. Välj gärna en buljong som kompletterar den övriga matätten och experimentera med olika kryddor för att skapa en unik smakupplevelse.',
          },
          {
            stepNumber: 4,
            instruction: 'När vattnet har kokat upp, häll över couscousen och rör om för att fördela smaken jämnt. Genom att tillföra smak redan i kokvattnet kommer couscousen absorbera dofterna och smakerna för en mer fullständad måltid.',
          },
          {
            stepNumber: 5,
            instruction: 'Häll över couscousen och rör om - Häll den mätta mängden med kokande vatten över couscousen och rör om ordentligt för att försäkra dig om att all couscous är jämnt fuktad. Det är viktigt att vara noggrann här för att undvika klumpar och för en jämn och fluffig konsistens.',
          },
          {
            stepNumber: 6,
            instruction: 'Se till att allt vatten blandas väl med couscousen innan du låter den svalla med lock på i några minuter. När tiden gått, använd en gaffel för att fluffa upp couscousen och se till att inga klumpar finns kvar innan du serverar den.',
          },
          {
            stepNumber: 7,
            instruction: 'Låt couscousen svalla i några minuter med lock på - För att få din couscous lätt och fluffig är det viktigt att låta den svalla i några minuter med lock på. Genom att täcka över couscousen efter kokning får den möjlighet att absorbera återstående fukt och smaker, vilket leder till en silkeslen och välsmakande konsistens.',
          },
          {
            stepNumber: 8,
            instruction: 'När du öppnar locket kommer du bli överraskad av hur luftig och fluffig couscousen har blivit. Tänk bara på att vara tålmodig och inte röra om under svällningen för att undvika att bryta ner de lätta flingorna.',
          },
          {
            stepNumber: 9,
            instruction: 'Fluffa upp couscousen med en gaffel och servera - Efter att couscousen har svällt i några minuter är det dags att fluffa upp den med en gaffel och servera. Genom att försiktigt röra runt i couscousen separeras kornen och ger den en lätt och luftig konsistens.',
          },
          {
            stepNumber: 10,
            instruction: 'Låt couscousen svalla ordentligt med lock på för bästa fluffighet - När du kokar couscous är det viktigt att låta den svalla ordentligt med lock på för att uppnå den bästa fluffigheten. Genom att täcka couscousen med lock tillåter du ångan att stanna kvar i pannan, vilket hjälper till att göra kornen lätta och separerade.',
          },
          {
            stepNumber: 11,
            instruction: 'Detta ger dig en härlig och luftig textur i din couscous. Så se till att ge couscousen tillräckligt med tid att svalla och utveckla sin fulla fluffighet genom att hålla locket på under beredningen.',
          },
          {
            stepNumber: 12,
            instruction: 'Fluffa upp couscousen med en gaffel före servering för att undvika klumpar och ge den en lätt konsistens - För att få en lätt och fluffig konsistens på din couscous är det viktigt att fluffa upp den med en gaffel innan servering. Genom att försiktigt separera kornen med gaffeln kan du undvika klumpar och ge couscousen en luftig textur.',
          },
          {
            stepNumber: 13,
            instruction: 'Detta steg är avgörande för att uppnå den perfekta konsistensen på din couscous och göra den till en njutning att äta. Så nästa gång du lagar couscous, var noga med att använda en gaffel för att fluffa upp den innan du serverar den!',
          },
          {
            stepNumber: 14,
            instruction: 'Tips för att få den bästa konsistensen på couscous - För att få den bästa konsistensen på couscous, använd rätt proportioner av vatten till couscous. Tillsätt smak genom att koka couscousen i buljong eller tillsätta kryddor. Låt couscousen svalla ordentligt med lock på för bästa fluffighet.',
          },
          {
            stepNumber: 15,
            instruction: 'Fluffa upp couscousen med en gaffel före servering för att undvika klumpar och ge den en lätt konsistens.',
          },
          {
            stepNumber: 16,
            instruction: 'Använd rätt proportioner av vatten till couscous - För att få din couscous lätt och fluffig är det viktigt att använda rätt proportioner av vatten. En vanlig tumregel är att för varje kopp couscous behöver du cirka 1,5 koppar vatten. Detta ger couscousen tillräckligt med fuktighet för att svälla korrekt och bli fluffig.',
          },
          {
            stepNumber: 17,
            instruction: 'Att använda för mycket vatten kan göra couscousen klumpig och blöt, medan för lite vatten kan resultera i torr couscous. Så se till att mäta upp rätt proportioner för bästa resultat.',
          },
          {
            stepNumber: 18,
            instruction: 'Tillsätt smak genom att koka couscousen i buljong eller tillsätta kryddor - För att ge din couscous en härlig smak och doft kan du enkelt tillsätta buljong eller kryddor under kokningen. Att använda buljong istället för vanligt vatten ger en extra dimension av smak och gör din couscous mer välsmakande.',
          },
          {
            stepNumber: 19,
            instruction: 'Välj en buljong som passar din personliga smakpreferens, som grönsaks- eller kycklingbuljong. För att ge couscousen ännu mer karaktär kan du också experimentera med olika kryddor, som spiskummin, koriander eller paprika.',
          },
          {
            stepNumber: 20,
            instruction: 'Genom att koka couscousen i buljong eller tillsätta kryddor får du inte bara en lättsam och fluffig textur, utan även en djupare smakupplevelse som lyfter hela rätten till nya höjder.',
          },
        ],
      },
    },
  })

  console.log(`✅ Cooking tip created: ${recipe.title} (ID: ${recipe.id})`)
  console.log(`   - Category: Tips på tillagning`)
  console.log(`   - 20 instruction steps`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
