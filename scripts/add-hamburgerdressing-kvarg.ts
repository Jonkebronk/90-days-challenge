import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍔 Lägger till recept: Hamburgerdressing på kvarg...')

  try {
    // 1. Hitta Kvarg såser-kategorin
    const kvargsaserCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kvarg-saser' }
    })

    if (!kvargsaserCategory) {
      throw new Error('Kvarg såser-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', kvargsaserCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Hamburgerdressing på kvarg',
        description: 'Proteinrik hamburgerdressing baserad på kvarg med bostongurka, stark senap och chilisås. Perfekt till grillat!',
        categoryId: kvargsaserCategory.id,
        servings: 4,
        coverImage: 'https://i.postimg.cc/zf3SRNbs/2025-11-20-17-00-31-Recipe-Keeper.png',
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
      { name: 'Kvarg, naturell, 0.2% fett', amount: '250', unit: 'gram (g)', grams: 250 },
      { name: 'Bostongurka', amount: '1', unit: 'deciliter (dl)', grams: 100 },
      { name: 'Stark senap', amount: '1.5', unit: 'matsked (msk)', grams: 22 },
      { name: 'Chilisås', amount: '1', unit: 'deciliter (dl)', grams: 100 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 2 },
      { name: 'Svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
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
      'Rör ihop alla ingredienser och låt dressingen stå en stund. Servera till grillat!',
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

    console.log('\n🎉 Recept "Hamburgerdressing på kvarg" har skapats!')
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
