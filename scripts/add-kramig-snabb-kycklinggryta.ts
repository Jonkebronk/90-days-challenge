import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍲 Lägger till recept: Krämig och snabb kycklinggryta...')

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
        title: 'Krämig och snabb kycklinggryta',
        description: 'Snabb och krämig kycklinggryta med minikeso, röd paprika och spenatblad. Serveras med ris och en krispig sallad.',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/MHN5VYfY/2025-11-21-00-25-31-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 20,
        caloriesPerServing: 511,
        proteinPerServing: 52,
        fatPerServing: 4,
        carbsPerServing: 62,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kyckling', amount: '134', unit: 'gram (g)', grams: 134 },
      { name: 'Mini keso', amount: '67', unit: 'gram (g)', grams: 67 },
      { name: 'Ris', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Paprika, röd', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Spenatblad', amount: '30', unit: 'gram (g)', grams: 30 },
      { name: 'Cayenne', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Vitpeppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Oregano', amount: '1', unit: 'tesked (tsk)', grams: 3 },
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
      'Dela kycklingen i mindre bitar.',
      'Koka upp ris.',
      'Stek upp kycklingen och tillsätt paprika och spenatblad.',
      'Tillsätt minikeso i stekpannan.',
      'Slå på riset i pannan och låt keson smälta ihop allting.',
      'Krydda med cayenne, vitpeppar och oregano efter tycke!',
      'Serva med krispig sallad.',
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

    console.log('\n🎉 Recept "Krämig och snabb kycklinggryta" har skapats!')
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
