import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌶️ Lägger till recept: Pepprig tonfisk och pasta...')

  try {
    // 1. Hitta Lunch & Middag-kategorin
    const lunchCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'lunch' }
    })

    if (!lunchCategory) {
      throw new Error('Lunch & Middag-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', lunchCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Pepprig tonfisk och pasta',
        description: 'Kryddig tonfiskrätt med kikärtspasta, krossade tomater och mycket svartpeppar. En smakrik och proteinrik lunch eller middag.',
        categoryId: lunchCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/L6KtphSv/2025-11-21-01-16-30-Recipe-Keeper.png',
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
      { name: 'Tonfisk i vatten', amount: '182', unit: 'gram (g)', grams: 182 },
      { name: 'Kikärtspasta', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Finkrossade tomater', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Hackad lök och vit (1/4 vitlöksklyfta)', amount: '30', unit: 'gram (g)', grams: 30 },
      { name: 'Broccoli', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Vatten', amount: '0.25', unit: 'deciliter (dl)', grams: 25 },
      { name: 'Paprikapulver', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Örtsalt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Nymald svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('(')[0].split(',')[0].trim(), mode: 'insensitive' } }
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
      'Koka upp vatten till pastan.',
      'Finhacka gul lök och vitlök.',
      'Hetta upp lite kokosolja i en kastrull. Fräs löken och pudra på paprikapulver.',
      'Tillsätt krossade tomater och örtsalt. Koka upp.',
      'Lägg i avrunnen tonfisk i tomatsåsen och finfördelar fisken. Smaka av med en hel del svartpeppar.',
      'Servera med nykokt pasta och broccoli.',
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

    console.log('\n🎉 Recept "Pepprig tonfisk och pasta" har skapats!')
    console.log(`🔗 Recept-ID: ${recipe.id}`)
    console.log(`📊 Makro: ${recipe.caloriesPerServing} kcal, ${recipe.proteinPerServing}g protein, ${recipe.fatPerServing}g fett, ${recipe.carbsPerServing}g kolhydrater`)

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
