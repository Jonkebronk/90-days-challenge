import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🫐 Lägger till recept: Vaniljkeso med banan och blåbär...')

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
        title: 'Vaniljkeso med banan och blåbär',
        description: 'Snabb och hälsosam frukost med vaniljkeso, färsk banan och blåbär. Perfekt balans mellan protein och naturlig sötma.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/mDjmQj2T/2025-11-20-17-20-16-Recipe-Keeper.png',
        prepTimeMinutes: 3,
        cookTimeMinutes: 0,
        caloriesPerServing: 257,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Vaniljkeso 2,9% fett', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Banan', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Blåbär', amount: '50', unit: 'gram (g)', grams: 50 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(' fett')[0].split(',')[0].trim(), mode: 'insensitive' } }
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
      'Servera vaniljkeson i en skål.',
      'Toppa med skivad banan och blåbär.',
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

    console.log('\n🎉 Recept "Vaniljkeso med banan och blåbär" har skapats!')
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
