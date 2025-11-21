import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🦐 Lägger till recept: Airfryer räkor med spaghetti och zucchini...')

  try {
    // 1. Hitta eller skapa Räkor-kategorin
    let rakorCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'rakor' }
    })

    if (!rakorCategory) {
      rakorCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Räkor',
          slug: 'rakor',
          description: 'Recept med räkor och skaldjur'
        }
      })
      console.log('✓ Skapade ny kategori:', rakorCategory.name)
    } else {
      console.log('✓ Hittade kategori:', rakorCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Airfryer räkor med spaghetti och zucchini',
        description: 'Cajunkryddade räkor tillagade i airfryer, serveras med fullkornsspaghetti och stekt zucchini med vitlök och persilja.',
        categoryId: rakorCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/d0WnBFzT/2025-11-21-00-48-38-Recipe-Keeper.png',
        prepTimeMinutes: 20,
        cookTimeMinutes: 15,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Olivolja', amount: '2', unit: 'tesked (tsk)', grams: 10 },
      { name: 'Zucchini/squash', amount: '115', unit: 'gram (g)', grams: 115 },
      { name: 'Kungsräkor, råa med skal, fryst', amount: '4', unit: 'bit', grams: 96 },
      { name: 'Spaghetti, fullkorn, okokt', amount: '80', unit: 'gram (g)', grams: 80 },
      { name: 'Cajun kryddblandning', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Persilja, hackad', amount: '0.5', unit: 'tesked (tsk)', grams: 1 },
      { name: 'Vitlökslyfta, hel', amount: '3.5', unit: 'bit', grams: 18 },
      { name: 'Paprikapulver, rökt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Vitlökspulver', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Chiliflingor', amount: '1', unit: 'nypa', grams: 1 },
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
      'Sätt airfryern på 200°C.',
      'Tina och skala räkorna. Tillsätt sedan till en skål och blanda ihop med chiliflingor, vitlökspulver, cajunkrydda, paprikapulver och hälften av oljan.',
      'Skölj och skär zucchinin i mindre bitar. Skala och hacka vitlöken.',
      'Koka pastan i en kastrull med lättsaltat vatten enligt anvisningarna på förpackningen.',
      'Tillaga räkorna i airfryern i cirka 8 minuter.',
      'Värm upp en stekpanna med resten av oljan på medelhög värme och stek zucchinin i cirka 5-7 minuter. Tillsätt vitlöken och stek i ytterligare 1-2 minuter.',
      'Tillsätt spaghetti, räkorna, persiljan till stekpannan tillsammans med lite av pastavattnet och blanda ihop. Stäng av värmen och låt stå i ett par minuter.',
      'Servera sedan pastan på en tallrik och eventuellt lite mer hackad persilja. Smaklig måltid!',
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

    console.log('\n🎉 Recept "Airfryer räkor med spaghetti och zucchini" har skapats!')
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
