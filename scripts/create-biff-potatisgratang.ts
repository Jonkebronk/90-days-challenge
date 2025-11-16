import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutrition database for common ingredients (per 100g)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Ryggbiff': { calories: 143, protein: 20, carbs: 0, fat: 7 },
  'Potatis': { calories: 77, protein: 2, carbs: 17, fat: 0.1 },
  'Lök': { calories: 40, protein: 1.1, carbs: 9, fat: 0.1 },
  'Keso': { calories: 98, protein: 12, carbs: 4, fat: 4 },
  'Vatten': { calories: 0, protein: 0, carbs: 0, fat: 0 },
  'Färsk vitlök': { calories: 149, protein: 6.4, carbs: 33, fat: 0.5 },
  'Rosmarin': { calories: 131, protein: 3.3, carbs: 20, fat: 5.9 },
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
  console.log('🥩 Creating Biff med potatisgratäng recipe...\n')

  // Find Lunch & Middag category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'lunch' }
  })

  if (!category) {
    throw new Error('Lunch & Middag category not found')
  }

  // Create or find all food items
  const ryggbiff = await findOrCreateFoodItem('Ryggbiff')
  const potatis = await findOrCreateFoodItem('Potatis')
  const lok = await findOrCreateFoodItem('Lök')
  const keso = await findOrCreateFoodItem('Keso')
  const vatten = await findOrCreateFoodItem('Vatten')
  const vitlok = await findOrCreateFoodItem('Färsk vitlök')
  const rosmarin = await findOrCreateFoodItem('Rosmarin')

  console.log('\n🍳 Creating recipe...')

  // Create the recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Biff med potatisgratäng',
      description: 'En lyxig middag med en krämig potatisgratäng - så gott att du inte behöver någon sås!',
      categoryId: category.id,
      servings: 1,
      coverImage: 'https://i.postimg.cc/VLZPgqKN/2025-11-15-13-12-28-NVIDIA-Ge-Force-Overlay-DT.png',
      caloriesPerServing: 510,
      proteinPerServing: 46,
      carbsPerServing: 58,
      fatPerServing: 7,
      published: true,
      publishedAt: new Date(),

      ingredients: {
        create: [
          {
            foodItemId: ryggbiff.id,
            amount: 152,
            displayAmount: '152',
            displayUnit: 'g',
            notes: 'ryggbiff/entrecote eller liknande nötkött',
          },
          {
            foodItemId: potatis.id,
            amount: 318,
            displayAmount: '318',
            displayUnit: 'g',
          },
          {
            foodItemId: lok.id,
            amount: 200,
            displayAmount: '200',
            displayUnit: 'g',
          },
          {
            foodItemId: keso.id,
            amount: 75,
            displayAmount: '75',
            displayUnit: 'g',
            notes: 'lånat från mellis',
          },
          {
            foodItemId: vatten.id,
            amount: 30,
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: vitlok.id,
            amount: 30,
            displayAmount: '2',
            displayUnit: 'msk',
          },
          {
            foodItemId: rosmarin.id,
            amount: 15,
            displayAmount: '1',
            displayUnit: 'msk',
          },
        ],
      },

      instructions: {
        create: [
          {
            stepNumber: 1,
            instruction: 'Sätt ugnen på 185 grader (ej varmluft)',
          },
          {
            stepNumber: 2,
            instruction: 'Skär potatisen i tunna skivor och lägg i en ugnsplåt',
          },
          {
            stepNumber: 3,
            instruction: 'Mixa keso o vatten. Ha i hackad lök och pressa i vitlöken. Ha i svartpeppar och örtsalt efter smak.',
          },
          {
            stepNumber: 4,
            instruction: 'Häll nästan all kesoblandning på potatisen och rör runt. Häll resten på toppen.',
          },
          {
            stepNumber: 5,
            instruction: 'Sätt potatisgratängen i ugnen ca 30-40 min, tills den fått färg',
          },
          {
            stepNumber: 6,
            instruction: 'Stek köttet under tiden. Salta och peppra först. Stek gärna i slutjärnspanna på hög värme.',
          },
          {
            stepNumber: 7,
            instruction: 'Servera tillsammans med en fräsch sallad!',
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
