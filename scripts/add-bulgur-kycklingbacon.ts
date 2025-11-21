import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥓 Lägger till recept: Bulgur med kycklingbacon...')

  try {
    // 1. Hitta Kalkon-kategorin
    const kalkonCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kalkon' }
    })

    if (!kalkonCategory) {
      throw new Error('Kalkon-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', kalkonCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Bulgur med kycklingbacon',
        description: 'Proteinrik och mättande rätt med bulgur, kycklingbacon, purjolök och paprika. Tips: Byt bulgur mot ris eller pasta om så önskas.',
        categoryId: kalkonCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/W4tt7bnR/2025-11-20-16-51-08-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 15,
        caloriesPerServing: 511,
        proteinPerServing: 54,
        fatPerServing: 4,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingbacon', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Bulgur', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Purjolök', amount: '75', unit: 'gram (g)', grams: 75 },
      { name: 'Paprika', amount: '125', unit: 'gram (g)', grams: 125 },
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
      'Koka bulgurn.',
      'Fräs bacon med purjolöken och paprikan.',
      'När bulgurn är klar, blandar du ihop allt i stekpannan och tillsätter såsen.',
      'Klart att äta!',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 0 ? 15 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Bulgur med kycklingbacon" har skapats!')
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
