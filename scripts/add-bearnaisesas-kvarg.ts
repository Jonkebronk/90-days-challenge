import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥄 Lägger till recept: Bearnaisesås på kvarg...')

  try {
    // 1. Hitta eller skapa Kvarg såser-kategorin
    let kvargsaserCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kvarg-saser' }
    })

    if (!kvargsaserCategory) {
      kvargsaserCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Kvarg såser',
          slug: 'kvarg-saser',
          description: 'Såser baserade på kvarg'
        }
      })
      console.log('✓ Skapade kategori:', kvargsaserCategory.name)
    } else {
      console.log('✓ Hittade kategori:', kvargsaserCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Bearnaisesås på kvarg',
        description: 'Proteinrik bearnaisesås baserad på kvarg med äggulor, dragon och persilja.',
        categoryId: kvargsaserCategory.id,
        servings: 4,
        coverImage: 'https://i.postimg.cc/VN4BJ6k4/2025-11-20-16-57-48-Recipe-Keeper.png',
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
      { name: 'Kvarg, naturell, 0.2% fett', amount: '3.5', unit: 'deciliter (dl)', grams: 350 },
      { name: 'Äggulor', amount: '2', unit: 'st', grams: 40 },
      { name: 'Vitvinsvinäger', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Dragon, torkad eller färsk', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Persilja, torkad eller färsk', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 2 },
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
      'Vispa äggulorna och blanda sedan i samtliga ingredienser. Krydda därefter med dragon, salt, vitpeppar och persilja efter smak. Servera!',
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

    console.log('\n🎉 Recept "Bearnaisesås på kvarg" har skapats!')
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
