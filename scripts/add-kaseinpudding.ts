import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍮 Lägger till recept: Kaseinpudding...')

  try {
    // 1. Hitta eller skapa Mellanmål-kategorin
    let mellanmalCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'mellanmal' }
    })

    if (!mellanmalCategory) {
      mellanmalCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Mellanmål',
          slug: 'mellanmal',
          description: 'Mellanmål och snacks'
        }
      })
      console.log('✓ Skapade kategori:', mellanmalCategory.name)
    } else {
      console.log('✓ Hittade kategori:', mellanmalCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Kaseinpudding',
        description: 'Proteinrik och krämig kaseinpudding med vaniljkvarg och bär. Tips: Toppa med 20 gram hackade nötter som du sparat från ett mellanmål.',
        categoryId: mellanmalCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/Px34RxGt/2025-11-20-16-56-42-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 20,
        caloriesPerServing: 114,
        proteinPerServing: 19,
        fatPerServing: 2,
        carbsPerServing: 5,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Hallon/blåbär', amount: '40', unit: 'gram (g)', grams: 40 },
      { name: 'Vaniljkvarg', amount: '31', unit: 'gram (g)', grams: 31 },
      { name: 'Tyngre kasein kladdkaka', amount: '19', unit: 'gram (g)', grams: 19 },
      { name: 'Vatten', amount: '100', unit: 'gram (g)', grams: 100 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('/')[0].trim(), mode: 'insensitive' } }
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
      'Vispa kaseinpulver med vatten till slät puddingkonsistens.',
      'Häll upp i ett glas och ställ i frysen i 20 minuter eller kylen i 40 minuter.',
      'Toppa med vaniljkvarg och halvtinade hallon/blåbär.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 1 ? 20 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Kaseinpudding" har skapats!')
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
