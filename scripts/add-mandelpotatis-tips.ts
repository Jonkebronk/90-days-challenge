import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Mandelpotatis...')

  try {
    // 1. Hitta Tips-kategorin
    const tipsCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'tips' }
    })

    if (!tipsCategory) {
      throw new Error('Tips-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', tipsCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Mandelpotatis',
        description: 'Omfattande guide för att lyckas med kokning av mandelpotatis. Lär dig välja rätt storlek, hantera försiktigt, koka i saltat vatten och kontrollera innertemperatur för perfekt konsistens.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/DZMj2h6J/2025-11-21-00-56-41-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 20,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Mandelpotatis av jämnstorlek', amount: '500', unit: 'gram (g)', grams: 500 },
      { name: 'Salt', amount: '1', unit: 'tesked (tsk)', grams: 5 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0].trim().split(' ')[0], mode: 'insensitive' } }
      })

      if (!foodItem) {
        // Skapa en enkel foodItem om den inte finns
        foodItem = await prisma.foodItem.create({
          data: {
            name: ing.name,
            calories: 0, // Placeholder
            proteinG: 0,
            fatG: 0,
            carbsG: 0,
          }
        })
        console.log(`  → Skapade foodItem: ${foodItem.name}`)
      }

      await prisma.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          foodItemId: foodItem.id,
          amount: ing.grams,
          displayAmount: ing.amount,
          displayUnit: ing.unit,
        }
      })
    }

    console.log('✓ Lagt till', ingredients.length, 'ingredienser')

    // 4. Lägg till instruktioner
    const instructions = [
      'Tips och tricks för att lyckas med kokning av mandelpotatis: Välj rätt storlek på potatisen för jämn kokning. Hantera potatisen försiktigt för att undvika skador eller bruna fläckar. Koka i saltat och sjudande vatten för optimal smak och konsistens.',
      'Håll koll på innertemperaturen för att undvika överkokning.',
      'Välj rätt storlek på potatisen: Att välja mandelpotatis av rätt storlek spelar en central roll för att uppnå perfekt konsistens vid kokning. Mindre potatisar passar bäst för kokning och skapar en fin textur medan större bitar lått kan bli mosiga och förlora sin form.',
      'Var försiktig när du hanterar potatisen: För att lyckas med kokningen av mandelpotatis är det viktigt att vara försiktig när du hanterar potatisen. Mandelpotatis är naturligt känslig och kan lätt bli mosig eller gå sönder om den inte behandlas varsamt.',
      'För att undvika detta, se till att inte kasta eller slå potatisen hårt mot någon yta när du förbereder den. Istället, hantera den varsamt och använd en kniv eller potatisskalare för att ta bort eventuellt smuts eller ytliga skador.',
      'Koka i saltat och sjudande vatten: För att koka mandelpotatis perfekt är det viktigt att använda saltat och sjudande vatten. Genom att salta vattnet får potatisen en angenäm smak och blir mer välsmakande. Det sjudande vattnet gör att potatisen kokas jämnt och behåller sin krämiga konsistens.',
      'När du sätter på potatisen, se till att vattnet kokar ordentligt och håll sedan en jämn sjudning under hela koktiden. På så sätt får du en perfekt kokt mandelpotatis som är mjuk och krämig samtidigt.',
      'Håll koll på innertemperaturen: För att kokning av mandelpotatis ska bli perfekt är det viktigt att hålla koll på innertemperaturen. En bra riktlinje är att koka mandelpotatisen tills den når en innertemperatur på ca 85-90 grader Celsius. Det bästa sättet att kontrollera detta är genom att använda en digital köttermometer.',
      'Serveringstips och varianter för kokt mandelpotatis: Det finns många olika sätt att njuta av kokt mandelpotatis! Servera den med smör och färska örter för en enkel men utsökt smakupplevelse. Du kan också använda den i sallader eller göra en krämig potatismos.',
      'Använd i sallader eller puréer: Mandelpotatis är en fantastisk potatissort som passar perfekt i sallader eller puréer. Testa att lägga till färska örter, citronsaft eller en läcker dressing för att lyfta smaken ännu mer.',
      'Utforska olika kryddningar och tillbehör för variation: När det kommer till att koka mandelpotatis perfekt är variation nyckeln. Utforska olika kryddningar och tillbehör för att ge potatisen en spännande twist. Prova att blanda i färska örter som timjan eller rosmarin under kokningen för att ge potatisen en aromatisk smak.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Tips "Mandelpotatis" har skapats!')
    console.log(`🔗 Recept-ID: ${recipe.id}`)

  } catch (error) {
    console.error('❌ Fel vid skapande av tips:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
