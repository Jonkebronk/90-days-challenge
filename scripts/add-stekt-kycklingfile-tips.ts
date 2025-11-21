import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💡 Lägger till tips: Stekt kycklingfilé...')

  try {
    // 1. Hitta Tips-kategorin
    const tipsCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'tips' }
    })

    if (!tipsCategory) {
      throw new Error('Tips-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', tipsCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Stekt kycklingfilé',
        description: 'Guide för att steka saftig kycklingfilé. Bryn i panna och tillaga sedan i ugn till innertemperatur 70 grader för perfekt resultat.',
        categoryId: tipsCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/x1Nb72Jp/2025-11-21-01-01-50-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 25,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kyckling bröstfilé (i u. skinn)', amount: '150', unit: 'gram (g)', grams: 150 },
      { name: 'Joderat salt', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Olivolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Salta och peppra kycklingen. Tips på variationer på kryddning hittar du här nedanför.',
      'Sätt ugnen på 175 grader (150 grader i varmluftugn).',
      'Hetta upp en stekpanna på medelvärme och bryn kycklingen gyllenbrun i olivolja. Fettet ska inte ätas men ger fin färg och smak.',
      'Lyft upp kycklingen, lägg i en ugnsfast form och ställ in i mitten av ugnen. Använd helst en termometer, för kycklingen är saftigast och godast när innertemperaturen är 70 grader. Det tar ca 20 minuter',
      'Under den tiden kan du gärna steka lite goda grönsaker eller göra en sallad som tillbehör.',
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

    console.log('\n🎉 Tips "Stekt kycklingfilé" har skapats!')
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
