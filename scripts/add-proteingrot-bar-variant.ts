import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('💪 Lägger till recept: Proteingröt med bär (variant)...')

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
        title: 'Proteingröt med bär (variant)',
        description: 'Proteinrik gröt med havregryn, wheyprotein och färska bär. Tips: Blanda bara hälften av proteinpulvret i gröten och andra hälften i vatten för topping. Du kan även göra en shake av ingredienserna om du är på språng!',
        categoryId: frukostCategory.id,
        servings: 1,
        coverImage: 'https://i.postimg.cc/HsWZzffg/2025-11-20-16-44-20-Recipe-Keeper.png',
        prepTimeMinutes: 5,
        cookTimeMinutes: 2,
        caloriesPerServing: null,
        proteinPerServing: null,
        fatPerServing: null,
        carbsPerServing: null,
      }
    })

    console.log('✓ Skapat recept:', recipe.title, `(ID: ${recipe.id})`)

    // 3. Lägg till ingredienser
    const ingredients = [
      { name: 'Havregryn', amount: '60', unit: 'gram (g)', grams: 60 },
      { name: 'Proteinpulver Whey', amount: '1', unit: 'skopa (ca 30g)', grams: 30 },
      { name: 'Bär (blåbär, hallon eller jordgubbar)', amount: '100', unit: 'gram (g)', grams: 100 },
      { name: 'Kokosolja eller jordnötssmör eller mandlar', amount: '10/10/30', unit: 'gram (g)', grams: 10 },
      { name: 'Vatten', amount: '120', unit: 'milliliter (ml)', grams: 120 },
      { name: 'Salt', amount: '1', unit: 'nypa', grams: 1 },
    ]

    for (const ing of ingredients) {
      // Försök hitta eller skapa foodItem
      let foodItem = await prisma.foodItem.findFirst({
        where: { name: { contains: ing.name.split(' eller')[0].split('(')[0].trim(), mode: 'insensitive' } }
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
      'Blanda havregryn med önskad mängd vatten, salta havregrynet.',
      'Koka eller micra (ca 2 minuter på hög effekt).',
      'Låt gröten svalna, rör sedan ner proteinpulvret och ev. kokosoljan om det är ditt val av fettkälla.',
      'Toppa med bär, förslagsvis blåbär, hallon eller jordgubbar. OM du inte hade i kokosoljan så har du i jordnötsmör eller mandlarna enligt angivet mått!',
    ]

    for (let i = 0; i < instructions.length; i++) {
      await prisma.recipeInstruction.create({
        data: {
          recipeId: recipe.id,
          stepNumber: i + 1,
          instruction: instructions[i],
          duration: i === 1 ? 2 : null,
        }
      })
    }

    console.log('✓ Lagt till', instructions.length, 'instruktioner')

    console.log('\n🎉 Recept "Proteingröt med bär (variant)" har skapats!')
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
