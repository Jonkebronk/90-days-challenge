import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥓 Lägger till recept: Avokado, keso, bacon och knäckebröd...')

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
        title: 'Avokado, keso, bacon och knäckebröd',
        description: 'Näringsrik frukost med knaprig kalkonbacon, krämig keso, färsk avokado och knäckebröd.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/sxvj9BcQ/2025-11-20-16-14-24-Recipe-Keeper.png',
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Knäckebröd', amount: '6', unit: 'st', grams: 78 },
      { name: 'Mini keso, 1,5%', amount: '169', unit: 'gram (g)', grams: 169 },
      { name: 'Avokado, färsk', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Kalkonbacon', amount: '2.5', unit: 'skiva', grams: 62 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0], mode: 'insensitive' } }
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
      'Värm en stekpanna på medelvärme och stek kalkonbaconen tills den har fått färg och är knaprig. Lägg sedan kalkonbaconen på hushållspapper så att det får rinna av och bli extra knaprig.',
      'Dela avokadon, ta ur kärnan och gröpa ur halvorna med en sked och skiva.',
      'Tillsätt avokadon och kalkonbaconen till keson eller ät kalkonbaconen vid sidan om. Toppa knäckebrödet med kesoblandningen eller ät det vid sidan om.',
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

    console.log('\n🎉 Recept "Avokado, keso, bacon och knäckebröd" har skapats!')
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
