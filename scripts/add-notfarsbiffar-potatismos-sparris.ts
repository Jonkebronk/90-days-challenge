import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥩 Lägger till recept: Nötfärsbiffar med potatismos och sparris...')

  try {
    // 1. Hitta Nötkött-kategorin
    const notkottCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'notkott' }
    })

    if (!notkottCategory) {
      throw new Error('Nötkött-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', notkottCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Nötfärsbiffar med potatismos och sparris',
        description: 'Saftig nötfärsbiff kryddad med chiliflakes, vitlök och sambal oelek. Serveras med krämigt potatismos med vitpeppar och stekt sparris.',
        categoryId: notkottCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/xjmqGRm5/2025-11-21-00-43-24-Recipe-Keeper.png',
        prepTimeMinutes: 20,
        cookTimeMinutes: 25,
        caloriesPerServing: 510,
        proteinPerServing: 46,
        fatPerServing: 7,
        carbsPerServing: 58,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Nötfärs 6%', amount: '152', unit: 'gram (g)', grams: 152 },
      { name: 'Potatis', amount: '318', unit: 'gram (g)', grams: 318 },
      { name: 'Sparris', amount: '200', unit: 'gram (g)', grams: 200 },
      { name: 'Chiliflakes', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Vitpeppar', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Svartpeppar', amount: '1', unit: 'nypa', grams: 1 },
      { name: 'Vitlök', amount: '2', unit: 'klyftor', grams: 10 },
      { name: 'Sambal oelek', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Kokosolja', amount: '1', unit: 'tesked (tsk)', grams: 5 },
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
      'Skala potatis och koka upp.',
      'Förbered färsen genom att knåda in alla kryddor du vill ha. Var inte rädd för att krydda!',
      'Blöt händerna och forma till biffar. Stek sedan i kokosolja.',
      'Sparrisen sköljer du av och bryter väck den dåliga änden. Stek sedan detta i "skyn" av biffarna så får du en god smak på dessa.',
      'När potatisen har kokat stompar du den och tillsätter vitpeppar.',
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

    console.log('\n🎉 Recept "Nötfärsbiffar med potatismos och sparris" har skapats!')
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
