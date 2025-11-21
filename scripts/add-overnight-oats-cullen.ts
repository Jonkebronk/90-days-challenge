import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥣 Lägger till recept: Overnight Oats Cullen...')

  try {
    // 1. Hitta eller skapa Frukost-kategorin
    let frukostCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'frukost' }
    })

    if (!frukostCategory) {
      frukostCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Frukost',
          slug: 'frukost',
        }
      })
      console.log('✓ Skapade kategori:', frukostCategory.name)
    } else {
      console.log('✓ Hittade kategori:', frukostCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Overnight Oats Cullen',
        description: 'Nyttig och mättande frukost med overnight oats. Receptet inkluderar 4 smakrika varianter: blåbär & kardemumma, hallon, morotskaka, och banan med choklad & jordnötssmör. Perfekt att förbereda kvällen innan!',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/2yHXfwPq/2025-11-20-17-19-42-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Grekisk yoghurt', amount: '1', unit: 'deciliter (dl)', grams: 100 },
      { name: 'Havregryn', amount: '1', unit: 'deciliter (dl)', grams: 35 },
      { name: 'Mjölk', amount: '1', unit: 'deciliter (dl)', grams: 100 },
      { name: 'Chiafrön', amount: '0.5', unit: 'matsked (msk)', grams: 7.5 },
      { name: 'Vaniljpulver', amount: '0.5', unit: 'tesked (tsk)', grams: 2.5 },
      { name: 'Salt', amount: '1', unit: 'krm', grams: 1 },
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
      'Blanda alla basingredienser (grekisk yoghurt, havregryn, mjölk, chiafrön, vaniljpulver och salt) i en burk eller skål. Rör om väl.',
      'Välj en av de fyra varianterna och tillsätt den smaksättning du önskar:',
      'Variant 1 - Blåbär och kardemumma: Tillsätt blåbär och kardemumma efter tycke och smak.',
      'Variant 2 - Hallon: Blanda i frysta hallon och rör runt.',
      'Variant 3 - Morotskaka: Tillsätt 1/4 finriven morot, lite kanel och kardemumma.',
      'Variant 4 - Banan, choklad och jordnötssmör: Tillsätt en halv mosad banan, 1 tsk ren kakao och 1 tsk jordnötssmör.',
      'Täck över och låt stå i kylen över natten (minst 4-6 timmar).',
      'Servera kall direkt från kylen. Toppa gärna med extra färska bär eller frukt.',
      'Tips: Vill man öka proteinmängd och därmed mättnad kan man enkelt koka ett ägg till, ta lite jordnötssmör, byta grekisk yoghurt mot kvarg eller kanske blanda i proteinpulver.',
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

    console.log('\n🎉 Recept "Overnight Oats Cullen" har skapats!')
    console.log(`🔗 Recept-ID: ${recipe.id}`)

  } catch (error) {
    console.error('❌ Fel vid skapande av recept:', error)
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
