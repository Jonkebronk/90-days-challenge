import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Nutritional data estimates per 100g (based on general food knowledge)
const nutritionDatabase: Record<string, { calories: number; protein: number; carbs: number; fat: number }> = {
  'Chiafrön': { calories: 486, protein: 16.5, carbs: 42.1, fat: 30.7 },
  'Frysta bär': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'Kvarg': { calories: 72, protein: 12.0, carbs: 4.0, fat: 0.2 },
  'Yoghurt': { calories: 61, protein: 3.5, carbs: 4.7, fat: 3.3 },
  'Havregryn': { calories: 389, protein: 16.9, carbs: 66.3, fat: 6.9 },
  'Bärblandning': { calories: 57, protein: 0.7, carbs: 14.5, fat: 0.3 },
  'KESO Cottage Cheese': { calories: 98, protein: 11.5, carbs: 3.4, fat: 4.0 },
  'Kanel': { calories: 247, protein: 4.0, carbs: 81.0, fat: 1.2 },
}

async function findOrCreateFoodItem(name: string) {
  // Try to find existing food item
  let foodItem = await prisma.foodItem.findFirst({
    where: {
      name: {
        contains: name,
        mode: 'insensitive',
      },
    },
  })

  if (!foodItem) {
    // Create new food item with estimated nutrition per 100g
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
    console.log(`Created FoodItem: ${name}`)
  } else {
    console.log(`Found existing FoodItem: ${name}`)
  }

  return foodItem
}

async function createRecipe1() {
  console.log('\n=== Creating Recipe 1: Variant på overnight oats ===\n')

  // Get Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' },
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Variant på overnight oats',
      description: 'Supersmarrig variant på overnight oats till frukost!',
      categoryId: category.id,
      servings: 1,
      caloriesPerServing: 488,
      proteinPerServing: 36,
      carbsPerServing: 49,
      fatPerServing: 16,
      published: true,
    },
  })

  console.log(`Created recipe: ${recipe.title} (ID: ${recipe.id})`)

  // Add ingredients
  const ingredients = [
    { name: 'Chiafrön', amount: 38, displayAmount: '38', displayUnit: 'g' },
    { name: 'Frysta bär', amount: 40, displayAmount: '40', displayUnit: 'g' },
    { name: 'Kvarg', amount: 150, displayAmount: '150', displayUnit: 'g', notes: 'valfri smak' },
    { name: 'Yoghurt', amount: 202, displayAmount: '202', displayUnit: 'g', notes: 'mini valfri smak' },
    { name: 'Havregryn', amount: 24, displayAmount: '24', displayUnit: 'g' },
  ]

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i]
    const foodItem = await findOrCreateFoodItem(ing.name)

    await prisma.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        foodItemId: foodItem.id,
        amount: ing.amount,
        displayAmount: ing.displayAmount,
        displayUnit: ing.displayUnit,
        notes: ing.notes,
        orderIndex: i,
      },
    })
    console.log(`Added ingredient: ${ing.name}`)
  }

  // Add instructions
  const instructions = [
    'Väg upp yoghurt, kvarg och havregryn i en förslutningsbar burk',
    'Tillsätt chiafrön och de frysta bären',
    'Blanda runt ordentligt',
    'Låt stå över natten och avnjut på morgonen med din favorit topping!',
  ]

  for (let i = 0; i < instructions.length; i++) {
    await prisma.recipeInstruction.create({
      data: {
        recipeId: recipe.id,
        stepNumber: i + 1,
        instruction: instructions[i],
      },
    })
    console.log(`Added step ${i + 1}`)
  }

  console.log(`\n✅ Recipe created successfully! ID: ${recipe.id}\n`)
  return recipe
}

async function createRecipe2() {
  console.log('\n=== Creating Recipe 2: Proteinrik frukostpaj ===\n')

  // Get Frukost category
  const category = await prisma.recipeCategory.findFirst({
    where: { slug: 'frukost' },
  })

  if (!category) {
    throw new Error('Frukost category not found')
  }

  // Create recipe
  const recipe = await prisma.recipe.create({
    data: {
      title: 'Proteinrik frukostpaj',
      description: 'Ät tillsammans med vaniljkvarg',
      categoryId: category.id,
      servings: 1,
      caloriesPerServing: 434,
      proteinPerServing: 25.4,
      carbsPerServing: 59.1,
      fatPerServing: 8.8,
      published: true,
    },
  })

  console.log(`Created recipe: ${recipe.title} (ID: ${recipe.id})`)

  // Add ingredients
  const ingredients = [
    { name: 'Bärblandning', amount: 200, displayAmount: '2', displayUnit: 'dl', notes: 'bärmix' },
    { name: 'Havregryn', amount: 150, displayAmount: '1,5', displayUnit: 'dl' },
    { name: 'KESO Cottage Cheese', amount: 100, displayAmount: '1', displayUnit: 'dl', notes: 'fett 4%' },
    { name: 'Kanel', amount: 1.25, displayAmount: '0,25', displayUnit: 'tsk', notes: 'malen' },
    { name: 'Kvarg', amount: 100, displayAmount: '1', displayUnit: 'dl', notes: 'vanilj fett 0,2%' },
  ]

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i]
    const foodItem = await findOrCreateFoodItem(ing.name)

    await prisma.recipeIngredient.create({
      data: {
        recipeId: recipe.id,
        foodItemId: foodItem.id,
        amount: ing.amount,
        displayAmount: ing.displayAmount,
        displayUnit: ing.displayUnit,
        notes: ing.notes,
        orderIndex: i,
      },
    })
    console.log(`Added ingredient: ${ing.name}`)
  }

  // Add instructions
  const instructions = [
    'Sätt ugnen på 225 grader',
    'Lägg bären i en liten ugnsäker form',
    'Blanda havregryn, keso och kanel. Fördela ovanpå bären',
    'Grädda i ca 15 minuter eller tills den fått lite färg',
  ]

  for (let i = 0; i < instructions.length; i++) {
    await prisma.recipeInstruction.create({
      data: {
        recipeId: recipe.id,
        stepNumber: i + 1,
        instruction: instructions[i],
        duration: i === 3 ? 15 : undefined, // Last step takes 15 minutes
      },
    })
    console.log(`Added step ${i + 1}`)
  }

  console.log(`\n✅ Recipe created successfully! ID: ${recipe.id}\n`)
  return recipe
}

async function main() {
  try {
    const recipe1 = await createRecipe1()
    const recipe2 = await createRecipe2()

    console.log('\n' + '='.repeat(60))
    console.log('✅ ALL RECIPES CREATED SUCCESSFULLY!')
    console.log('='.repeat(60))
    console.log(`\nRecipe 1: ${recipe1.title}`)
    console.log(`URL: /dashboard/recipes/${recipe1.id}`)
    console.log(`Edit: /dashboard/content/recipes/${recipe1.id}/edit`)
    console.log(`\nRecipe 2: ${recipe2.title}`)
    console.log(`URL: /dashboard/recipes/${recipe2.id}`)
    console.log(`Edit: /dashboard/content/recipes/${recipe2.id}/edit`)
    console.log('\n')
  } catch (error) {
    console.error('Error creating recipes:', error)
    throw error
  }
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
