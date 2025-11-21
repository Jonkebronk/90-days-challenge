import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥜 Lägger till recept: Keso och kvarg med banan och cashewnötter...')

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
        title: 'Keso och kvarg med banan och cashewnötter',
        description: 'Proteinrik och krämig frukost med keso, kvarg, banan, honung och cashewnötter.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/Yq8NS0D0/2025-11-20-16-35-56-Recipe-Keeper.png',
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
      { name: 'Banan', amount: '0.5', unit: 'bit', grams: 55 },
      { name: 'Cashewnötter, naturella', amount: '0.5', unit: 'kopp', grams: 65 },
      { name: 'Keso, 4%, laktosfri', amount: '0.25', unit: 'kopp', grams: 56 },
      { name: 'Honung', amount: '1', unit: 'tesked (tsk)', grams: 7 },
      { name: 'Kvarg, naturell, 0.2% fett', amount: '75', unit: 'gram (g)', grams: 75 },
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
      'Skala och skiva bananen.',
      'Blanda ihop kvargen tillsammans med keson i en skål och toppa med banan, honung och cashewnötter. Smaklig måltid!',
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

    console.log('\n🎉 Recept "Keso och kvarg med banan och cashewnötter" har skapats!')
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
