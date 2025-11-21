import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🍗 Lägger till recept: Airfryer kyckling med grönsaker och ris...')

  try {
    // 1. Hitta eller skapa Kyckling-kategorin
    let kycklingCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'kyckling' }
    })

    if (!kycklingCategory) {
      kycklingCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Kyckling',
          slug: 'kyckling',
        }
      })
      console.log('✓ Skapade kategori:', kycklingCategory.name)
    } else {
      console.log('✓ Hittade kategori:', kycklingCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Airfryer kyckling med grönsaker och ris',
        description: 'Enkel och hälsosam middag med kyckling, broccoli och röd paprika tillagad i airfryer. Serveras med ris.',
        categoryId: kycklingCategory.id,
        servings: 2,
        coverImage: 'https://i.postimg.cc/44LVBL7F/2025-11-21-00-09-53-Recipe-Keeper.png',
        prepTimeMinutes: 10,
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
      { name: 'Kycklingfilé', amount: '400', unit: 'gram (g)', grams: 400 },
      { name: 'Ris, kokt', amount: '2', unit: 'deciliter (dl)', grams: 200 },
      { name: 'Broccoli', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Paprika, röd', amount: '1', unit: 'st', grams: 150 },
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
      'Sätt airfryern på 190°C.',
      'Skölj broccolin och paprikan. Skär grönsakerna och kycklingen i mindre bitar.',
      'Tillsätt kycklingen och grönsakerna till airfryern och tillaga i cirka 10-15 minuter tills kycklingen är genomstekt och grönsakerna är mjuka och gyllene. Rör om efter cirka halva tillagningstiden.',
      'Servera kycklingen och grönsakerna tillsammans med riset. Smaklig måltid!',
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

    console.log('\n🎉 Recept "Airfryer kyckling med grönsaker och ris" har skapats!')
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
