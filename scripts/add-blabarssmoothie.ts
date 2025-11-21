import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🫐 Lägger till recept: Blåbärssmoothie med extra protein...')

  try {
    // 1. Hitta Frukost-kategorin
    const frukostCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'frukost' }
    })

    if (!frukostCategory) {
      throw new Error('Frukost-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', frukostCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Blåbärssmoothie med extra protein',
        description: 'Nyttig och proteinrik smoothie med blåbär, banan, jordnötssmör och kardemumma. Perfekt för en energirik start på dagen!',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/YS0twLck/2025-11-20-16-17-47-Recipe-Keeper.png',
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Banan', amount: '110', unit: 'gram (g)', grams: 110 },
      { name: 'Blåbär, frysta', amount: '155', unit: 'gram (g)', grams: 155 },
      { name: 'Jordnötssmör, minst 99% jordnötter', amount: '32', unit: 'gram (g)', grams: 32 },
      { name: 'Whey proteinpulver', amount: '25', unit: 'gram (g)', grams: 25 },
      { name: 'Lättmjölk, 0.5% fett', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Kardemumma', amount: '0.5', unit: 'tesked (tsk)', grams: 0 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0], mode: 'insensitive' } }
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
      'Skala bananen och skär den i mindre bitar.',
      'Tillsätt alla ingredienser och proteinpulver till en mixer och mixa i cirka 30 sekunder eller tills du har en klumpfri och krämig smoothie. Tillsätt eventuellt lite vatten eller några isbitar och mixa i cirka 30 sekunder till för att få den önskade konsistensen.',
      'Servera smoothien i ett glas.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 1 ? 30 : null, // Steg 2 tar 30 sekunder
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Blåbärssmoothie med extra protein" har skapats!')
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
