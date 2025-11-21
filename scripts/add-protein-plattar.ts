import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍳 Lägger till recept: Protein plättar...')

  try {
    // 1. Hitta Frukost-kategorin
    const frukostCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'frukost' }
    })

    if (!frukostCategory) {
      throw new Error('Frukost-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', frukostCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Protein plättar',
        description: 'Proteinrika pannkakor perfekta för frukost. Servera med hallon, blåbär, sylt, frukt eller kvarg.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: null, // Kan läggas till senare
        caloriesPerServing: 475,
        proteinPerServing: 40,
        fatPerServing: 18,
        carbsPerServing: 35,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Ägg', amount: '130', unit: 'gram (g)', grams: 130 },
      { name: 'Proteinpulver', amount: '151', unit: 'gram (g)', grams: 151 },
      { name: 'Rismjöl', amount: '48', unit: 'gram (g)', grams: 48 },
      { name: 'Fiberhusk', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Sötströ (valfritt)', amount: '1', unit: 'tesked (tsk)', grams: 5 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name, mode: 'insensitive' } }
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
      'Blanda alla ingredienser med stavmixer eller mixer',
      'Låt stå och vila 3-5 min',
      'Stek på medelvärme med lite kokosolja i pannan',
      'Njut med valfri topping',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 1 ? 5 : null, // Steg 2 tar 5 min
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Protein plättar" har skapats!')
    console.log(`📊 Näringsvärden: ${recipe.caloriesPerServing} kcal, ${recipe.proteinPerServing}g protein`)
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
