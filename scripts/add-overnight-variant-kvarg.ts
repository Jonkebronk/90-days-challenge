import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥛 Lägger till recept: Overnight-variant med kvarg...')

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
        title: 'Overnight-variant med kvarg',
        description: 'Proteinrik overnight-frukost med fiberhavregryn, linfrön, chiafrön, blåbär och vaniljkvarg. Tips! Ta halva mängden havregryn, linfrön och chiafrön så räcker dessa till ytterligare ett mellanmål under dagen.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/rwfLg1hZ/2025-11-20-16-42-13-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        caloriesPerServing: 476,
        proteinPerServing: 30,
        fatPerServing: 16,
        carbsPerServing: 51,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Linfrön', amount: '2', unit: 'matsked (msk)', grams: 20 },
      { name: 'Chiafrön', amount: '35', unit: 'gram (g)', grams: 35 },
      { name: 'Blåbär (eller andra bär)', amount: '40', unit: 'gram (g)', grams: 40 },
      { name: 'Vaniljkvarg', amount: '151', unit: 'gram (g)', grams: 151 },
      { name: 'Havregryn med fiber', amount: '48', unit: 'gram (g)', grams: 48 },
      { name: 'Vatten', amount: '100', unit: 'milliliter (ml)', grams: 100 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('(')[0].trim(), mode: 'insensitive' } }
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
      'Blanda fiberhavregryn, linfrön och chiafrön.',
      'Fyll upp med vatten precis över blandningen.',
      'Låt stå över natten (eller åtminstone ett par timmar) i kylen.',
      'Lägg på bär och fyll upp med vaniljkvargen.',
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

    console.log('\n🎉 Recept "Overnight-variant med kvarg" har skapats!')
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
