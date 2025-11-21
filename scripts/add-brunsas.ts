import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥘 Lägger till recept: Brunsås...')

  try {
    // 1. Hitta Såser-kategorin
    const saserCategory = await prisma.recipeCategory.findFirst({
      where: { slug: 'saser' }
    })

    if (!saserCategory) {
      throw new Error('Såser-kategorin hittades inte!')
    }

    console.log('✓ Hittade kategori:', saserCategory.name)

    // 2. Skapa receptet
    const recipe = await prisma.recipe.create({
      data: {
        title: 'Brunsås',
        description: 'Klassisk brunsås med smör, vetemjöl, kalvfond, grädde, soja och vinbärsgelé.',
        categoryId: saserCategory.id,
        servings: 4,
        coverImage: 'https://i.postimg.cc/zX6J1SwW/2025-11-20-17-05-00-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 10,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Smör fett 80%', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Vetemjöl', amount: '2', unit: 'matsked (msk)', grams: 20 },
      { name: 'Vatten kranvatten', amount: '4', unit: 'deciliter (dl)', grams: 400 },
      { name: 'Kalvfond', amount: '4', unit: 'tesked (tsk)', grams: 12 },
      { name: 'Matlagningsgrädde fett 15%', amount: '0.5', unit: 'deciliter (dl)', grams: 50 },
      { name: 'Sojasås', amount: '1', unit: 'tesked (tsk)', grams: 5 },
      { name: 'Gelé svarta vinbär', amount: '1', unit: 'matsked (msk)', grams: 15 },
      { name: 'Vitpeppar, malen', amount: '0.2', unit: 'tesked (tsk)', grams: 0.5 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(',')[0].split(' fett')[0].trim(), mode: 'insensitive' } }
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
      'Smält smör eller margarin i en kastrull.',
      'Tillsätt mjöl och vispa ut det. Bryn mjölet ljusbrunt någon minut under omrörning.',
      'Tillsätt vätskan lite i taget under omrörning.',
      'Låt såsen småkoka under omrörning i ca 5 minuter.',
      'Smaka av med soja, gelé, vitpeppar och eventuellt lite salt.',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 3 ? 5 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Brunsås" har skapats!')
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
