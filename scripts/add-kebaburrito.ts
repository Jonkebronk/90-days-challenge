import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌯 Lägger till recept: Kebaburrito...')

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
        title: 'Kebaburrito',
        description: 'Proteinrik kebabwrap fylld med kycklingkebab, färska grönsaker och egengjord kebabsås med grekisk yoghurt. Perfekt helgmat!',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/qRGWsWp9/2025-11-21-00-23-46-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 10,
        caloriesPerServing: 512,
        proteinPerServing: 53,
        fatPerServing: 9,
        carbsPerServing: 49,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingkebab, Eldorado', amount: '120', unit: 'gram (g)', grams: 120 },
      { name: 'Grekisk yoghurt, Larsas', amount: '86', unit: 'gram (g)', grams: 86 },
      { name: 'Kebabwrap, Schysst kåk', amount: '80', unit: 'gram (g)', grams: 80 },
      { name: 'Grönsaker, blandade', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Vitlök', amount: '5', unit: 'gram (g)', grams: 5 },
      { name: 'Shwarma kebabkrydda', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Spiskummin', amount: '1', unit: 'krm', grams: 1 },
      { name: 'Paprika pulver', amount: '1', unit: 'krm', grams: 1 },
      { name: 'Vatten', amount: '1', unit: 'matsked (msk)', grams: 15 },
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
      'Ta fram din rulle och fyll den med valfria grönsaker, förslagsvis grön sallad, tomat, gurka & lök.',
      'Stek upp kebabkycklingen & strö den över salladen.',
      'Ringla egengjord kebabsås över & rulla ihop som en burrito.',
      'Dela på hälften & avnjut framför en film i soffan. Perfekt helgmat!',
      'Serveras med egengjord kebabsås.',
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

    console.log('\n🎉 Recept "Kebaburrito" har skapats!')
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
