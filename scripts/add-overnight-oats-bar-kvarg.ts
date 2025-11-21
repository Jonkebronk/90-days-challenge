import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🫐 Lägger till recept: Overnight oats med bär och kvarg...')

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
        title: 'Overnight oats med bär och kvarg',
        description: 'Enkel och nyttig overnight oats med hallon, blåbär, kvarg och kanel. För en komplett frukost, ät med ägg (medelstort ca 65g).',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/7YVvY1yN/2025-11-20-16-42-52-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 0,
        caloriesPerServing: 306,
        proteinPerServing: 24,
        fatPerServing: 5,
        carbsPerServing: 36,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Hallon', amount: '20', unit: 'gram (g)', grams: 20 },
      { name: 'Blåbär', amount: '20', unit: 'gram (g)', grams: 20 },
      { name: 'Kvarg, naturell, 0.2% fett', amount: '151', unit: 'gram (g)', grams: 151 },
      { name: 'Havregryn', amount: '48', unit: 'gram (g)', grams: 48 },
      { name: 'Vatten', amount: '100', unit: 'milliliter (ml)', grams: 100 },
      { name: 'Kanel', amount: '1', unit: 'tesked (tsk)', grams: 0 },
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
      'Mät upp havregryn i en burk.',
      'Häll på vatten så att det blötlägger havregryn.',
      'Lägg i bären ovanpå.',
      'Sätt på lock och ställ in i kylen över natten.',
      'På morgonen lägger du på kvargen och toppar med lite kanel. Mums!',
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

    console.log('\n🎉 Recept "Overnight oats med bär och kvarg" har skapats!')
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
