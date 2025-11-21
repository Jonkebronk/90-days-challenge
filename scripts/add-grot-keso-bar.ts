import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥣 Lägger till recept: Gröt med keso och bär...')

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
        title: 'Gröt med keso och bär',
        description: 'Varm och mättande havregrynsgröt toppad med proteinrik keso och färska bär.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/mDF1N2S9/2025-11-20-16-25-44-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 5,
        caloriesPerServing: 500,
        proteinPerServing: 30,
        fatPerServing: 12,
        carbsPerServing: 65,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Havregryn', amount: '80', unit: 'gram (g)', grams: 80 },
      { name: 'Vatten', amount: '250', unit: 'milliliter (ml)', grams: 250 },
      { name: 'Keso', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Blåbär eller hallon', amount: '50', unit: 'gram (g)', grams: 50 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split('eller')[0].trim(), mode: 'insensitive' } }
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
      'Koka gröt på havregryn och vatten eller mjölk. Toppa med keso, valfria bär (t.ex. blåbär eller hallon).',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: 5,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktion')

    console.log('\n🎉 Recept "Gröt med keso och bär" har skapats!')
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
