import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍗 Lägger till recept: Grillad kyckling med klyftpotatis...')

  try {
    // 1. Hitta Kyckling-kategorin
    const kycklingCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kyckling' }
    })

    if (!kycklingCategory) {
      throw new Error('Kyckling-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', kycklingCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Grillad kyckling med klyftpotatis',
        description: 'Klassisk och enkel middag med grillad kyckling, rosmarinkryddade klyftpotatis och gröna bönor. Serveras med BBQ-sås.',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/Znt0NBKC/2025-11-21-00-21-10-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 35,
        caloriesPerServing: 511,
        proteinPerServing: 55,
        fatPerServing: 3,
        carbsPerServing: 58,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kyckling, grillad', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Potatis', amount: '318', unit: 'gram (g)', grams: 318 },
      { name: 'Gröna bönor', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Slenderchef barbeque', amount: '10', unit: 'gram (g)', grams: 10 },
      { name: 'Rosmarin', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Peppar', amount: '1', unit: 'nypa', grams: 1 },
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
      'Skär potatisen i klyftor. Krydda med salt, peppar och rosmarin. Tillaga i ugnen.',
      'Ansa kycklingen.',
      'Värm gröna bönor.',
      'Lägg upp på tallrik och ringla över bbq såsen!!',
      'Enjoy!',
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

    console.log('\n🎉 Recept "Grillad kyckling med klyftpotatis" har skapats!')
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
