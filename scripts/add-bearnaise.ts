import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥄 Lägger till recept: Bearnaise...')

  try {
    // 1. Hitta eller skapa Såser-kategorin
    let saserCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'saser' }
    })

    if (!saserCategory) {
      saserCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Såser',
          slug: 'saser',
          description: 'Såser av olika slag'
        }
      })
      console.log('✓ Skapade kategori:', saserCategory.name)
    } else {
      console.log('✓ Hittade kategori:', saserCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Bearnaise',
        description: 'Proteinrik bearnaisesås baserad på grekisk yoghurt med äggula, dragon och persilja.',
        categoryId: saserCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/sDXXzgt8/2025-11-20-17-03-56-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        caloriesPerServing: 98,
        proteinPerServing: 17,
        fatPerServing: 1,
        carbsPerServing: 5,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Lärsas grekiska yoghurt', amount: '131', unit: 'gram (g)', grams: 131 },
      { name: 'Citronsaft', amount: '0.5', unit: 'matsked (msk)', grams: 8 },
      { name: 'Äggula', amount: '1', unit: 'st', grams: 20 },
      { name: 'Dragon, torkad eller färsk', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Persilja, torkad eller färsk', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Vitpeppar', amount: '1', unit: 'nypa', grams: 1 },
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
      'Blanda ihop ingredienserna och smaka av med kryddningen.',
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

    console.log('✓ Lagt till', instructions.length, 'instruktion')

    console.log('\n🎉 Recept "Bearnaise" har skapats!')
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
