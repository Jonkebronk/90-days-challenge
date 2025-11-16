import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥦 Creating Broccoli cooking tips...\n')

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
      title: 'Broccoli - Tips på hur man kokar, tillagar',
      description: 'Omfattande guide om hur man kokar och tillagar broccoli perfekt. Lär dig välja färsk broccoli, koka i mikrovågsugn, smaksätta och förvara.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://images.unsplash.com/photo-1628773822503-930a7eaecf80?w=800',
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
            instruction: 'Välj färsk broccoli eller fryst broccoli - Att välja rätt broccoli är avgörande för att få ett perfekt steget. Söker du efter färska broccolis, leta efter de som har en mörkgrön färg och känns fasta vid beröring. Stjälkarna ska vara kraftiga och bukettorna tätt packade.',
          },
          {
            stepNumber: 2,
            instruction: 'För fryst broccoli - Se till att det inte finns några istristaller inne i förpackningen, eftersom detta kan indikera att den har tinat och sedan frusits igen. Både färsk och fryst broccoli passar för att koka, men färsk broccoli ger den bästa smaken och konsistensen.',
          },
          {
            stepNumber: 3,
            instruction: 'Kokning av broccoli i mikrovågsugnen - För att koka broccoli i mikrovågsugnen är det första steget att rensa broccolini och skära den i buketter. Sedan placerar du broccolibitarna i en mikrovågssäker skål och tillsätter en liten mängd vatten.',
          },
          {
            stepNumber: 4,
            instruction: 'Täck skålen med en mikrovågssäker plastfilm för att behålla ångan och koka i mikrovågsugnen på hög effekt i cirka 4-5 minuter eller tills broccoliin blir mjuk. Var noga med att inte överkoka broccoliin, eftersom det kan göra den trögig och förlora sin färg.',
          },
          {
            stepNumber: 5,
            instruction: 'När broccoli är klar kan du smaksätta den med lite salt, peppar eller citronsaft för att ge extra smak. Kokning av broccoli i mikrovågsugnen är ett enkelt sätt att få perfekt kokt broccoli på nolltid!',
          },
          {
            stepNumber: 6,
            instruction: 'Smaksättningar för kokt broccoli - Det finns en mängd olika smaksättningar du kan använda för att göra din kokta broccoli ännu mer läcker. En enkel och hälsosam smaksättning är att beströ broccoliin med citronsaft och olivolja efter att broccoliin har kokats.',
          },
          {
            stepNumber: 7,
            instruction: 'Detta ger en frisk och syrlig smak som kompletterar broccolins naturliga smak på ett perfekt sätt. Om du föredrar en mer kryddig smaksättning kan du också prova att tillsätta lite vitlök och chiliflakes i stekpannan när du steker broccoliin.',
          },
          {
            stepNumber: 8,
            instruction: 'Detta ger en fantastisk smakkombination av hetta och arom. För dem som gillar en mer krämig smak kan du också blanda i lite parmesanost eller crème fraiche efter kokningen för att ge broccoliin en rikare och mer fyllig smak.',
          },
          {
            stepNumber: 9,
            instruction: 'Tips för förvaring och frysning av broccoli - Broccoli är en näringsrik grönsak som kan hålla sig färsk och god under en längre tid om den förvaras på rätt sätt. För att förlänga broccoliens hållbarhet är det viktigt att förvara den i kylskåpet.',
          },
          {
            stepNumber: 10,
            instruction: 'Innan du lägger broccoli i kylskåpet är det bäst att rengöra den ordentligt genom att skölja den i kallt vatten och torka av den noggrant. Sedan kan du klippa av stjälken och dela broccolin i mindre buketter om du vill.',
          },
          {
            stepNumber: 11,
            instruction: 'För att förvara broccoli längre kan du även frysa den. För att frysa broccoli, blanchera den först genom att snabbt koka den i saltat vatten i cirka 2-3 minuter och därefter kyla ner den direkt i isvatten.',
          },
          {
            stepNumber: 12,
            instruction: 'Torka av broccoliin och lägg sedan i fryspåsar eller burkar innan du placerar dem i frysen.',
          },
          {
            stepNumber: 13,
            instruction: 'Att kunna förvara och frysa broccoli på rätt sätt är inte bara bra för dess hållbarhet, utan det ger också möjlighet till enkla och bekvämla måltider. Du kan använda tinad broccoli i soppor, grytor, wokrätter eller till och med som sidorätt till olika kötträtter.',
          },
          {
            stepNumber: 14,
            instruction: 'Det är också bra att veta att färsk broccoli innehåller mer näringsämnen än fryst broccoli, så det är alltid bra att försöka använda färsk broccoli så mycket som möjligt.',
          },
          {
            stepNumber: 15,
            instruction: 'Förvara din broccoli ordentligt i kylskåpet och se till att frysa den om du inte kommer hinna använda den inom en snar framtid. På så sätt kan du njuta av den perfekta konsistensen och smaken av broccoli även efter några veckor.',
          },
        ],
      },
    },
  })

  console.log(`✅ Cooking tip created: ${recipe.title} (ID: ${recipe.id})`)
  console.log(`   - Category: Tips på tillagning`)
  console.log(`   - 15 instruction steps`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
