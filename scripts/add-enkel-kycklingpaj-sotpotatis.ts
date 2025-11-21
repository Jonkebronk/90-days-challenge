import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥧 Lägger till recept: Enkel Kycklingpaj med sötpotatis...')

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
        title: 'Enkel Kycklingpaj med sötpotatis',
        description: 'Proteinrik kycklingpaj med sötpotatis, keso och blandade grönsaker. Enkel att göra och perfekt att servera med en grönsallad.',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/4xbzbJzf/2025-11-21-00-18-36-Recipe-Keeper.png',
        prepTimeMinutes: 20,
        cookTimeMinutes: 35,
        caloriesPerServing: 511,
        proteinPerServing: 51,
        fatPerServing: 3,
        carbsPerServing: 67,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingfilé i bitar', amount: '134', unit: 'gram (g)', grams: 134 },
      { name: 'Keso', amount: '67', unit: 'gram (g)', grams: 67 },
      { name: 'Sötpotatis', amount: '292', unit: 'gram (g)', grams: 292 },
      { name: 'Grönsaker, blandade', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Ägg', amount: '65', unit: 'gram (g)', grams: 65 },
      { name: 'Vatten', amount: '1', unit: 'deciliter (dl)', grams: 100 },
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
      'Om du inte har färdig kycklingfilé, gör bitar, stek och krydda efter smak.',
      'Skiva sötpotatisen med en osthyvel och lägg ut i pajformen.',
      'Vispa ihop ägg och vatten.',
      'Lägg i de färdiga kycklingbitarna och häll över äggsanningen.',
      'Toppa med keson och grädda tills pajen får fin färg.',
      'Servera med en grönsallad.',
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

    console.log('\n🎉 Recept "Enkel Kycklingpaj med sötpotatis" har skapats!')
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
