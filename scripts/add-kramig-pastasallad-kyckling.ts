import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🥗 Lägger till recept: Krämig pastasallad med kyckling och blandade grönsaker...')

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
        title: 'Krämig pastasallad med kyckling och blandade grönsaker',
        description: 'Proteinrik och mättande pastasallad med kikärtspasta, kyckling, kvarg och färska grönsaker. Perfekt som lunchbox eller enkel middag!',
        categoryId: kycklingCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/bYCBqxrD/2025-11-21-00-24-27-Recipe-Keeper.png',
        prepTimeMinutes: 20,
        cookTimeMinutes: 15,
        caloriesPerServing: 510,
        proteinPerServing: 53,
        fatPerServing: 4,
        carbsPerServing: 61,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Kyckling', amount: '154', unit: 'gram (g)', grams: 154 },
      { name: 'Kvarg, naturell', amount: '38', unit: 'gram (g)', grams: 38 },
      { name: 'Kikärtspasta', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Lök', amount: '92', unit: 'gram (g)', grams: 92 },
      { name: 'Paprika', amount: '108', unit: 'gram (g)', grams: 108 },
      { name: 'Gurka', amount: '70', unit: 'gram (g)', grams: 70 },
      { name: 'Vitlökspulver', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Paprikapulver', amount: '1', unit: 'tesked (tsk)', grams: 3 },
      { name: 'Sambal oelek', amount: '0.5', unit: 'krm', grams: 0.5 },
      { name: 'Stevia ketchup', amount: '0.5', unit: 'tesked (tsk)', grams: 2.5 },
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
      'Du skär kycklingen i tärningar och steker det i kokosolja. Samt kryddar kycklingen med vitlökspulver och paprikakrydda.',
      'Koka upp pastan. Häller av vattnet och kyler ner pastan. (Funkar att spola kallt vatten ett tag sen låta det stå)',
      'När kycklingen är klar, låt det svalna. Medan kan du skära upp grönsakerna och lägga i en bunke. (Nog stor så att pastan och kycklingen också ryms)',
      'När allt är svalt så lägger du det i bunken och tar kvargen. Här kan du krydda mer om du vill. Sambal oelek och stevia ketchup ska blandas ner samtidigt som kvargen.',
      'Rör ihop allt, smaka av och njut!!',
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

    console.log('\n🎉 Recept "Krämig pastasallad med kyckling och blandade grönsaker" har skapats!')
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
