import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥪 Lägger till recept: Grovt bröd kesoröra och skinka...')

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
        title: 'Grovt bröd kesoröra och skinka',
        description: 'Proteinrik frukostmacka med krämig kesoröra med feta, skinka, sallad och tomat på grovt frö- och fullkornsbröd.',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/4xqJvv2j/2025-11-20-16-27-37-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Fröbröd med fullkorn och frön', amount: '50', unit: 'gram (g)', grams: 50 },
      { name: 'Keso mini, 1,5% fett', amount: '100', unit: 'milliliter (ml)', grams: 100 },
      { name: 'Fetaost 23% fett', amount: '30', unit: 'gram (g)', grams: 30 },
      { name: 'Skinka rökt/kokt pålägg 3% fett', amount: '30', unit: 'gram (g)', grams: 30 },
      { name: 'Isbergssallat', amount: '5', unit: 'gram (g)', grams: 5 },
      { name: 'Tomat', amount: '2', unit: 'skiva', grams: 20 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0].split('(')[0].trim(), mode: 'insensitive' } }
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
      'Blanda keso med mosad fetaost.',
      'Lägg salladsblad, skinka och kesoröran på brödet. Toppa med tomat och lite nymalen svartpeppar.',
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

    console.log('\n🎉 Recept "Grovt bröd kesoröra och skinka" har skapats!')
    console.log(`💡 Tips: Byt ut skinka mot kalkon, kyckling eller vegetariskt pålägg`)
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
