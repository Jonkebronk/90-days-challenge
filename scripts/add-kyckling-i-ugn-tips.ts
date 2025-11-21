import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Kyckling i ugn...')

  try {
    // 1. Hitta eller skapa Tips-kategorin
    let tipsCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'tips' }
    })

    if (!tipsCategory) {
      tipsCategory = await prisma.recipeCategory.create({
        data: {
          name: 'Tips',
          slug: 'tips',
          description: 'Tips på hur man kokar och tillagar mat'
        }
      })
      console.log('✓ Skapade ny kategori:', tipsCategory.name)
    } else {
      console.log('✓ Hittade kategori:', tipsCategory.name)
    }

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Kyckling i ugn',
        description: 'Tips på hur man tillagar saftig kycklingbröst i ugn. Bryns först i stekpanna, sedan gräddas i ugn med körsbärstomater.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/MpVhdnDF/2025-11-21-00-54-53-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 35,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kycklingbröst', amount: '1', unit: 'st', grams: 150 },
      { name: 'Joderat salt', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Svartpeppar', amount: '0.5', unit: 'tesked (tsk)', grams: 2 },
      { name: 'Tomat körsbärstomat röd', amount: '10', unit: 'st', grams: 100 },
      { name: 'Olivolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Sätt ugnen på 200 grader och hetta upp en stekpanna.',
      'Krydda kycklingen med salt och peppar och bryn runt om i lite olja. Lägg över till en rätt så trång ugnsfast form (oljan ska inte vara med).',
      'Dela småtomaterna och fördela dem över kycklingen. Grädda i ugnen i ca 35 minuter eller tills kycklingen är genomstekt.',
      'Under tiden fixar du en härlig sallad och kokar quinoa eller annat valfritt tillbehör.',
      'TIPS: Om du har gott om tid och vill ha en mörare kyckling kan du sänka värmen till 150 grader och låta kycklingen gräddas i ca 1,5 timme.',
      'OBS! Kontrollera alltid att kycklingen är helt genomstekt innan du äter.',
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

    console.log('\n🎉 Tips "Kyckling i ugn" har skapats!')
    console.log(`🔗 Recept-ID: ${recipe.id}`)

  } catch (error) {
    console.error('❌ Fel vid skapande av tips:', error)
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
