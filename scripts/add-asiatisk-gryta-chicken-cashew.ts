import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥘 Lägger till recept: Asiatisk gryta "chicken cashew"...')

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
        title: 'Asiatisk gryta "chicken cashew"',
        description: 'Asiatiskt inspirerad kycklinggryta med ananas, bambuskott, paprika och cashewnötter. Serveras med ris och sweet chili-sås.',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/vZ34ZDrJ/2025-11-21-00-13-30-Recipe-Keeper.png',
        prepTimeMinutes: 15,
        cookTimeMinutes: 30,
        caloriesPerServing: 511,
        proteinPerServing: 54,
        fatPerServing: 4,
        carbsPerServing: 60,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingbröstfilé', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Ris', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Ananas', amount: '25', unit: 'gram (g)', grams: 25 },
      { name: 'Bambuskott', amount: '25', unit: 'gram (g)', grams: 25 },
      { name: 'Paprika, gul', amount: '25', unit: 'gram (g)', grams: 25 },
      { name: 'Paprika, röd', amount: '25', unit: 'gram (g)', grams: 25 },
      { name: 'Tomater, krossade', amount: '75', unit: 'gram (g)', grams: 75 },
      { name: 'Lök, gul', amount: '25', unit: 'gram (g)', grams: 25 },
      { name: 'Slender chef Sweet chili', amount: '2', unit: 'deciliter (dl)', grams: 200 },
      { name: 'Cashewnötter', amount: '20', unit: 'gram (g)', grams: 20 },
      { name: 'Sambal oelek', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
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
      'Strimla och stek kycklingen.',
      'Finhacka löken och frås tillsammans med kycklingen tills det slutat "vätska" sig.',
      'Häll i resterande ingredienser förutom cashewnötterna.',
      'Låt puttra i 20-30 minuter.',
      'Servera tillsammans med ris & toppa med cashewnötterna.',
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

    console.log('\n🎉 Recept "Asiatisk gryta \'chicken cashew\'" har skapats!')
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
