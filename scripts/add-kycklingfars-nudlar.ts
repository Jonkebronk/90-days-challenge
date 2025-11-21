import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍜 Lägger till recept: Kycklingfärs med nudlar...')

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
        title: 'Kycklingfärs med nudlar',
        description: 'Asiatiskt inspirerad rätt med kycklingfärs, risnudlar, morot och purjolök. Kryddad med curry, ingefära och vitlök. Serveras med sallad och sweet chili.',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/P5kc7tNc/2025-11-21-00-27-56-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 20,
        caloriesPerServing: 511,
        proteinPerServing: 54,
        fatPerServing: 4,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingfärs', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Risnudlar', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Morot', amount: '110', unit: 'gram (g)', grams: 110 },
      { name: 'Purjolök', amount: '80', unit: 'gram (g)', grams: 80 },
      { name: 'Tomatpuré', amount: '10', unit: 'gram (g)', grams: 10 },
      { name: 'Vitlök', amount: '2', unit: 'klyftor', grams: 10 },
      { name: 'Curry', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Ingefära', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Paprikapulver', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Rapsolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Stek kryddorna i cirka 1 minut i rapsolja. Sedan i med tomatpuré och stekt ytterligare 1 minut.',
      'Stek sedan purjolöken och morot i kryddpastan.',
      'När purjolöken har mjuknat lite så häller du i kycklingfärsen. Låt stek ihop allt tills kycklingfärsen är genomstekt.',
      'Under tiden kokar du risnudlar och gör en liten sallad.',
      'Serveras gärna ihop med en sallad och några stänk av Slender Chef Sweet Chilisås.',
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

    console.log('\n🎉 Recept "Kycklingfärs med nudlar" har skapats!')
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
