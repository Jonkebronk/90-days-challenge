import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🐟 Lägger till recept: Superenkel tonfiskpasta...')

  try {
    // 1. Hitta Lunch & Middag-kategorin
    const lunchCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'lunch' }
    })

    if (!lunchCategory) {
      throw new Error('Lunch & Middag-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', lunchCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Superenkel tonfiskpasta',
        description: 'Superenkel och proteinrik tonfiskpasta med kvarg, bönpasta och grönsaker. Perfekt för en snabb och mättande lunch eller middag.',
        categoryId: lunchCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/VLGVgjnV/2025-11-21-01-09-54-Recipe-Keeper.png',
        prepTimeMinutes: 10,
        cookTimeMinutes: 10,
        caloriesPerServing: 511,
        proteinPerServing: 50,
        fatPerServing: 4,
        carbsPerServing: 64,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Tonfisk i vatten', amount: '103', unit: 'gram (g)', grams: 103 },
      { name: 'Kvarg från mellanmål', amount: '110', unit: 'gram (g)', grams: 110 },
      { name: 'Bönpasta (godast med skruvar)', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Rödlök', amount: '53', unit: 'gram (g)', grams: 53 },
      { name: 'Tomat', amount: '53', unit: 'gram (g)', grams: 53 },
      { name: 'Broccoli', amount: '95', unit: 'gram (g)', grams: 95 },
      { name: 'Ägg från frukost', amount: '65', unit: 'gram (g)', grams: 65 },
      { name: 'Dill', amount: '10', unit: 'gram (g)', grams: 10 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(' från')[0].split('(')[0].split(',')[0].trim(), mode: 'insensitive' } }
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
      'Blanda tonfisk, kvarg, dill, rödlök och kryddor i en plastbunke.',
      'Rör ihop steg 2 till en röra och lägg upp i en skål/tallrik.',
      'Lägg till tomaterna, ägget och broccolin i skålen.',
      'Lägg till den färdigkokta pastan i skålen och servera och njut! Jag hade också lite gurka till då det är "gratis".',
      'Koka upp broccoli och pasta.',
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

    console.log('\n🎉 Recept "Superenkel tonfiskpasta" har skapats!')
    console.log(`🔗 Recept-ID: ${recipe.id}`)
    console.log(`📊 Makro: ${recipe.caloriesPerServing} kcal, ${recipe.proteinPerServing}g protein, ${recipe.fatPerServing}g fett, ${recipe.carbsPerServing}g kolhydrater`)

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
