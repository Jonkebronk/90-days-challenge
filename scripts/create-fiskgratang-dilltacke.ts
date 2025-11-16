import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Torskfilé': { calories: 82, protein: 18, carbs: 0, fat: 0.7 },
  'Mini keso': { calories: 77, protein: 13, carbs: 3.5, fat: 0.3 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Fiskbuljongtärning': { calories: 20, protein: 1, carbs: 3, fat: 0.5 },
}

async function findOrCreateFoodItem(name: string) {
  // First try to find existing
  let foodItem = await prisma.foodItem.findFirst({
    where: {
      name: { contains: name, mode: 'insensitive' }
    }
  })

  if (!foodItem) {
    const nutrition = nutritionDatabase[name] || { calories: 100, protein: 5, carbs: 15, fat: 2 }

    foodItem = await prisma.foodItem.create({
      data: {
        name,
        calories: nutrition.calories,
        proteinG: nutrition.protein,
        carbsG: nutrition.carbs,
        fatG: nutrition.fat,
        commonServingSize: '100g',
      },
    })
    console.log(`✅ Created FoodItem: ${name}`)
  } else {
    console.log(`✓ Found existing FoodItem: ${name}`)
  }

  return foodItem
}

async function main() {
  console.log('🐟 Creating Fiskgratäng med dilltäcke recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const torsk = await findOrCreateFoodItem('Torskfilé')
  const minikeso = await findOrCreateFoodItem('Mini keso')
  const potatis = await findOrCreateFoodItem('Potatis')
  const fiskbuljong = await findOrCreateFoodItem('Fiskbuljongtärning')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Fiskgratäng med dilltäcke',
      description: 'En modifierad variant av den klassiska dillfiskgratängen utan allt smör och alla feta såser.',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/QCnPSfxm/2025-11-14-13-41-35-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 441,
      proteinPerServing: 45,
      carbsPerServing: 55,
      fatPerServing: 3,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: torsk.id,
            amount: 134,
            displayAmount: '134',
            displayUnit: 'g',
          },
          {
            foodItemId: minikeso.id,
            amount: 67,
            displayAmount: '67',
            displayUnit: 'g',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: fiskbuljong.id,
            amount: 5,
            displayAmount: '5',
            displayUnit: 'g',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Skala och koka potatisen mjuk',
          },
          {
            stepNumber: 2,
            instruction: 'Läge de tinade filéerna i en ugnsform och täck med aluminiumfolie i ca 10 min på 200 grader. Fisken ska vara nästan klar.',
          },
          {
            stepNumber: 3,
            instruction: 'Mosa potatisen och blanda i kokosoljan. Krydda efter tycke och smak.',
          },
          {
            stepNumber: 4,
            instruction: 'Lös upp fiskbuljongen i lite (väldigt lite) vatten och bland sen ner keson ihop med dillen och peppar. Låt keson smälta (det blir vättigt).',
          },
          {
            stepNumber: 5,
            instruction: 'Ta ut fisken och lägg potatismoset runt. Bred ut keson ovanpå fisken och komplettera med den sista keson ovanpå. Ställ in i ugnen ca 225 grader så det får färg.',
          },
          {
            stepNumber: 6,
            instruction: 'Klart! Servera med en god sallad.',
          },
        ],
      },
    },
  })

  console.log(`✅ Recipe created: ${recipe.title} (ID: ${recipe.id})`)
  console.log(`   - ${recipe.servings} portion`)
  console.log(`   - ${recipe.caloriesPerServing} kcal per portion`)
  console.log(`   - ${recipe.proteinPerServing}g protein`)
  console.log(`   - ${recipe.carbsPerServing}g carbs`)
  console.log(`   - ${recipe.fatPerServing}g fat`)
}

main()
  .catch((e) => {
    console.error('❌ Error:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
