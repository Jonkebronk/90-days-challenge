import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥣 Lägger till recept: Chiapudding...')

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
        title: 'Chiapudding',
        description: 'Nyttig och mättande chiapudding som får stå över natten. Toppas med färska bär och nötter.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/h45TFTHD/2025-11-20-16-22-52-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        caloriesPerServing: 480,
        proteinPerServing: 30,
        fatPerServing: 23,
        carbsPerServing: 30,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Chiafrön', amount: '40', unit: 'gram (g)', grams: 40 },
      { name: 'Mjölk eller växtbaserad dryck', amount: '300', unit: 'milliliter (ml)', grams: 300 },
      { name: 'Proteinpulver (valfritt)', amount: '30', unit: 'gram (g)', grams: 30 },
      { name: 'Bär', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Nötter (valnötter eller mandlar)', amount: '15', unit: 'gram (g)', grams: 15 },
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
      'Blanda chiafrön med mjölk eller växtbaserad dryck (t.ex. mandelmjölk) och låt stå över natten.',
      'Toppa med bär, nötter innan servering.',
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

    console.log('\n🎉 Recept "Chiapudding" har skapats!')
    console.log(`📊 Näringsvärden: ${recipe.caloriesPerServing} kcal, ${recipe.proteinPerServing}g protein, ${recipe.carbsPerServing}g kolhydrater, ${recipe.fatPerServing}g fett`)
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
