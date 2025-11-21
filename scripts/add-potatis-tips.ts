import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Potatis...')

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
        title: 'Potatis',
        description: 'Guide för att koka potatis på olika sätt. Lär dig välja rätt typ av potatis, förbereda dem och koka med traditionell kokning, ångkokning eller mikrovågsugn.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/wTVWvDwB/2025-11-21-01-00-20-Recipe-Keeper.png',
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
      { name: 'Potatis', amount: '500', unit: 'gram (g)', grams: 500 },
      { name: 'Salt', amount: '1', unit: 'tesked (tsk)', grams: 5 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0].trim(), mode: 'insensitive' } }
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
      'Förberedelse av potatis: Välj rätt typ av potatis. För kokning är potatis med hög stärkelsehalt, som exempelvis den klassiska sorten King Edward eller andra mjöliga potatissorter, bra val eftersom de har en tendens att bli mjuka och fluffiga när de kokas. Potatis med lägre stärkelsehalt, såsom färskpotatis eller vaxade potatisar, fungerar också bra men får en fastare konsistens efter kokning.',
      'Skrubba potatisarna ordentligt för att ta bort smuts och eventuell jord. Om de är stora kan du skära dem i mindre bitar för att underlätta kokningen.',
      'Traditionell kokning: Placera potatisarna i en kastrull och täck dem med kallt vatten. Tillsätt salt (ca 1 tsk salt per liter vatten) för smak.',
      'Koka potatisarna på medelhög värme tills de är mjuka och enkla att sticka genom med en gaffel, vanligtvis tar det ca 15-20 minuter beroende på storlek.',
      'Häll av vattnet och låt potatisarna svalna någon innan du serverar dem.',
      'Ångkokning: Placera potatisarna i en ångkokare eller ängnäts ovanför kokande vatten. Täck ångkokaren med ett lock och låt potatisarna ångas tills de är mjuka, vilket tar cirka 20-30 minuter beroende på storlek. Detta är en hälsosammare metod eftersom mer näringsamnen bevaras.',
      'Tillaga i mikrovågsugn: Skär potatisarna i mindre bitar och placera dem i en mikrovågssäker skål tillsammans med lite vatten. Täck skålen med ett lock eller plats plastfolie över och koka på hög effekt i 5-7 minuter tills potatisarna är mjuka. Håll koll på dem för att undvika överkokning.',
      'Koktid för potatis kan variera beroende på storlek och typ av potatis, så det är alltid bäst att sticka en gaffel eller en kniv i potatisen för att testa hur mjuk den är.',
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

    console.log('\n🎉 Tips "Potatis" har skapats!')
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
