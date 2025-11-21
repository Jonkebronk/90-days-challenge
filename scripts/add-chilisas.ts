import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌶️ Lägger till recept: Chilisås...')

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
        title: 'Chilisås',
        description: 'Enkel och snabb chilisås baserad på kvarg/kesella och tacosås. Späd med Sambal Oelek för starkare smak.',
        categoryId: kvargsaserCategory.id,
        servings: 2,
        coverImage: 'https://i.postimg.cc/QMwcV6Tj/chilisas-placeholder.png',
        prepTimeMinutes: 2,
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
      { name: 'Santa Maria Tacosås', amount: '2-3', unit: 'matsked (msk)', grams: 40 },
      { name: 'Lättkvarg/lättkesella/minikeso', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Sambal Oelek (valfritt)', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Vatten (för utspädning)', amount: '2', unit: 'matsked (msk)', grams: 30 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('/')[0].split('(')[0].trim(), mode: 'insensitive' } }
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
      'Med endast två ingredienser kan det knappt bli lättare. Blanda i någon/några matskedar chilisås i kvargen och rör runt. Späd ev. ut med mer vatten för lösare konsistens på såsen.',
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

    console.log('\n🎉 Recept "Chilisås" har skapats!')
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
